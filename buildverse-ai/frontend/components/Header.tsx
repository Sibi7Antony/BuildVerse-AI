"use client";

type OrchStatus = "idle" | "running" | "done" | "error";

const LABELS: Record<OrchStatus, string> = {
  idle: "IDLE",
  running: "BUILDING",
  done: "COMPLETE",
  error: "STALLED",
};

export default function Header({ status }: { status: OrchStatus }) {
  return (
    <div className="head">
      <div>
        <div className="mark">
          BUILD<span>VERSE</span> AI
        </div>
        <div className="tag">// an ai software company in your browser</div>
      </div>
      <div className={`orch-pill${status !== "idle" ? ` is-${status}` : ""}`}>
        <span className="dot" />
        <span>ORCHESTRATOR · {LABELS[status]}</span>
      </div>
    </div>
  );
}
