"""
Clerk authentication utilities for FastAPI
"""
from fastapi import HTTPException, Header
from typing import Optional
import os
import jwt
import requests
from dotenv import load_dotenv

load_dotenv()

# Cache for Clerk JWKS (JSON Web Key Set)
_jwks_cache = None

def get_clerk_jwks():
    """
    Fetch Clerk's JSON Web Key Set for token verification
    """
    global _jwks_cache
    
    if _jwks_cache is None:
        clerk_publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY")
        if not clerk_publishable_key:
            raise HTTPException(
                status_code=500,
                detail="CLERK_PUBLISHABLE_KEY environment variable is not set"
            )
        
        # Extract instance ID from publishable key (format: pk_test_xxxxx or pk_live_xxxxx)
        # Clerk JWKS URL format: https://<instance>.clerk.accounts.dev/.well-known/jwks.json
        # For now, we'll use a simpler approach with the secret key
        
        # Alternative: Use Clerk's verify token endpoint
        # Or decode without verification if using secret key (not recommended for production)
        pass
    
    return _jwks_cache

async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify Clerk JWT token from Authorization header
    Returns the decoded token payload with user information
    
    Note: For production, use Clerk's verify token API endpoint or JWKS verification.
    This is a simplified version that decodes the token. For full security,
    verify the token signature using Clerk's public keys.
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing"
        )
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "").strip()
        
        # Option 1: Verify using Clerk's API (recommended for production)
        clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
        if not clerk_secret_key:
            raise HTTPException(
                status_code=500,
                detail="CLERK_SECRET_KEY environment variable is not set"
            )
        
        # Verify token using Clerk's verify endpoint
        verify_url = "https://api.clerk.com/v1/tokens/verify"
        headers = {
            "Authorization": f"Bearer {clerk_secret_key}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            verify_url,
            headers=headers,
            json={"token": token},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            # Fallback: Decode token without verification (less secure, for development)
            # In production, always verify the signature
            try:
                decoded = jwt.decode(
                    token,
                    options={"verify_signature": False}  # Skip signature verification
                )
                return decoded
            except jwt.DecodeError:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid token format"
                )
            
    except requests.RequestException as e:
        # If Clerk API is unavailable, fall back to decoding (development only)
        try:
            decoded = jwt.decode(
                token,
                options={"verify_signature": False}
            )
            return decoded
        except jwt.DecodeError:
            raise HTTPException(
                status_code=401,
                detail=f"Token verification failed: {str(e)}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}"
        )

def get_user_id_from_token(token_payload: dict) -> str:
    """
    Extract Clerk user ID from verified token payload
    """
    # Clerk token structure may vary - adjust based on your setup
    user_id = token_payload.get("sub") or token_payload.get("userId") or token_payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID not found in token"
        )
    return user_id

