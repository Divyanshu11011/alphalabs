# Clerk + Supabase Integration Setup Guide

## Why Connect Clerk and Supabase?

**Clerk** handles:
- User authentication (login, signup, password reset)
- Session management
- Social OAuth (Google, GitHub, etc.)
- Multi-factor authentication
- User management UI

**Supabase** stores:
- User profile data
- Application-specific user data
- Relationships between users and other entities
- Custom business logic data

**The Integration**:
- Clerk manages authentication, Supabase stores your application data
- When users sign up in Clerk, they're automatically synced to Supabase
- Your backend can verify Clerk tokens and fetch user data from Supabase
- This separation allows you to scale and customize your user data independently

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `env.example` to `.env` and fill in:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Optional: For webhook signature verification
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Where to find these:**
- **SUPABASE_URL & SUPABASE_KEY**: Supabase Dashboard → Project Settings → API
- **CLERK_SECRET_KEY**: Clerk Dashboard → API Keys → Secret Key
- **CLERK_WEBHOOK_SECRET**: Clerk Dashboard → Webhooks → Your webhook → Signing Secret

### 3. Create the Users Table in Supabase

You have three options:

#### Option A: Using Migration Script (Recommended - Easiest)

1. Make sure `DB_CONNECTION_STRING` is set in your `.env` file:
   ```bash
   DB_CONNECTION_STRING=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
   Get this from: Supabase Dashboard → Settings → Database → Connection string → URI

2. Run the migration:
   ```bash
   python migrate.py
   ```
   Or use the shell script:
   ```bash
   ./run_migrations.sh
   ```

This will automatically run all migration files in the `migrations/` directory.

#### Option B: Using Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `migrations/001_create_users_table.sql`
3. Run the query

#### Option C: Using psql Command Line

```bash
psql "your_db_connection_string" -f migrations/001_create_users_table.sql
```

### 4. Set Up Clerk Webhooks (Optional but Recommended)

Webhooks automatically sync users when they sign up/update in Clerk:

1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter your backend URL: `https://your-backend-url.com/api/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret and add it to `.env` as `CLERK_WEBHOOK_SECRET`

### 5. Test the Integration

#### Test User Sync Endpoint

After a user signs in through Clerk frontend, call:

```bash
curl -X POST http://localhost:5000/api/users/sync \
  -H "Authorization: Bearer <clerk_session_token>" \
  -H "Content-Type: application/json"
```

#### Test Get Current User

```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <clerk_session_token>"
```

## API Endpoints

### `POST /api/users/sync`
Syncs or creates a user in Supabase from Clerk token. Call this after user signs in.

**Headers:**
- `Authorization: Bearer <clerk_token>`

**Response:**
```json
{
  "message": "User created",
  "user": {
    "id": "uuid",
    "clerk_id": "user_xxx",
    "email": "user@example.com",
    ...
  }
}
```

### `GET /api/users/me`
Gets current user profile from Supabase.

**Headers:**
- `Authorization: Bearer <clerk_token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "clerk_id": "user_xxx",
    "email": "user@example.com",
    ...
  }
}
```

### `POST /api/webhooks/clerk`
Webhook endpoint for automatic user synchronization. Configure in Clerk dashboard.

## Frontend Integration

After user signs in with Clerk, call the sync endpoint:

```typescript
// Example: After Clerk sign-in
const { getToken } = useAuth();

const syncUser = async () => {
  const token = await getToken();
  const response = await fetch('http://localhost:5000/api/users/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};
```

## Database Schema

The `users` table includes:
- `clerk_id`: Unique Clerk user identifier
- `email`: User email address
- `first_name`, `last_name`: User name
- `username`: Optional username
- `image_url`: Profile image URL
- `is_active`: Soft delete flag
- `metadata`: JSONB field for custom data
- `created_at`, `updated_at`: Timestamps

## Security Notes

1. **Never expose** `CLERK_SECRET_KEY` or `SUPABASE_KEY` in frontend code
2. Always verify Clerk tokens in backend before accessing Supabase
3. Use Row Level Security (RLS) in Supabase for additional protection
4. Enable webhook signature verification in production

## Troubleshooting

### "User not found in database"
- User hasn't been synced yet. Call `/api/users/sync` first.

### "Invalid or expired token"
- Check that `CLERK_SECRET_KEY` is correct
- Verify token is being sent correctly in Authorization header

### "SUPABASE_URL and SUPABASE_KEY environment variables are required"
- Make sure `.env` file exists and contains these variables
- Restart your FastAPI server after updating `.env`

