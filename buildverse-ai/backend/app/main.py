"""
FastAPI entrypoint.

Routes
------
GET  /api/health         -> liveness check
POST /api/build           -> runs the full pipeline, returns the complete blueprint
GET  /api/build/stream    -> Server-Sent Events stream of live agent progress,
                              for the command-center dashboard in the frontend
"""
from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import InMemoryRunner
from google.genai import types

from app.agents.orchestrator_agent import (
    AGENT_ID_ORDER,
    AGENT_NAME_TO_ID,
    OUTPUT_KEY_TO_AGENT_ID,
    build_orchestrator_agent,
)
from app.config import ALLOWED_ORIGINS, APP_NAME, require_gemini_key
from app.schemas import BuildRequest, BuildResponse
from app.security import InputValidationError, validate_user_request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("buildverse.main")

app = FastAPI(title="BuildVerse AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "agents": AGENT_ID_ORDER}


@app.post("/api/build", response_model=BuildResponse)
async def build(req: BuildRequest) -> BuildResponse:
    """Runs every agent to completion and returns the full blueprint in one shot."""
    require_gemini_key()
    try:
        idea, flags = validate_user_request(req.idea)
    except InputValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if flags:
        logger.warning("Suspicious patterns in request, proceeding (agents treat input as data): %s", flags)

    runner = InMemoryRunner(agent=build_orchestrator_agent(), app_name=APP_NAME)
    session = await runner.session_service.create_session(
        app_name=APP_NAME, user_id="demo-user", state={"idea": idea}
    )
    user_message = types.Content(role="user", parts=[types.Part(text=idea)])

    async for _ in runner.run_async(user_id="demo-user", session_id=session.id, new_message=user_message):
        pass  # we only need the final state; see /api/build/stream for live progress

    final_session = await runner.session_service.get_session(
        app_name=APP_NAME, user_id="demo-user", session_id=session.id
    )
    state = final_session.state
    missing = [k for k in OUTPUT_KEY_TO_AGENT_ID if k not in state]
    if missing:
        raise HTTPException(status_code=502, detail=f"Pipeline did not complete: missing {missing}")

    return BuildResponse(
        idea=idea,
        pm_output=state["pm_output"],
        architect_output=state["architect_output"],
        uiux_output=state["uiux_output"],
        frontend_output=state["frontend_output"],
        backend_output=state["backend_output"],
        qa_output=state["qa_output"],
        devops_output=state["devops_output"],
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@app.get("/api/build/stream")
async def build_stream(idea: str = Query(..., min_length=1, max_length=400)) -> StreamingResponse:
    """Live agent-by-agent progress as Server-Sent Events.

    Event shapes sent to the client:
      {"type": "status", "status": "running" | "done" | "error"}
      {"type": "agent_started", "agent": "<id>"}
      {"type": "agent_progress", "agent": "<id>", "text": "<partial chunk>"}
      {"type": "agent_done", "agent": "<id>", "output": {...}}
      {"type": "error", "agent": "<id> | null", "message": "<str>"}
    """

    async def generator() -> AsyncGenerator[str, None]:
        try:
            require_gemini_key()
            idea_clean, flags = validate_user_request(idea)
        except (InputValidationError, RuntimeError) as e:
            yield _sse({"type": "error", "agent": None, "message": str(e)})
            yield _sse({"type": "status", "status": "error"})
            return
        if flags:
            logger.warning("Suspicious patterns in stream request, proceeding: %s", flags)

        yield _sse({"type": "status", "status": "running"})
        started: set[str] = set()

        try:
            runner = InMemoryRunner(agent=build_orchestrator_agent(), app_name=APP_NAME)
            session = await runner.session_service.create_session(
                app_name=APP_NAME, user_id="demo-user", state={"idea": idea_clean}
            )
            user_message = types.Content(role="user", parts=[types.Part(text=idea_clean)])
            run_config = RunConfig(streaming_mode=StreamingMode.SSE)

            async for event in runner.run_async(
                user_id="demo-user",
                session_id=session.id,
                new_message=user_message,
                run_config=run_config,
            ):
                agent_id = AGENT_NAME_TO_ID.get(event.author or "")
                if agent_id and agent_id not in started:
                    started.add(agent_id)
                    yield _sse({"type": "agent_started", "agent": agent_id})

                if event.partial and agent_id and event.content and event.content.parts:
                    text = "".join(p.text or "" for p in event.content.parts if p.text)
                    if text.strip():
                        yield _sse({"type": "agent_progress", "agent": agent_id, "text": text[-160:]})

                state_delta = event.actions.state_delta if event.actions else None
                if state_delta:
                    for key, value in state_delta.items():
                        owner = OUTPUT_KEY_TO_AGENT_ID.get(key)
                        if owner:
                            yield _sse({"type": "agent_done", "agent": owner, "output": value})

            yield _sse({"type": "status", "status": "done"})
        except Exception as e:  # surfaced to the dashboard rather than a silent 500
            logger.exception("Pipeline failed")
            yield _sse({"type": "error", "agent": None, "message": str(e)})
            yield _sse({"type": "status", "status": "error"})

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
