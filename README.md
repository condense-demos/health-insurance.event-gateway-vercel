# Insurance Event Gateway — Vercel Validator

This is the first frontend slice of the Condense insurance demo.

Its purpose is intentionally narrow: validate the completed `event-gateway` service before the downstream streaming services are added.

## Flow

```text
Browser
  |
  | POST /api/gateway/events
  v
Vercel Next.js server route
  |
  | POST /application/:applicationId/events
  v
Condense event-gateway
  |
  v
Kafka: insurance.application.events
```

The Vercel server route acts as a proxy so:

- the Condense gateway URL is not exposed in browser JavaScript;
- browser CORS configuration is not required on the gateway;
- environment-specific gateway URLs can be configured directly in Vercel.

## Configure

Create `.env.local`:

```bash
GATEWAY_BASE_URL=https://<your-condense-event-gateway>
```

For a local gateway:

```bash
GATEWAY_BASE_URL=http://localhost:8080
```

In Vercel, configure the same variable under Project Settings → Environment Variables.

Do not prefix this variable with `NEXT_PUBLIC_`.

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## What to validate

### Health

Click **Check health**.

The application calls:

```text
GET <GATEWAY_BASE_URL>/health
```

### APPLICATION_CREATED

The page sends the Jane Smith application:

```text
POST <GATEWAY_BASE_URL>/application/APP-10482/events
```

with:

```json
{
  "eventType": "APPLICATION_CREATED",
  "payload": {
    "applicant": "Jane Smith",
    "dateOfBirth": "1974-06-15",
    "product": "20_YEAR_TERM",
    "faceAmount": 1000000,
    "income": 150000,
    "tobacco": "N",
    "state": "IL",
    "consentReceived": true,
    "healthQuestionsComplete": false
  }
}
```

The gateway should return its normal HTTP 202 acknowledgement. The Vercel proxy returns the gateway status, response body, forwarded payload and measured request duration to the UI.

### Other supported events

The screen also sends:

- `HEALTH_QUESTIONS_COMPLETED`
- `CONSENT_RECEIVED`
- `APPLICATION_UPDATED`

These are enough to validate the event-gateway contract before Service 2 (`insurance-application-processing`) is connected.

## Expected validation result

For every successful event, verify:

1. UI shows `ACCEPTED`;
2. gateway HTTP status is `202`;
3. returned `eventId` is visible in the gateway response;
4. `applicationId` is correct;
5. `eventType` is correct;
6. corresponding record appears on `insurance.application.events` with Kafka key equal to the application ID.

The final Kafka verification must be done through Condense/Kafka tooling because this frontend only validates the HTTP boundary.
