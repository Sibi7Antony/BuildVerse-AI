"""
OrchestratorAgent
==================
The Coordinator from the proposal. Routes the build through every specialist
agent in the order shown in the original diagram:

    PM -> Architect -> { UI/UX, Backend } -> Frontend -> QA -> DevOps

Frontend depends on UI/UX's page list, so it runs after the UI/UX+Backend
parallel stage rather than inside it. This is a deterministic pipeline (not
an LLM-routed one) because the proposal's flow is fixed — that makes the demo
reliable and the routing visible to judges, rather than left to chance.

Built with ADK's SequentialAgent / ParallelAgent. Both are marked deprecated
in favor of the newer `google.adk.workflow.Workflow` graph API as of ADK 2.3,
but remain fully functional and are far more widely documented — if you're
on a newer ADK release and want to migrate, the dependency graph above maps
directly onto Workflow's Node/Edge/JoinNode primitives.
"""
from __future__ import annotations

from google.adk.agents import ParallelAgent, SequentialAgent

from app.agents.architect_agent import build_architect_agent
from app.agents.backend_agent import build_backend_agent
from app.agents.devops_agent import build_devops_agent
from app.agents.frontend_agent import build_frontend_agent
from app.agents.product_manager_agent import build_product_manager_agent
from app.agents.qa_agent import build_qa_agent
from app.agents.uiux_agent import build_uiux_agent


def build_orchestrator_agent() -> SequentialAgent:
    """Returns a fresh OrchestratorAgent pipeline instance.

    ADK raises if the same agent instance is attached to two parent trees,
    so every agent (including this orchestrator) is built fresh per request.
    That also makes concurrent builds from different users safe.
    """
    return SequentialAgent(
        name="orchestrator_agent",
        sub_agents=[
            build_product_manager_agent(),
            build_architect_agent(),
            ParallelAgent(
                name="design_and_backend_stage",
                sub_agents=[build_uiux_agent(), build_backend_agent()],
            ),
            build_frontend_agent(),
            build_qa_agent(),
            build_devops_agent(),
        ],
    )


# Maps the ADK event.author (the agent's `name`) to the short id the frontend
# dashboard uses for its nodes.
AGENT_NAME_TO_ID: dict[str, str] = {
    "product_manager_agent": "pm",
    "architect_agent": "architect",
    "uiux_agent": "uiux",
    "backend_agent": "backend",
    "frontend_agent": "frontend",
    "qa_agent": "qa",
    "devops_agent": "devops",
}

# Maps each agent's output_key (the session-state key it writes to) back to
# its short id, so a state_delta event can be attributed to the right node.
OUTPUT_KEY_TO_AGENT_ID: dict[str, str] = {
    "pm_output": "pm",
    "architect_output": "architect",
    "uiux_output": "uiux",
    "backend_output": "backend",
    "frontend_output": "frontend",
    "qa_output": "qa",
    "devops_output": "devops",
}

# Pipeline order, used by main.py to build the final synchronous response.
AGENT_ID_ORDER: list[str] = ["pm", "architect", "uiux", "backend", "frontend", "qa", "devops"]
