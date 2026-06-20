"use client";

import { Fragment, useEffect, useState } from "react";
import { AGENTS, STAGE_NUMBERS, agentsInStage } from "@/lib/agents";
import type { AgentId, AgentState } from "@/lib/types";
import AgentNode from "./AgentNode";

export default function Pipeline({
  agentStates,
  onSelectAgent,
}: {
  agentStates: Record<AgentId, AgentState>;
  onSelectAgent: (id: AgentId) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const template: string[] = [];
  STAGE_NUMBERS.forEach((_, idx) => {
    template.push("1fr");
    if (idx < STAGE_NUMBERS.length - 1) template.push("0.45fr");
  });

  return (
    <div className="pipeline-wrap">
      <div
        className={`pipeline${isMobile ? " is-mobile" : ""}`}
        style={!isMobile ? { gridTemplateColumns: template.join(" ") } : undefined}
      >
        {STAGE_NUMBERS.map((stageNum, idx) => {
          const stageAgents = agentsInStage(stageNum);
          const nextStageAgents = idx < STAGE_NUMBERS.length - 1 ? agentsInStage(STAGE_NUMBERS[idx + 1]) : [];
          const sourceDone = stageAgents.every((a) => agentStates[a.id].status === "done");
          const anyRunning =
            stageAgents.some((a) => agentStates[a.id].status === "running") ||
            nextStageAgents.some((a) => agentStates[a.id].status === "running");
          const connClass = sourceDone ? " is-done" : anyRunning ? " is-active" : "";

          return (
            <Fragment key={`group-${stageNum}`}>
              <div className="stage-col">
                <div className="stage-label">STAGE 0{idx + 1}</div>
                {stageAgents.map((meta) => (
                  <AgentNode
                    key={meta.id}
                    meta={meta}
                    state={agentStates[meta.id]}
                    onClick={() => onSelectAgent(meta.id)}
                  />
                ))}
              </div>
              {idx < STAGE_NUMBERS.length - 1 && (
                <div className={`connector${connClass}`}>
                  <span className="conn-dot" />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
