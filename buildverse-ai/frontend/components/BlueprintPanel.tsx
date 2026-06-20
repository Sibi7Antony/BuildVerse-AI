"use client";

import { AGENTS } from "@/lib/agents";
import type {
  AgentId,
  AgentState,
  ArchitectOutput,
  BackendOutput,
  DevOpsOutput,
  FrontendOutput,
  PMOutput,
  QAOutput,
  UIUXOutput,
} from "@/lib/types";

function PMView({ o }: { o: PMOutput }) {
  return (
    <div className="bp-section">
      <h3>Target users</h3>
      <ul>{o.targetUsers.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h3>Core features</h3>
      <ul>{o.coreFeatures.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h3>User stories</h3>
      <ul>{o.userStories.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h3>MVP scope</h3>
      <ul>{o.mvpScope.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function ArchitectView({ o }: { o: ArchitectOutput }) {
  return (
    <div className="bp-section">
      <div className="bp-badges">
        <span className="badge">Frontend: {o.frontend}</span>
        <span className="badge">Backend: {o.backend}</span>
        <span className="badge">DB: {o.database}</span>
        <span className="badge">Hosting: {o.hosting}</span>
      </div>
      <h3>Notes</h3>
      <p className="bp-note">{o.architectureNotes}</p>
      <h3>Schema</h3>
      <div className="bp-tables">
        {o.schema.map((t, i) => (
          <div className="bp-table" key={i}>
            <strong>{t.table}</strong>
            <div className="bp-fields">{t.fields.join(" · ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UIUXView({ o }: { o: UIUXOutput }) {
  return (
    <div className="bp-section">
      <h3>Design system</h3>
      <p className="bp-note">{o.designSystem}</p>
      <h3>Pages</h3>
      <div className="bp-pages">
        {o.pages.map((p, i) => (
          <div className="bp-page" key={i}>
            <strong>{p.name}</strong>
            <small>{p.purpose}</small>
            <ul>{p.keyElements.map((x, j) => <li key={j}>{x}</li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrontendView({ o }: { o: FrontendOutput }) {
  return (
    <div className="bp-section">
      <h3>Folder structure</h3>
      <ul>{o.folderStructure.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h3>Key components</h3>
      <ul>
        {o.keyComponents.map((c, i) => (
          <li key={i}>
            <strong>{c.name}</strong> — {c.purpose}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BackendView({ o }: { o: BackendOutput }) {
  return (
    <div className="bp-section">
      <h3>Endpoints</h3>
      {o.endpoints.map((e, i) => (
        <div className="bp-row" key={i}>
          <span className="bp-method">{e.method}</span>
          <span className="bp-path">{e.path}</span>
          <span className="bp-desc">{e.description}</span>
        </div>
      ))}
      <h3>Models</h3>
      <ul>
        {o.models.map((m, i) => (
          <li key={i}>
            <strong>{m.name}</strong> — {m.fields.join(", ")}
          </li>
        ))}
      </ul>
      <h3>Auth plan</h3>
      <p className="bp-note">{o.authPlan}</p>
    </div>
  );
}

function QAView({ o }: { o: QAOutput }) {
  return (
    <div className="bp-section">
      <h3>Test cases</h3>
      {o.testCases.map((t, i) => (
        <div className="bp-row" key={i}>
          <span className="bp-method">{t.area}</span>
          <span className="bp-desc">
            {t.case} <span className={`type-tag type-${t.type}`}>{t.type}</span>
          </span>
          <span />
        </div>
      ))}
      <h3>Security checks</h3>
      <ul>{o.securityChecks.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function DevOpsView({ o }: { o: DevOpsOutput }) {
  return (
    <div className="bp-section bp-cols3">
      <div>
        <h3>Deployment</h3>
        <ul>{o.deploymentSteps.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
      <div>
        <h3>CI / CD</h3>
        <ul>{o.cicd.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
      <div>
        <h3>Infra</h3>
        <ul>{o.infra.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
    </div>
  );
}

function renderOutput(id: AgentId, output: NonNullable<AgentState["output"]>) {
  switch (id) {
    case "pm":
      return <PMView o={output as PMOutput} />;
    case "architect":
      return <ArchitectView o={output as ArchitectOutput} />;
    case "uiux":
      return <UIUXView o={output as UIUXOutput} />;
    case "frontend":
      return <FrontendView o={output as FrontendOutput} />;
    case "backend":
      return <BackendView o={output as BackendOutput} />;
    case "qa":
      return <QAView o={output as QAOutput} />;
    case "devops":
      return <DevOpsView o={output as DevOpsOutput} />;
  }
}

export default function BlueprintPanel({
  agentStates,
  activeTab,
  onSelectTab,
}: {
  agentStates: Record<AgentId, AgentState>;
  activeTab: AgentId | null;
  onSelectTab: (id: AgentId) => void;
}) {
  const output = activeTab ? agentStates[activeTab].output : null;

  return (
    <div className="blueprint">
      <div className="tabs">
        {AGENTS.map((meta) => {
          const ready = !!agentStates[meta.id].output;
          const classes = ["tab-btn"];
          if (ready) classes.push("is-ready");
          if (activeTab === meta.id) classes.push("is-active");
          return (
            <button
              key={meta.id}
              className={classes.join(" ")}
              disabled={!ready}
              onClick={() => ready && onSelectTab(meta.id)}
            >
              {meta.tabLabel}
            </button>
          );
        })}
      </div>
      <div className="tab-content">
        {activeTab && output ? (
          renderOutput(activeTab, output)
        ) : (
          <div className="placeholder">Run a build to generate the blueprint.</div>
        )}
      </div>
    </div>
  );
}
