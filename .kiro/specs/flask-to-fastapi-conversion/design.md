# Design Document

## Overview

The Flask to FastAPI conversion will replace the existing Flask application with a FastAPI implementation that maintains 100% API compatibility. FastAPI offers several advantages including automatic OpenAPI documentation, better performance, native async support, and built-in request/response validation. The conversion will be straightforward since the current Flask app has a simple structure with only two endpoints.

## Architecture

### Current Flask Architecture
```
Flask App
├── Health endpoint (/api/health)
├── OpenRouter proxy (/api/openrouter/chat)
├── CORS middleware
└── Environment configuration
```

### New FastAPI Architecture
```
FastAPI App
├── Health endpoint (/api/health) - converted to FastAPI route
├── OpenRouter proxy (/api/openrouter/chat) - converted to FastAPI route
├── CORS middleware (FastAPI CORSMiddleware)
├── Environment configuration (unchanged)
└── Automatic OpenAPI docs (/docs, /redoc)
```

### Key Architectural Changes
1. **Framework**: Flask → FastAPI
2. **CORS**: flask-cors → FastAPI CORSMiddleware
3. **Route decorators**: @app.route → @app.get/@app.post
4. **Request handling**: Flask request object → FastAPI dependency injection
5. **Response handling**: Flask jsonify → FastAPI automatic JSON serialization
6. **Server**: Flask dev server → Uvicorn ASGI server

## Components and Interfaces

### 1. Main Application Module (app.py)

**FastAPI Application Instance**
- Replace Flask app with FastAPI app
- Configure CORS middleware
- Load environment variables on startup

**Health Endpoint**
```python
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "backend"}
```

**OpenRouter Proxy Endpoint**
```python
@app.post("/api/openrouter/chat")
async def openrouter_chat(request: dict):
    # Proxy logic remains similar but uses FastAPI patterns
```

### 2. CORS Configuration

**FastAPI CORSMiddleware**
- Replace flask-cors with FastAPI's built-in CORSMiddleware
- Configure allowed origins: ["http://localhost:3000"]
- Allow credentials, methods, and headers as needed

### 3. Environment Configuration

**Environment Variables** (unchanged)
- OPENROUTER_API_KEY
- OPENROUTER_HTTP_REFERER
- OPENROUTER_X_TITLE
- PORT

### 4. Dependencies

**New Dependencies**
- fastapi: Main framework
- uvicorn: ASGI server for running FastAPI
- python-dotenv: Environment variable loading (unchanged)
- requests: HTTP client for OpenRouter API (unchanged)

**Removed Dependencies**
- flask
- flask-cors

## Data Models

### Request/Response Models

**Health Response Model**
```python
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    service: str
```

**OpenRouter Request Model**
```python
class OpenRouterRequest(BaseModel):
    # Will accept any dict structure since OpenRouter API
    # has flexible request formats
    pass  # Use dict type for flexibility
```

**Error Response Model**
```python
class ErrorResponse(BaseModel):
    error: str
```

## Error Handling

### FastAPI Exception Handling

**HTTP Exceptions**
- Use FastAPI's HTTPException for structured error responses
- Maintain same error status codes as Flask implementation
- 500 errors for missing API keys and request failures

**Exception Handlers**
```python
from fastapi import HTTPException

# For missing API key
raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

# For request failures
raise HTTPException(status_code=500, detail=str(exception))
```

### Error Response Format
Maintain identical error response structure:
```json
{"error": "error message"}
```

## Testing Strategy

### Manual Testing Approach
1. **Health Endpoint Testing**
   - GET request to /api/health
   - Verify response format matches Flask version
   - Check status code 200

2. **OpenRouter Proxy Testing**
   - POST request to /api/openrouter/chat with valid payload
   - Verify request forwarding to OpenRouter API
   - Check response format and status code matching
   - Test error scenarios (missing API key, network failures)

3. **CORS Testing**
   - Verify frontend can make requests from localhost:3000
   - Check preflight OPTIONS requests work correctly

4. **Environment Variable Testing**
   - Test with missing OPENROUTER_API_KEY
   - Verify custom PORT configuration works
   - Check HTTP-Referer and X-Title headers are set correctly

### Integration Testing
- Start FastAPI server with uvicorn
- Run same test requests that worked with Flask
- Compare response formats and behavior
- Verify automatic API documentation is accessible at /docs

## Implementation Notes

### Async Considerations
- Current implementation uses synchronous requests library
- Can be converted to async later for better performance
- Initial conversion will maintain sync behavior for compatibility

### Deployment Changes
- Replace Flask development server with uvicorn
- Update any deployment scripts to use uvicorn instead of flask run
- Consider production ASGI server like gunicorn with uvicorn workers

### Development Workflow
- Use uvicorn for development: `uvicorn app:app --reload --port 5000`
- FastAPI provides automatic reload functionality
- Access interactive API docs at http://localhost:5000/docs

### Backward Compatibility
- All existing API endpoints remain unchanged
- Response formats identical to Flask implementation
- Environment variable names and usage unchanged
- CORS behavior preserved