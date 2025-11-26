# Backend API

FastAPI backend server for AlphaLabs with Clerk authentication and Supabase database.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `env.example` to `.env` and fill in your configuration:
```bash
# On Windows PowerShell
Copy-Item env.example .env

# On Unix/Mac
cp env.example .env
```

3. Run database migrations:
```bash
python migrate.py
```
This will create the necessary tables in Supabase. Make sure `DB_CONNECTION_STRING` is set in your `.env` file.

4. Run the server:
```bash
python app.py
```

The server will run on `http://localhost:5000` by default.

## Database Migrations

To run migrations:
```bash
python migrate.py
```

Or use the shell script:
```bash
./run_migrations.sh
```

Migrations are located in the `migrations/` directory and are executed in alphabetical order.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/openrouter/chat` - Proxy endpoint for OpenRouter API
- `POST /api/users/sync` - Sync user from Clerk to Supabase
- `GET /api/users/me` - Get current user profile (requires Clerk token)
- `POST /api/webhooks/clerk` - Clerk webhook endpoint for automatic user sync

## Documentation

- See `SETUP_GUIDE.md` for detailed Clerk + Supabase integration setup
- See `FINDING_SUPABASE_KEYS.md` for help finding Supabase API keys

