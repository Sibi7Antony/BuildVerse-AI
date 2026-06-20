"""
Security Features
==================
Maps directly onto the four items in the original proposal:

1. API Key Protection   -> GEMINI_API_KEY lives in backend/.env, never sent to the
                            browser. The frontend never sees it; it only talks to
                            this FastAPI server.
2. Input Validation     -> sanitize_input() below.
3. Prompt Injection      -> validate_user_request() below, PLUS every agent's system
   Protection               instruction (see app/agents/*.py) explicitly tells the
                            model to treat <idea>/<context> content as data, never
                            as instructions. Sanitization alone can't stop prompt
                            injection — the real defense is in the agent instructions.
4. Secure Agent          -> "task verification" = each agent's output is validated
   Communication            against a strict Pydantic schema (output_schema) before
                            it's allowed to flow to the next agent; a malformed reply
                            raises instead of silently propagating bad state.
                            "role verification" = each agent only ever receives the
                            state keys its own instruction declares a dependency on
                            (see orchestrator_agent.py), so an agent can't read or
                            influence state outside its role in the pipeline.
"""
from __future__ import annotations

import re

_MAX_IDEA_LENGTH = 400

# Heuristic only — used for logging/telemetry, never as the actual injection
# defense. Real defense is the "treat as data" instruction in every agent prompt.
_SUSPICIOUS_PATTERNS = [
    r"ignore (all|previous|the) instructions",
    r"system prompt",
    r"you are now",
    r"disregard (all|previous|the)",
]


class InputValidationError(ValueError):
    pass


def sanitize_input(raw: str) -> str:
    """Strip control characters and HTML, cap length."""
    if not raw or not raw.strip():
        raise InputValidationError("Idea cannot be empty.")
    text = re.sub(r"<[^>]*>", "", raw)
    text = re.sub(r"[\x00-\x1f\x7f]", "", text)
    text = text.strip()
    if not text:
        raise InputValidationError("Idea cannot be empty after sanitization.")
    if len(text) > _MAX_IDEA_LENGTH:
        text = text[:_MAX_IDEA_LENGTH]
    return text


def flag_suspicious(text: str) -> list[str]:
    """Returns matched suspicious patterns for logging — does not block the request."""
    lowered = text.lower()
    return [p for p in _SUSPICIOUS_PATTERNS if re.search(p, lowered)]


def validate_user_request(raw: str) -> tuple[str, list[str]]:
    clean = sanitize_input(raw)
    flags = flag_suspicious(clean)
    return clean, flags
