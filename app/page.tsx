"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiResult = {
  ok: boolean;
  gatewayStatus?: number;
  durationMs?: number;
  body?: any;
  request?: unknown;
  error?: string;
};

type Applicant = {
  applicant: string;
  dateOfBirth: string;
  product: string;
  faceAmount: number;
  income: number;
  tobacco: string;
  state: string;
};

type HealthAnswers = {
  heartCondition: string;
  diabetes: string;
  hospitalization: string;
  prescriptionMedication: string;
  nicotineUse: string;
};

const initialApplicant: Applicant = {
  applicant: "Jane Smith",
  dateOfBirth: "1974-06-15",
  product: "20_YEAR_TERM",
  faceAmount: 1000000,
  income: 150000,
  tobacco: "N",
  state: "IL"
};

const initialHealth: HealthAnswers = {
  heartCondition: "NO",
  diabetes: "NO",
  hospitalization: "NO",
  prescriptionMedication: "YES",
  nicotineUse: "NO"
};

const states = ["IL", "CA", "NY", "TX", "NJ"];

export default function Home() {
  const [applicationId, setApplicationId] = useState("APP-10482");
  const [applicant, setApplicant] = useState<Applicant>(initialApplicant);
  const [healthAnswers, setHealthAnswers] = useState<HealthAnswers>(initialHealth);
  const [applicationCreated, setApplicationCreated] = useState(false);
  const [healthCompleted, setHealthCompleted] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const url = `${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL}/app`;

  const progress = useMemo(() => {
    const completed = [applicationCreated, healthCompleted, consentGiven].filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  }, [applicationCreated, healthCompleted, consentGiven]);

  function updateApplicant<K extends keyof Applicant>(key: K, value: Applicant[K]) {
    setApplicant((current) => ({ ...current, [key]: value }));
  }

  async function sendEvent(eventType: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, eventType, payload })
      });

      const result: ApiResult = await response.json();
      setLastResult(result);

      if (!result.ok) {
        throw new Error(result.error || `Unable to submit information (${result.gatewayStatus ?? "gateway error"})`);
      }

      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit information");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication(e: FormEvent) {
    e.preventDefault();

    try {
      await sendEvent("APPLICATION_CREATED", {
        ...applicant,
        consentReceived: false,
        healthQuestionsComplete: false
      });
      setApplicationCreated(true);
      setSuccess("Your basic application information has been saved.");
      setTimeout(() => document.getElementById("health-section")?.scrollIntoView({ behavior: "smooth" }), 150);
    } catch {}
  }

  async function submitHealthQuestions(e: FormEvent) {
    e.preventDefault();
    if (!applicationCreated) {
      setError("Please save your application details before completing the health questionnaire.");
      return;
    }

    try {
      await sendEvent("HEALTH_QUESTIONS_COMPLETED", {
        answers: healthAnswers,
        tobacco: healthAnswers.nicotineUse === "YES" ? "Y" : "N"
      });
      setHealthCompleted(true);
      setSuccess("Health questionnaire completed successfully.");
      setTimeout(() => document.getElementById("consent-section")?.scrollIntoView({ behavior: "smooth" }), 150);
    } catch {}
  }

  async function provideConsent() {
    if (!consentAccepted) {
      setError("Please confirm the authorization before submitting consent.");
      return;
    }

    if (!applicationCreated) {
      setError("Please save your application details first.");
      return;
    }

    try {
      await sendEvent("CONSENT_RECEIVED", {
        consentType: "APPLICATION_AND_DATA_AUTHORIZATION",
        accepted: true,
        acceptedAt: new Date().toISOString()
      });
      setConsentGiven(true);
      setSuccess("Consent recorded. Your application is ready for the next stage.");
    } catch {}
  }

  async function saveApplicationChanges() {
    if (!applicationCreated) return;
    try {
      await sendEvent("APPLICATION_UPDATED", applicant as unknown as Record<string, unknown>);
      setSuccess("Your application changes have been saved.");
    } catch {}
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <div className="brandMark">L</div>
          <div>
            <strong>LifeSure</strong>
            <span>Insurance Application</span>
          </div>
        </div>
        <div className="applicationRef">Application #
          <input required value={applicationId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplicationId(e.target.value)} />
        </div>
      </header>

      <section className="heroInsurance">
        <div className="heroInner">
          <div>
            <div className="eyebrow">LIFE INSURANCE APPLICATION</div>
            <h1>Protect what matters most.</h1>
            <p>Tell us a little about yourself. You can complete the application in a few simple steps.</p>
          </div>
          <div className="progressCard">
            <div className="progressTop"><span>Application progress</span><strong>{progress}%</strong></div>
            <div className="progressTrack"><div className="progressFill" style={{ width: `${progress}%` }} /></div>
            <div className="progressSteps">
              <span className={applicationCreated ? "done" : "active"}>1. Details</span>
              <span className={healthCompleted ? "done" : applicationCreated ? "active" : ""}>2. Health</span>
              <span className={consentGiven ? "done" : healthCompleted ? "active" : ""}>3. Consent</span>
            </div>
          </div>
        </div>
      </section>

      <div className="contentShell">
        {error && <div className="notice errorNotice">{error}</div>}
        {success && <div className="notice successNotice">{success}</div>}

        <section className="applicationSection">
          <div className="sectionHeader">
            <div className="sectionNumber">1</div>
            <div><h2>About you</h2><p>Basic information for your life insurance enquiry.</p></div>
            {applicationCreated && <span className="completeBadge">Completed</span>}
          </div>

          <form className="formCard" onSubmit={submitApplication}>
            <div className="formGrid">
              <label className="wide">Full name
                <input required value={applicant.applicant} onChange={(e) => updateApplicant("applicant", e.target.value)} />
              </label>
              <label>Date of birth
                <input required type="date" value={applicant.dateOfBirth} onChange={(e) => updateApplicant("dateOfBirth", e.target.value)} />
              </label>
              <label>State of residence
                <select value={applicant.state} onChange={(e) => updateApplicant("state", e.target.value)}>
                  {states.map((state) => <option key={state}>{state}</option>)}
                </select>
              </label>
              <label>Coverage type
                <select value={applicant.product} onChange={(e) => updateApplicant("product", e.target.value)}>
                  <option value="20_YEAR_TERM">20 Year Term Life</option>
                </select>
              </label>
              <label>Coverage amount
                <div className="moneyInput"><span>$</span><input type="number" min="100000" step="50000" value={applicant.faceAmount} onChange={(e) => updateApplicant("faceAmount", Number(e.target.value))} /></div>
              </label>
              <label>Annual income
                <div className="moneyInput"><span>$</span><input type="number" min="0" step="5000" value={applicant.income} onChange={(e) => updateApplicant("income", Number(e.target.value))} /></div>
              </label>
              <fieldset className="wide choiceField">
                <legend>Do you currently use tobacco or nicotine products?</legend>
                <div className="choiceRow">
                  <label className={`choice ${applicant.tobacco === "N" ? "selected" : ""}`}><input type="radio" name="tobacco" checked={applicant.tobacco === "N"} onChange={() => updateApplicant("tobacco", "N")} />No</label>
                  <label className={`choice ${applicant.tobacco === "Y" ? "selected" : ""}`}><input type="radio" name="tobacco" checked={applicant.tobacco === "Y"} onChange={() => updateApplicant("tobacco", "Y")} />Yes</label>
                </div>
              </fieldset>
            </div>

            <div className="formActions">
              <span>Your information is used only for this insurance demo.</span>
              {applicationCreated ? (
                <button type="button" className="secondaryButton" disabled={busy} onClick={saveApplicationChanges}>Save changes</button>
              ) : (
                <button className="primaryButton" disabled={busy}>Save & continue</button>
              )}
            </div>
          </form>
        </section>

        <section className={`applicationSection ${!applicationCreated ? "locked" : ""}`} id="health-section">
          <div className="sectionHeader">
            <div className="sectionNumber">2</div>
            <div><h2>Health questionnaire</h2><p>A few health questions help us understand what information may be needed.</p></div>
            {healthCompleted && <span className="completeBadge">Completed</span>}
          </div>

          <form className="formCard" onSubmit={submitHealthQuestions}>
            {[
              ["heartCondition", "Have you ever been diagnosed with a heart condition?"],
              ["diabetes", "Have you been diagnosed with diabetes?"],
              ["hospitalization", "Have you been hospitalized in the last 5 years?"],
              ["prescriptionMedication", "Are you currently taking prescription medication?"],
              ["nicotineUse", "Have you used nicotine products in the last 12 months?"]
            ].map(([key, question]) => (
              <div className="questionRow" key={key}>
                <span>{question}</span>
                <div className="segmented">
                  {(["NO", "YES"] as const).map((answer) => (
                    <button
                      type="button"
                      key={answer}
                      className={healthAnswers[key as keyof HealthAnswers] === answer ? "selected" : ""}
                      onClick={() => setHealthAnswers((current) => ({ ...current, [key]: answer }))}
                    >{answer === "NO" ? "No" : "Yes"}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="formActions rightOnly">
              <button className="primaryButton" disabled={busy || !applicationCreated}>{healthCompleted ? "Update health answers" : "Complete health questions"}</button>
            </div>
          </form>
        </section>

        <section className={`applicationSection ${!healthCompleted ? "locked" : ""}`} id="consent-section">
          <div className="sectionHeader">
            <div className="sectionNumber">3</div>
            <div><h2>Consent & authorization</h2><p>Authorize the use of your application information for underwriting preparation.</p></div>
            {consentGiven && <span className="completeBadge">Completed</span>}
          </div>

          <div className="formCard consentCard">
            <div className="consentIcon">✓</div>
            <div className="consentText">
              <h3>Applicant authorization</h3>
              <p>I confirm that the information provided in this application is accurate to the best of my knowledge. I authorize the insurer to use this information and obtain relevant external information required to process my application.</p>
              <p className="finePrint">This screen is a demonstration interface. No real insurance application or authorization is created.</p>
              <label className="consentCheck">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  disabled={consentGiven}
                />
                <span>I agree to the authorization above.</span>
              </label>
            </div>
            <button className={consentGiven ? "consentedButton" : "primaryButton"} disabled={busy || !healthCompleted || consentGiven || !consentAccepted} onClick={provideConsent}>
              {consentGiven ? "Consent provided" : "I agree & provide consent"}
            </button>
          </div>
        </section>

        <section className="technicalStatus">
          <div>
            <span className="techLabel">DEMO INTEGRATION STATUS</span>
            <strong>{lastResult?.ok ? "Latest action accepted by Condense" : "Waiting for application action"}</strong>
            <small>{lastResult?.body?.eventId ? `Event ${lastResult.body.eventId}` : "Actions above are sent to the Condense event gateway."}</small>
          </div>
          {lastResult && <span className={`statusPill ${lastResult.ok ? "success" : "failure"}`}>{lastResult.gatewayStatus ?? "—"}</span>}
        </section>
      </div>
    </main>
  );
}
