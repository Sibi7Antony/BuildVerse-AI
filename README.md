# BuildVerse AI

**An AI software company in your browser.**

Seven specialized agents — Product Manager, System Architect, UI/UX Designer,
Frontend Engineer, Backend Engineer, QA Engineer, DevOps Engineer — collaborate
through an Orchestrator to turn a one-line idea into a complete software
blueprint, live, in a command-center dashboard.

```
PM -> Architect -> { UI/UX, Backend } -> Frontend -> QA -> DevOps
```

## Stack

| Layer      | Tech                                                              |
|------------|--------------------------------------------------------------------|
| Agents     | [Google ADK](https://github.com/google/adk-python) (`LlmAgent`, `SequentialAgent`, `ParallelAgent`) + Gemini |
| Backend    | FastAPI, Server-Sent Events for live progress                     |
| Frontend   | Next.js 16 (App Router) + TypeScript, no UI framework — hand-rolled CSS |
| MCP        | Optional `MCPToolset` wiring for GitHub MCP, Docs MCP, UI Inspiration MCP |

This was built and verified against **google-adk 2.3.0** — the agent
construction, `output_schema`/`output_key` state propagation, and the
Sequential/Parallel event stream were all smoke-tested against the real
package (see "What's been tested" below), not just written from memory.

## Quick start

You need a Gemini API key: https://aistudio.google.com/apikey

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env        # then paste your GEMINI_API_KEY into .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # defaults to http://localhost:8000, fine for local dev
npm run dev
```

Open http://localhost:3000, type an idea, hit **Run Build**.

### Or: one command with Docker

```bash
docker compose up --build
```
(Make sure `backend/.env` exists with your `GEMINI_API_KEY` first — `docker-compose.yml` reads it from there.)

## How this maps to the original proposal

**Agents.** Each agent in `backend/app/agents/` is an ADK `LlmAgent` with a
strict Pydantic `output_schema` (see `backend/app/schemas.py`) — the model's
reply is validated and rejected if malformed, rather than silently
corrupting the pipeline. `orchestrator_agent.py` assembles them into the
fixed pipeline shown above using `SequentialAgent`/`ParallelAgent`. This is a
deterministic pipeline, not LLM-routed — the proposal's flow is fixed, so a
deterministic orchestrator makes the demo reliable and the routing visible
to judges rather than left to an LLM's discretion.

**MCP servers.** `backend/app/mcp_tools.py` wires real `MCPToolset`
connections to GitHub's hosted MCP server (and stubs for a Documentation MCP
and UI Inspiration MCP) — gated behind env vars so the app runs fine without
them, and you can light each one up independently for the demo. Nothing here
fabricates fake tool results; if the env var isn't set, the agent just
reasons from the model's own knowledge instead.

**Security Features.**
- *API Key Protection* — `GEMINI_API_KEY` lives in `backend/.env`, never sent
  to the browser.
- *Input Validation* — `sanitize_input()` in `backend/app/security.py`.
- *Prompt Injection Protection* — every agent's instruction explicitly tells
  the model to treat `<idea>`/`<context>` content as data, never as
  instructions (see any file in `backend/app/agents/`). Sanitization alone
  can't stop prompt injection; the instruction-level guard is the real
  defense.
- *Secure Agent Communication* — "task verification" is the `output_schema`
  validation on every agent reply; "role verification" is that each agent's
  instruction only ever references the specific state keys it depends on
  (enforced by the pipeline structure, not by trust).

**Deployability.** Frontend → Vercel (it's a standard Next.js app, no config
needed beyond `NEXT_PUBLIC_API_BASE_URL`). Backend → Railway/Fly/anywhere
that runs a Dockerfile + an env var. `Dockerfile`s for both, plus a root
`docker-compose.yml`, plus a `.github/workflows/ci.yml` that type-checks and
builds both sides on every push.

**Dashboard.** The frontend's `Pipeline` component renders the agent diagram
live: nodes pulse amber while running, turn cyan on completion, with an
animated connector pulse between stages. The `ConsoleLog` streams real
per-agent progress text from the model (via ADK's `StreamingMode.SSE`), and
`BlueprintPanel` unlocks a tab per agent as its output arrives.

## What's been tested

Before writing the FastAPI layer, the ADK agent construction and event
streaming were verified directly against the installed `google-adk==2.3.0`
package using a fake LLM standing in for Gemini:

- Agent construction with `output_schema` + `output_key` + `tools` together
- `SequentialAgent` → `ParallelAgent` → `SequentialAgent` state propagation
  (does a downstream agent correctly see both parallel branches' outputs? — yes)
- `event.author` reliably identifies which agent produced an event
- `event.actions.state_delta` reliably signals "this agent just finished,
  here's its parsed output"
- The full FastAPI app (`/api/health`, `/api/build`, `/api/build/stream`)
  was integration-tested end-to-end with `TestClient` and the same fake LLM,
  confirming correct SSE event ordering (including parallel-stage
  interleaving) and response serialization

What *hasn't* been tested: a real call to Gemini (no network access to
Google's API from the environment this was built in). The agent
instructions, schemas, and orchestration are real and verified; the only
unknown is exactly how Gemini's actual replies will look in practice, which
you'll see the moment you add your API key.

## Project layout

```
backend/
  app/
    agents/                 # one file per agent + the orchestrator
    config.py                # env vars
    security.py               # input validation / injection-guard notes
    schemas.py                  # Pydantic output_schema for every agent
    mcp_tools.py                  # optional MCP wiring
    main.py                        # FastAPI routes
  Dockerfile
  requirements.txt
frontend/
  app/                       # Next.js App Router (page, layout, globals.css)
  components/                 # Header, ControlBar, Pipeline, AgentNode, ConsoleLog, BlueprintPanel
  lib/                         # shared types + agent/stage config
  Dockerfile
docker-compose.yml
.github/workflows/ci.yml
```
