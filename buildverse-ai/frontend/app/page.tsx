"use client";

import { useRef, useState } from "react";
import Header from "@/components/Header";
import ControlBar from "@/components/ControlBar";
import Pipeline from "@/components/Pipeline";
import ConsoleLog, { LogEntry } from "@/components/ConsoleLog";
import BlueprintPanel from "@/components/BlueprintPanel";
import { AGENT_IDS, THINKING_LINES } from "@/lib/agents";
import type { AgentId, AgentState, BuildEvent } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function freshAgentStates(): Record<AgentId, AgentState> {
  const out = {} as Record<AgentId, AgentState>;
  AGENT_IDS.forEach((id) => {
    out[id] = { status: "idle", thinking: "", output: null };
  });
  return out;
}

type OrchStatus = "idle" | "running" | "done" | "error";

export default function Page() {
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentState>>(freshAgentStates());
  const [orchStatus, setOrchStatus] = useState<OrchStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AgentId | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const thinkingTimers = useRef<Partial<Record<AgentId, ReturnType<typeof setInterval>>>>({});
  const thinkingIdx = useRef<Partial<Record<AgentId, number>>>({});

  function pushLog(text: string, cls?: LogEntry["cls"]) {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [...prev, { text: `[${ts}] ${text}`, cls }]);
  }

  function clearThinking(id: AgentId) {
    const timer = thinkingTimers.current[id];
    if (timer) {
      clearInterval(timer);
      delete thinkingTimers.current[id];
    }
  }

  function startThinking(id: AgentId) {
    clearThinking(id);
    thinkingIdx.current[id] = 0;
    const lines = THINKING_LINES[id];
    setAgentStates((prev) => ({ ...prev, [id]: { ...prev[id], thinking: lines[0] } }));
    thinkingTimers.current[id] = setInterval(() => {
      const i = ((thinkingIdx.current[id] ?? 0) + 1) % lines.length;
      thinkingIdx.current[id] = i;
      setAgentStates((prev) => ({ ...prev, [id]: { ...prev[id], thinking: lines[i] } }));
    }, 1300);
  }

  function resetAll() {
    Object.values(thinkingTimers.current).forEach((t) => t && clearInterval(t));
    thinkingTimers.current = {};
    thinkingIdx.current = {};
    setAgentStates(freshAgentStates());
    setLogs([]);
    setActiveTab(null);
    setError(null);
  }

  function closeStream() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }

  function handleRun(rawIdea: string) {
    const idea = rawIdea.trim();
    if (!idea) {
      setError("Type a product idea first.");
      return;
    }
    closeStream();
    resetAll();
    setBuilding(true);
    setOrchStatus("running");
    pushLog(`▸ new build request: "${idea}"`, "start");

    const url = `${API_BASE}/api/build/stream?idea=${encodeURIComponent(idea)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (ev) => {
      let data: BuildEvent;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "status": {
          setOrchStatus(data.status);
          if (data.status === "done") {
            pushLog("✓ blueprint complete — all agents finished", "ok");
            setBuilding(false);
            closeStream();
          } else if (data.status === "error") {
            setBuilding(false);
            closeStream();
          }
          break;
        }
        case "agent_started": {
          setAgentStates((prev) => ({ ...prev, [data.agent]: { ...prev[data.agent], status: "running" } }));
          pushLog(`▸ ${data.agent.toUpperCase()} — started`, "start");
          startThinking(data.agent);
          break;
        }
        case "agent_progress": {
          // Real partial text from the model — overrides the canned thinking line when it arrives.
          setAgentStates((prev) => ({ ...prev, [data.agent]: { ...prev[data.agent], thinking: data.text } }));
          break;
        }
        case "agent_done": {
          clearThinking(data.agent);
          setAgentStates((prev) => ({
            ...prev,
            [data.agent]: { ...prev[data.agent], status: "done", output: data.output as never },
          }));
          pushLog(`✓ ${data.agent.toUpperCase()} :: complete`, "ok");
          setActiveTab((prev) => prev ?? data.agent);
          break;
        }
        case "error": {
          if (data.agent) clearThinking(data.agent);
          setError(data.message);
          pushLog(`✗ ${data.agent ? data.agent.toUpperCase() + " :: " : ""}${data.message}`, "err");
          break;
        }
      }
    };

    es.onerror = () => {
      pushLog("✗ connection to backend lost — is the FastAPI server running?", "err");
      setError("Lost connection to the backend. Is it running at " + API_BASE + "?");
      setOrchStatus("error");
      setBuilding(false);
      closeStream();
    };
  }

  return (
    <div className="app">
      <Header status={orchStatus} />
      <ControlBar building={building} error={error} onRun={handleRun} />
      <Pipeline agentStates={agentStates} onSelectAgent={(id) => agentStates[id].output && setActiveTab(id)} />
      <div className="lower">
        <ConsoleLog entries={logs} />
        <BlueprintPanel agentStates={agentStates} activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>
      <footer className="app-footer">
        <b>Integration notes —</b> the GitHub MCP, Documentation MCP and UI Inspiration MCP from the
        proposal are wired as real extension points in <code>backend/app/mcp_tools.py</code> and the
        Architect/UI-UX agent instructions — set the matching env vars in <code>backend/.env</code> to
        light them up. Without them, those agents reason from the model&apos;s own knowledge instead.
      </footer>
    </div>
  );
}
