from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, report, sensor, drinking_logs, auth, goals, users, stats, rewards

#宣告並建立 FastAPI 伺服器實體
app = FastAPI(
    title="Smart Coaster AI Backend",
    description="FastAPI backend connecting Smart Coaster to Supabase and Groq",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat.router)
app.include_router(report.router)
app.include_router(sensor.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(drinking_logs.router, prefix="/logs", tags=["drinking_logs"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(rewards.router, prefix="/rewards", tags=["rewards"])

# 這邊api放到render上後才須注意
@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    # This block allows running with `python main.py` directly for testing, 
    # but normally we run with `uvicorn main:app --reload --port 5001`
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
