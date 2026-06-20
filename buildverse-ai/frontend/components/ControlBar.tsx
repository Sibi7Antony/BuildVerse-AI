"use client";

import { useState } from "react";

export default function ControlBar({
  building,
  error,
  onRun,
}: {
  building: boolean;
  error: string | null;
  onRun: (idea: string) => void;
}) {
  const [idea, setIdea] = useState("");

  function handleRun() {
    if (building) return;
    onRun(idea);
  }

  return (
    <>
      <div className="control">
        <input
          value={idea}
          maxLength={400}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRun();
          }}
          placeholder="Describe the software you want to build — e.g. 'an AI-powered healthcare appointment platform'"
        />
        <button onClick={handleRun} disabled={building}>
          {building ? "BUILDING…" : "RUN BUILD"}
        </button>
      </div>
      <div className="guard-note">
        <span className="g-dot" />
        input sanitizer + prompt-injection guard active (enforced server-side)
      </div>
      {error && <div className="error-line">✗ {error}</div>}
    </>
  );
}
