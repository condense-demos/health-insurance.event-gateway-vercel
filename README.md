# LifeSure Insurance Application Demo

A Vercel/Next.js insurance-style frontend for validating the Condense `event-gateway` service.

## Applicant experience

The frontend no longer exposes JSON. It presents three insurance-application steps:

1. **About you** — name, DOB, state, product, coverage, income, tobacco usage.
2. **Health questionnaire** — interactive Yes/No health questions.
3. **Consent & authorization** — applicant consent action.

The UI also allows the applicant to modify application details after creation using **Save changes**.

## Gateway events

The user interactions preserve the existing event-gateway contract:

- `APPLICATION_CREATED`
- `APPLICATION_UPDATED`
- `HEALTH_QUESTIONS_COMPLETED`
- `CONSENT_RECEIVED`

Browser requests go through the existing Vercel server-side proxy:

```text
Browser -> /api/gateway/events -> Condense event-gateway -> Kafka
```

## Configuration

Create `.env.local` locally or configure the following Vercel environment variable:

```bash
GATEWAY_BASE_URL=https://<your-condense-event-gateway>
```

Do not prefix it with `NEXT_PUBLIC_`.

## Local run

```bash
npm install
npm run dev
```

## Demo sequence

1. Fill **About you** and click **Save & continue**.
2. Complete the interactive health questionnaire.
3. Click **I agree & provide consent**.
4. Modify application fields and click **Save changes** whenever `APPLICATION_UPDATED` needs to be demonstrated.

A small integration status area at the bottom indicates whether the latest action was accepted by Condense, without exposing technical JSON to the applicant.


## Demo defaults

The applicant form is pre-populated so the demo can be run without typing every field. All values remain editable before submission. Current defaults include Jane Smith, a 20-year term policy, $1M coverage, $150K income, Illinois residence, non-smoker status, health-question answers, and a pre-selected demo authorization checkbox.
