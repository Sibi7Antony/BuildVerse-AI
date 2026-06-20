"use client";

import type { AgentMeta } from "@/lib/agents";
import type { AgentState } from "@/lib/types";

export default function AgentNode({
  meta,
  state,
  onClick,
}: {
  meta: AgentMeta;
  state: AgentState;
  onClick: () => void;
}) {
  const statusText =
    state.status === "idle"
      ? "idle"
      : state.status === "running"
      ? state.thinking || "working…"
      : state.status === "done"
      ? "complete"
      : "error — see log";

  return (
    <div
      className={`node is-${state.status}`}
      onClick={onClick}
      role="button"
      title={state.output ? "View this agent's output" : undefined}
    >
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      <div className="node-code">{meta.code}</div>
      <div className="node-label">{meta.label}</div>
      <div className="node-status">{statusText}</div>
    </div>
  );
}
