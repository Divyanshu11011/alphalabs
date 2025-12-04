# AlphaLabs

A monorepo project with a Next.js frontend and FastAPI backend.

## Project Structure

```
alphalabs/
├── frontend/          # Next.js application
├── backend/           # Flask API server
├── package.json       # Root package.json with Bun workspaces
└── README.md
```

## Prerequisites

- [Bun](https://bun.sh) - JavaScript runtime and package manager
- Python 3.8+ - For Flask backend
- Node.js 18+ (optional, Bun handles this)

## Setup

### 1. Install Frontend Dependencies

```bash
bun install
```

This will install JavaScript/TypeScript dependencies for the frontend workspace only.

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Copy the environment example file:
```bash
# On Windows PowerShell
Copy-Item env.example .env

# On Unix/Mac
cp env.example .env
```

4. Edit `.env` and add the required secrets. At minimum you’ll need:
```
DATABASE_URL=postgres://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
OPENROUTER_API_KEY=sk-...
CLERK_SECRET_KEY=sk_test_...
WEBSOCKET_BASE_URL=ws://localhost:5000
CERTIFICATE_SHARE_BASE_URL=https://your-domain.example.com/verify
CERTIFICATE_BUCKET=certificates
EXPORT_BUCKET=exports
```

> See `backend/env.example` for the full list of supported variables.

### 3. Frontend Setup

Create a `frontend/.env.local` file so the Next.js app knows where to reach the API and websockets:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### 3. Frontend Setup

The frontend is already configured with:
- Next.js 16
- TypeScript
- Tailwind CSS
- shadcn/ui
- Clerk authentication

## Development

### Run Both Services

**Option 1: Using Bun (Recommended)**
```bash
bun run dev
```

**Option 2: Using PowerShell Script (Windows)**
```powershell
.\run-dev.ps1
```

**Option 3: Run Separately**

If you need to run the frontend and backend in separate terminal windows:

**Frontend (from root directory):**
```bash
bun run dev:frontend
```

Or navigate to frontend and run directly:
```bash
cd frontend
bun run dev
```

**Backend (from root directory):**
```bash
bun run dev:backend
```

Or navigate to backend and run directly:
```bash
cd backend
python app.py
```

**Note:** When running separately, make sure to run them in different terminal windows/tabs so both can run simultaneously.

### Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- WebSocket Base: ws://localhost:5000
- Backend Health: http://localhost:5000/api/health

### Environment Reference

- `backend/env.example` – all backend runtime variables (database, Supabase storage, Clerk, OpenRouter, websocket + storage buckets).
- `frontend/.env.local` – browser-safe variables such as `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.

## Adding shadcn/ui Components

To add shadcn components to the frontend:

```bash
cd frontend
bun run ui:add [component-name]
```

Example:
```bash
bun run ui:add button
bun run ui:add card
```

## OpenRouter Integration

The backend includes an OpenRouter proxy endpoint at `/api/openrouter/chat`. 

Make sure to set your `OPENROUTER_API_KEY` in the backend `.env` file.

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Clerk (Authentication)

### Backend
- Flask
- Python
- OpenRouter API integration

### Tooling
- Bun (Package manager & runtime)
- Monorepo workspace structure

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

**Important:** This license requires that if you use this software as a service (SaaS), you must make the source code available to your users. This is the most restrictive OSI-approved license available.
