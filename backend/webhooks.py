"""
Clerk webhook handlers for automatic user synchronization
Set up webhooks in Clerk dashboard to call these endpoints
"""
from fastapi import FastAPI, HTTPException, Request, Header
import os
import hmac
import hashlib
import json
from typing import Optional
from database import get_supabase_client

# Initialize webhook secret from environment
WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Clerk webhook signature (Svix format)
    Note: Clerk uses Svix for webhooks. The signature verification
    may need adjustment based on your Clerk webhook configuration.
    """
    if not WEBHOOK_SECRET:
        # If no secret configured, skip verification (not recommended for production)
        return True
    
    # Clerk/Svix signature format: v1,<signature>
    # The signature is computed over: timestamp + "." + payload
    # This is a simplified version - adjust based on Svix documentation
    try:
        expected_signature = hmac.new(
            WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False

async def handle_user_created(data: dict):
    """
    Handle user.created webhook event from Clerk
    """
    try:
        user_data = data.get("data", {})
        clerk_id = user_data.get("id")
        
        if not clerk_id:
            return {"error": "User ID not found"}
        
        # Extract user information
        email_addresses = user_data.get("email_addresses", [])
        primary_email = email_addresses[0].get("email_address") if email_addresses else None
        
        first_name = user_data.get("first_name")
        last_name = user_data.get("last_name")
        username = user_data.get("username")
        image_url = user_data.get("image_url")
        
        if not primary_email:
            return {"error": "Email not found"}
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Create user in Supabase
        user_record = {
            "clerk_id": clerk_id,
            "email": primary_email,
            "first_name": first_name,
            "last_name": last_name,
            "username": username,
            "image_url": image_url,
        }
        
        # Remove None values
        user_record = {k: v for k, v in user_record.items() if v is not None}
        
        result = supabase.table("users").insert(user_record).execute()
        
        return {"success": True, "user": result.data[0] if result.data else None}
        
    except Exception as e:
        return {"error": str(e)}

async def handle_user_updated(data: dict):
    """
    Handle user.updated webhook event from Clerk
    """
    try:
        user_data = data.get("data", {})
        clerk_id = user_data.get("id")
        
        if not clerk_id:
            return {"error": "User ID not found"}
        
        # Extract updated user information
        email_addresses = user_data.get("email_addresses", [])
        primary_email = email_addresses[0].get("email_address") if email_addresses else None
        
        first_name = user_data.get("first_name")
        last_name = user_data.get("last_name")
        username = user_data.get("username")
        image_url = user_data.get("image_url")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Update user in Supabase
        update_data = {}
        if primary_email:
            update_data["email"] = primary_email
        if first_name is not None:
            update_data["first_name"] = first_name
        if last_name is not None:
            update_data["last_name"] = last_name
        if username is not None:
            update_data["username"] = username
        if image_url is not None:
            update_data["image_url"] = image_url
        
        if update_data:
            result = supabase.table("users").update(update_data).eq("clerk_id", clerk_id).execute()
            return {"success": True, "user": result.data[0] if result.data else None}
        
        return {"success": True, "message": "No updates needed"}
        
    except Exception as e:
        return {"error": str(e)}

async def handle_user_deleted(data: dict):
    """
    Handle user.deleted webhook event from Clerk
    """
    try:
        user_data = data.get("data", {})
        clerk_id = user_data.get("id")
        
        if not clerk_id:
            return {"error": "User ID not found"}
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Soft delete or hard delete user
        # Option 1: Soft delete (recommended)
        result = supabase.table("users").update({"is_active": False}).eq("clerk_id", clerk_id).execute()
        
        # Option 2: Hard delete (uncomment if preferred)
        # result = supabase.table("users").delete().eq("clerk_id", clerk_id).execute()
        
        return {"success": True, "message": "User deleted"}
        
    except Exception as e:
        return {"error": str(e)}

