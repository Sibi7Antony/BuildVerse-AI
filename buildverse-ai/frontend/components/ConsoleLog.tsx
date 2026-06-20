"use client";

import { useEffect, useRef } from "react";

export interface LogEntry {
  text: string;
  cls?: "start" | "ok" | "err";
}

export default function ConsoleLog({ entries }: { entries: LogEntry[] }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="console">
      <div className="console-head">SYSTEM LOG</div>
      <div className="console-body" ref={bodyRef}>
        {entries.length === 0 && <div className="start">// waiting for build instructions…</div>}
        {entries.map((e, i) => (
          <div key={i} className={e.cls}>
            {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}
