import type { AgentId } from "./types";

export interface AgentMeta {
  id: AgentId;
  code: string;
  label: string;
  stage: number;
  tabLabel: string;
}

export const AGENTS: AgentMeta[] = [
  { id: "pm", code: "PM", label: "Product Manager", stage: 1, tabLabel: "Product" },
  { id: "architect", code: "SA", label: "System Architect", stage: 2, tabLabel: "Architecture" },
  { id: "uiux", code: "UX", label: "UI / UX Designer", stage: 3, tabLabel: "UI / UX" },
  { id: "backend", code: "BE", label: "Backend Engineer", stage: 3, tabLabel: "Backend" },
  { id: "frontend", code: "FE", label: "Frontend Engineer", stage: 4, tabLabel: "Frontend" },
  { id: "qa", code: "QA", label: "QA Engineer", stage: 5, tabLabel: "Testing" },
  { id: "devops", code: "DO", label: "DevOps Engineer", stage: 6, tabLabel: "Deployment" },
];

export const AGENT_IDS: AgentId[] = AGENTS.map((a) => a.id);

export const STAGE_NUMBERS: number[] = Array.from(
  new Set(AGENTS.map((a) => a.stage))
).sort((a, b) => a - b);

export function agentsInStage(stage: number): AgentMeta[] {
  return AGENTS.filter((a) => a.stage === stage);
}

export const THINKING_LINES: Record<AgentId, string[]> = {
  pm: ["reading the idea…", "defining target users…", "drafting user stories…", "scoping the MVP…"],
  architect: ["weighing stack options…", "sketching the schema…", "mapping data flow…"],
  uiux: ["sketching wireframes…", "choosing a visual language…", "laying out key pages…"],
  backend: ["designing endpoints…", "modeling the database…", "planning auth…"],
  frontend: ["structuring folders…", "composing components…", "wiring up pages…"],
  qa: ["writing test cases…", "hunting edge cases…", "running security checks…"],
  devops: ["planning the pipeline…", "containerizing services…", "mapping infra…"],
};
