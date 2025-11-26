"""
Database connection and utilities for Supabase
"""
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance
    
    Requires either:
    - SUPABASE_URL and SUPABASE_KEY (recommended for Supabase client)
    - Or DB_CONNECTION_STRING (for direct PostgreSQL access, but Supabase client needs URL + KEY)
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if supabase_url and supabase_key:
        return create_client(supabase_url, supabase_key)
    
    # If using connection string, you still need URL and KEY for Supabase client
    # The connection string is for direct PostgreSQL access (psql, SQLAlchemy, etc.)
    db_connection_string = os.getenv("DB_CONNECTION_STRING")
    if db_connection_string:
        raise ValueError(
            "DB_CONNECTION_STRING is set, but SUPABASE_URL and SUPABASE_KEY are required "
            "for Supabase Python client. Use SUPABASE_URL and SUPABASE_KEY from your "
            "Supabase project settings (Settings -> API)."
        )
    
    raise ValueError(
        "Either SUPABASE_URL and SUPABASE_KEY, or DB_CONNECTION_STRING must be set. "
        "For Supabase client, use SUPABASE_URL and SUPABASE_KEY from project settings."
    )

