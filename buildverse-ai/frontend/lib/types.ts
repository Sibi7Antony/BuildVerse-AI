// Mirrors backend/app/schemas.py — keep these two in sync.

export interface PMOutput {
  targetUsers: string[];
  coreFeatures: string[];
  userStories: string[];
  mvpScope: string[];
}

export interface SchemaTable {
  table: string;
  fields: string[];
}

export interface ArchitectOutput {
  frontend: string;
  backend: string;
  database: string;
  hosting: string;
  architectureNotes: string;
  schema: SchemaTable[];
}

export interface UIUXPage {
  name: string;
  purpose: string;
  keyElements: string[];
}

export interface UIUXOutput {
  designSystem: string;
  pages: UIUXPage[];
}

export interface FrontendComponent {
  name: string;
  purpose: string;
}

export interface FrontendOutput {
  folderStructure: string[];
  keyComponents: FrontendComponent[];
}

export interface Endpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
}

export interface DataModel {
  name: string;
  fields: string[];
}

export interface BackendOutput {
  endpoints: Endpoint[];
  models: DataModel[];
  authPlan: string;
}

export interface TestCase {
  area: string;
  case: string;
  type: "functional" | "security" | "performance";
}

export interface QAOutput {
  testCases: TestCase[];
  securityChecks: string[];
}

export interface DevOpsOutput {
  deploymentSteps: string[];
  cicd: string[];
  infra: string[];
}

export type AgentId =
  | "pm"
  | "architect"
  | "uiux"
  | "backend"
  | "frontend"
  | "qa"
  | "devops";

export type AgentOutputMap = {
  pm: PMOutput;
  architect: ArchitectOutput;
  uiux: UIUXOutput;
  backend: BackendOutput;
  frontend: FrontendOutput;
  qa: QAOutput;
  devops: DevOpsOutput;
};

export type NodeStatus = "idle" | "running" | "done" | "error";

export interface AgentState {
  status: NodeStatus;
  thinking: string;
  output: AgentOutputMap[AgentId] | null;
}

// --- SSE event shapes sent by GET /api/build/stream ---

export type BuildEvent =
  | { type: "status"; status: "running" | "done" | "error" }
  | { type: "agent_started"; agent: AgentId }
  | { type: "agent_progress"; agent: AgentId; text: string }
  | { type: "agent_done"; agent: AgentId; output: unknown }
  | { type: "error"; agent: AgentId | null; message: string };
