from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
import json
from dotenv import load_dotenv
from database import get_supabase_client
from auth import verify_clerk_token, get_user_id_from_token
from webhooks import verify_webhook_signature, handle_user_created, handle_user_updated, handle_user_deleted

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/api/health')
def health():
    return {"status": "ok", "service": "backend"}

@app.post('/api/openrouter/chat')
def openrouter_chat(request_data: dict):
    """
    Proxy endpoint for OpenRouter API
    """
    import requests
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    # Forward to OpenRouter
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv('OPENROUTER_HTTP_REFERER', 'http://localhost:3000'),
        "X-Title": os.getenv('OPENROUTER_X_TITLE', 'AlphaLabs')
    }
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=request_data,
            timeout=30
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/users/sync')
async def sync_user(
    authorization: Optional[str] = Header(None)
):
    """
    Sync or create user in Supabase from Clerk token
    This endpoint should be called after user signs in/up in Clerk
    """
    try:
        # Verify Clerk token
        token_payload = await verify_clerk_token(authorization)
        clerk_user_id = get_user_id_from_token(token_payload)
        
        # Get user info from token
        # Clerk token structure: sub (user ID), email, and other claims
        # The token may contain user data directly or we may need to fetch from Clerk API
        email = token_payload.get("email")
        first_name = token_payload.get("first_name") or token_payload.get("given_name")
        last_name = token_payload.get("last_name") or token_payload.get("family_name")
        username = token_payload.get("username")
        image_url = token_payload.get("image_url") or token_payload.get("picture")
        
        # If email not in token, try to fetch from Clerk API using user ID
        if not email:
            clerk_user_id = get_user_id_from_token(token_payload)
            # Fetch user details from Clerk API
            import requests
            clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
            if clerk_secret_key:
                try:
                    user_response = requests.get(
                        f"https://api.clerk.com/v1/users/{clerk_user_id}",
                        headers={"Authorization": f"Bearer {clerk_secret_key}"},
                        timeout=10
                    )
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        email = user_data.get("email_addresses", [{}])[0].get("email_address") if user_data.get("email_addresses") else None
                        first_name = first_name or user_data.get("first_name")
                        last_name = last_name or user_data.get("last_name")
                        username = username or user_data.get("username")
                        image_url = image_url or user_data.get("image_url")
                except Exception:
                    pass  # Continue with available data
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in token")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Check if user exists
        existing_user = supabase.table("users").select("*").eq("clerk_id", clerk_user_id).execute()
        
        if existing_user.data:
            # Update existing user
            user_data = {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                "image_url": image_url,
            }
            # Remove None values
            user_data = {k: v for k, v in user_data.items() if v is not None}
            
            result = supabase.table("users").update(user_data).eq("clerk_id", clerk_user_id).execute()
            return {"message": "User updated", "user": result.data[0] if result.data else None}
        else:
            # Create new user
            user_data = {
                "clerk_id": clerk_user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                "image_url": image_url,
            }
            # Remove None values
            user_data = {k: v for k, v in user_data.items() if v is not None}
            
            result = supabase.table("users").insert(user_data).execute()
            return {"message": "User created", "user": result.data[0] if result.data else None}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing user: {str(e)}")

@app.get('/api/users/me')
async def get_current_user(
    authorization: Optional[str] = Header(None)
):
    """
    Get current user profile from Supabase
    Protected endpoint - requires valid Clerk token
    """
    try:
        # Verify Clerk token
        token_payload = await verify_clerk_token(authorization)
        clerk_user_id = get_user_id_from_token(token_payload)
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Fetch user from database
        result = supabase.table("users").select("*").eq("clerk_id", clerk_user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found in database")
        
        return {"user": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

@app.post('/api/webhooks/clerk')
async def clerk_webhook(request: Request, svix_id: Optional[str] = Header(None), svix_timestamp: Optional[str] = Header(None), svix_signature: Optional[str] = Header(None)):
    """
    Clerk webhook endpoint for automatic user synchronization
    Configure this URL in Clerk dashboard -> Webhooks
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        
        # Verify webhook signature
        if svix_signature:
            # Clerk uses Svix for webhooks - signature format: v1,<signature>
            signature_parts = svix_signature.split(",")
            if len(signature_parts) == 2:
                signature = signature_parts[1]
                if not verify_webhook_signature(body, signature):
                    raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Parse webhook data
        data = await request.json()
        event_type = data.get("type")
        
        # Handle different event types
        if event_type == "user.created":
            result = await handle_user_created(data)
            return result
        elif event_type == "user.updated":
            result = await handle_user_updated(data)
            return result
        elif event_type == "user.deleted":
            result = await handle_user_deleted(data)
            return result
        else:
            return {"message": f"Event type {event_type} not handled"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv('PORT', 5000))
    uvicorn.run("app:app", host='0.0.0.0', port=port, reload=True)

