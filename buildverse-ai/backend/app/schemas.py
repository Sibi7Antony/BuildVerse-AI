"""Strict output schemas for every agent (used as LlmAgent.output_schema) plus the
request/response models for the FastAPI routes.

Because each schema is enforced by ADK before the value is written to session
state, a malformed model reply raises rather than silently corrupting the
pipeline — this is the "task verification" half of Secure Agent Communication.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PMOutput(BaseModel):
    targetUsers: list[str] = Field(min_length=1, max_length=4)
    coreFeatures: list[str] = Field(min_length=1, max_length=5)
    userStories: list[str] = Field(min_length=1, max_length=4)
    mvpScope: list[str] = Field(min_length=1, max_length=5)


class SchemaTable(BaseModel):
    table: str
    fields: list[str]


class ArchitectOutput(BaseModel):
    frontend: str
    backend: str
    database: str
    hosting: str
    architectureNotes: str
    schema_: list[SchemaTable] = Field(alias="schema", max_length=6)

    model_config = {"populate_by_name": True}


class UIUXPage(BaseModel):
    name: str
    purpose: str
    keyElements: list[str]


class UIUXOutput(BaseModel):
    designSystem: str
    pages: list[UIUXPage] = Field(min_length=1, max_length=6)


class FrontendComponent(BaseModel):
    name: str
    purpose: str


class FrontendOutput(BaseModel):
    folderStructure: list[str]
    keyComponents: list[FrontendComponent] = Field(min_length=1, max_length=8)


class Endpoint(BaseModel):
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    path: str
    description: str


class DataModel(BaseModel):
    name: str
    fields: list[str]


class BackendOutput(BaseModel):
    endpoints: list[Endpoint] = Field(min_length=1, max_length=10)
    models: list[DataModel] = Field(min_length=1, max_length=8)
    authPlan: str


class TestCase(BaseModel):
    area: str
    case: str
    type: Literal["functional", "security", "performance"]


class QAOutput(BaseModel):
    testCases: list[TestCase] = Field(min_length=1, max_length=12)
    securityChecks: list[str] = Field(min_length=1, max_length=8)


class DevOpsOutput(BaseModel):
    deploymentSteps: list[str]
    cicd: list[str]
    infra: list[str]


class BuildRequest(BaseModel):
    idea: str = Field(min_length=1, max_length=400)


class BuildResponse(BaseModel):
    idea: str
    pm_output: PMOutput
    architect_output: ArchitectOutput
    uiux_output: UIUXOutput
    frontend_output: FrontendOutput
    backend_output: BackendOutput
    qa_output: QAOutput
    devops_output: DevOpsOutput
