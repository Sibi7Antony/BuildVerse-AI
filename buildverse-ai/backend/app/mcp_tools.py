"""
MCP integration points
=======================
The original proposal calls for three MCP servers:

  - GitHub MCP            -> search_repositories / find_templates / analyze_repo
  - Documentation MCP     -> search_docs / get_examples
  - UI Inspiration MCP    -> search_design_patterns / fetch_ui_examples

These are real, separate servers that have to be running somewhere (GitHub's
hosted MCP endpoint, or your own). This module wires them in as ADK
`MCPToolset` instances IF the relevant env var is set, and returns an empty
tool list otherwise — so the app runs out of the box without them, and you
can light each one up independently for the demo.

To enable the GitHub MCP server you need a token with at least `repo:read`
scope and the `mcp` package installed (`pip install mcp`).
See: https://github.com/github/github-mcp-server
"""
from __future__ import annotations

import logging

from app.config import DOCS_MCP_URL, GITHUB_MCP_TOKEN, UI_MCP_URL

logger = logging.getLogger("buildverse.mcp_tools")


def github_mcp_tools() -> list:
    if not GITHUB_MCP_TOKEN:
        return []
    try:
        from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import (
            StreamableHTTPConnectionParams,
        )
    except ImportError:
        logger.warning("GITHUB_MCP_TOKEN set but `mcp` package not installed — "
                        "run `pip install mcp` to enable the GitHub MCP toolset.")
        return []

    return [
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url="https://api.githubcopilot.com/mcp/",
                headers={"Authorization": f"Bearer {GITHUB_MCP_TOKEN}"},
            ),
            tool_filter=["search_repositories", "get_file_contents"],
        )
    ]


def docs_mcp_tools() -> list:
    if not DOCS_MCP_URL:
        return []
    try:
        from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import (
            StreamableHTTPConnectionParams,
        )
    except ImportError:
        logger.warning("DOCS_MCP_URL set but `mcp` package not installed.")
        return []

    return [MCPToolset(connection_params=StreamableHTTPConnectionParams(url=DOCS_MCP_URL))]


def ui_inspiration_mcp_tools() -> list:
    if not UI_MCP_URL:
        return []
    try:
        from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import (
            StreamableHTTPConnectionParams,
        )
    except ImportError:
        logger.warning("UI_MCP_URL set but `mcp` package not installed.")
        return []

    return [MCPToolset(connection_params=StreamableHTTPConnectionParams(url=UI_MCP_URL))]
