"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiResult = {
  ok: boolean;
  gatewayStatus?: number;
  durationMs?: number;
  body?: unknown;
  request?: unknown;
  error?: string;
};

type LogEntry = {
  id: string;
  at: string;
  // eventType: string;
  // applicationId: string;
  ok: boolean;
  status?: number;
  durationMs?: number;
  response: unknown;
};

const initialApplication = {
  "applicant": "Jane Smith",
  "dateOfBirth": "1974-06-15",
  "product": "20_YEAR_TERM",
  "faceAmount": 1000000,
  "income": 150000,
  "tobacco": "N",
  "state": "IL",
  "consentReceived": true,
  "healthQuestionsComplete": false,
  "applicationId": "APP-10482",
  "eventType": "APPLICATION_CREATED",
  "eventId": "100",
  "timestamp": 1787743327
};

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function Home() {
  const [applicationId, setApplicationId] = useState("APP-10482");
  const [payloadText, setPayloadText] = useState(pretty(initialApplication));
  const [customUpdateText, setCustomUpdateText] = useState(
    pretty({ income: 175000, faceAmount: 1200000, applicationId: "APP-10482", 
      eventType: "APPLICATION_UPDATED", eventId: "100", timestamp: 1787743327 })
  );
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<"unknown" | "up" | "down">("unknown");
  const [lastResult, setLastResult] = useState<ApiResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");


  async function sendEvent(eventType: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payload
        })
      });

      const result: ApiResult = await response.json();
      setLastResult(result);

      setLogs((current) => [
        {
          id: crypto.randomUUID(),
          at: new Date().toLocaleTimeString(),
          // eventType,
          // applicationId,
          ok: Boolean(result.ok),
          status: result.gatewayStatus,
          durationMs: result.durationMs,
          response: result.body ?? result.error ?? result
        },
        ...current
      ].slice(0, 30));

      if (!result.ok) {
        setError(result.error || `Gateway returned ${result.gatewayStatus ?? "an error"}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function parseJson(text: string, label: string) {
    try {
      const value = JSON.parse(text);
      if (!value || Array.isArray(value) || typeof value !== "object") {
        throw new Error(`${label} must be a JSON object`);
      }
      return value as Record<string, unknown>;
    } catch (e) {
      throw new Error(
        e instanceof Error ? `${label}: ${e.message}` : `${label}: invalid JSON`
      );
    }
  }

  async function createApplication() {
    try {
      await sendEvent("APPLICATION_CREATED", parseJson(payloadText, "Application payload"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid application payload");
    }
  }

  async function updateApplication() {
    try {
      await sendEvent("APPLICATION_UPDATED", parseJson(customUpdateText, "Update payload"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid update payload");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void createApplication();
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <div className="eyebrow">CONDENSE · LIFE INSURANCE DEMO</div>
          <h1>Event Gateway - Web</h1>
          <p>
            Send Insurance events to the Condense event-gateway
            to validate application requests and do pre-qualification.
          </p>
        </div>

      {error && <div className="error">{error}</div>}

      <div className="layout">
        <section className="panel">
          <div className="panelTitle">
            <div>
              <span className="step">01</span>
              <h2>Application</h2>
            </div>
            <span className="hint">Golden scenario</span>
          </div>

          <label>
            Application ID
            <input
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="APP-10482"
            />
          </label>

          <form onSubmit={onSubmit}>
            <label>
              APPLICATION_CREATED payload
              <textarea
                className="editor tall"
                spellCheck={false}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
              />
            </label>

            <button className="primary" disabled={busy || !applicationId.trim()}>
              Send APPLICATION_CREATED
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panelTitle">
            <div>
              <span className="step">02</span>
              <h2>Scenario events</h2>
            </div>
            <span className="hint">One click = one event</span>
          </div>

          <div className="eventGrid">
            <button
              className="eventButton"
              disabled={busy}
              onClick={updateApplication}
            >
              <strong>Complete health questions</strong>
              <span>HEALTH_QUESTIONS_COMPLETED</span>
            </button>

            <button
              className="eventButton"
              disabled={busy}
              onClick={updateApplication}
            >
              <strong>Receive consent</strong>
              <span>CONSENT_RECEIVED</span>
            </button>
          </div>

          <label className="spaced">
            APPLICATION_UPDATED payload
            <textarea
              className="editor"
              spellCheck={false}
              value={customUpdateText}
              onChange={(e) => setCustomUpdateText(e.target.value)}
            />
          </label>

          <button
            className="secondary"
            disabled={busy || !applicationId.trim()}
            onClick={updateApplication}
          >
            Send APPLICATION_UPDATED
          </button>

          {/* <div className="contract">
            <h3>Gateway contract being validated</h3>
            <code>POST /</code>
            <pre>{`{
  "eventType": "...",
  applicationId: "...",
  "eventId": "...",
  "timestamp": "..."
}`}</pre>
          </div> */}
        </section>
      </div>

      <div className="layout lower">
        <section className="panel">
          <div className="panelTitle">
            <div>
              <span className="step">03</span>
              <h2>Latest gateway response</h2>
            </div>
            {lastResult && (
              <span className={`statusPill ${lastResult.ok ? "success" : "failure"}`}>
                {lastResult.ok ? "ACCEPTED" : "FAILED"}
              </span>
            )}
          </div>

          {lastResult ? (
            <>
              <div className="metrics">
                <div>
                  <span>HTTP</span>
                  <strong>{lastResult.gatewayStatus ?? "—"}</strong>
                </div>
                <div>
                  <span>Round trip</span>
                  <strong>
                    {lastResult.durationMs !== undefined ? `${lastResult.durationMs} ms` : "—"}
                  </strong>
                </div>
              </div>

              <div className="responseGrid">
                <div>
                  <h3>Forwarded request</h3>
                  <pre>{pretty(lastResult.request ?? "Health check")}</pre>
                </div>
                <div>
                  <h3>Gateway response</h3>
                  <pre>{pretty(lastResult.body ?? lastResult.error ?? lastResult)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="empty">Send an event or run the health check.</div>
          )}
        </section>

        <section className="panel">
          <div className="panelTitle">
            <div>
              <span className="step">04</span>
              <h2>Session log</h2>
            </div>
            <button className="linkButton" onClick={() => setLogs([])} disabled={!logs.length}>
              Clear
            </button>
          </div>

          <div className="log">
            {logs.length === 0 && <div className="empty">No events sent yet.</div>}
            {logs.map((entry) => (
              <div className="logRow" key={entry.id}>
                <span className={`logMark ${entry.ok ? "success" : "failure"}`} />
                <div className="logBody">
                  <strong>{entry.eventType}</strong>
                  <span>{entry.applicationId} · {entry.at}</span>
                </div>
                <div className="logMeta">
                  <strong>{entry.status ?? "—"}</strong>
                  <span>{entry.durationMs !== undefined ? `${entry.durationMs} ms` : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer>
        This screen validates only the Vercel → event-gateway → Kafka publication boundary.
        The downstream case-processing dashboard can be added after Service 2 is deployed.
      </footer>
    </main>
  );
}
