"""Central configuration, loaded once from environment variables."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
APP_NAME: str = "buildverse-ai"

_origins_raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _origins_raw.split(",") if o.strip()]

# Optional MCP integration points — see app/mcp_tools.py. Empty string disables them.
GITHUB_MCP_TOKEN: str = os.environ.get("GITHUB_MCP_TOKEN", "")
DOCS_MCP_URL: str = os.environ.get("DOCS_MCP_URL", "")
UI_MCP_URL: str = os.environ.get("UI_MCP_URL", "")


def require_gemini_key() -> None:
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env "
            "and add a key from https://aistudio.google.com/apikey"
        )
