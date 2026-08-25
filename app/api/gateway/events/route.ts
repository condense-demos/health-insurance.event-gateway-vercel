import { NextRequest, NextResponse } from "next/server";

type RequestBody = {
  applicationId?: string;
  eventType?: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const baseUrl = process.env.GATEWAY_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "GATEWAY_BASE_URL is not configured in Vercel" },
      { status: 500 }
    );
  }

  let incoming: RequestBody;
  try {
    incoming = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON request" },
      { status: 400 }
    );
  }

  const applicationId = incoming.applicationId?.trim();
  const eventType = incoming.eventType?.trim();

  if (!applicationId || !eventType) {
    return NextResponse.json(
      { ok: false, error: "applicationId and eventType are required" },
      { status: 400 }
    );
  }

  const gatewayRequest = {
    eventType,
    payload: incoming.payload ?? {}
  };

  const url =
    `${baseUrl.replace(/\/$/, "")}/application/${encodeURIComponent(applicationId)}/events`;

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(gatewayRequest),
      cache: "no-store",
      signal: AbortSignal.timeout(12000)
    });

    const text = await response.text();
    let body: unknown;

    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    return NextResponse.json(
      {
        ok: response.ok,
        gatewayStatus: response.status,
        durationMs: Date.now() - startedAt,
        request: gatewayRequest,
        body
      },
      { status: response.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        request: gatewayRequest,
        error: error instanceof Error ? error.message : "Gateway request failed"
      },
      { status: 502 }
    );
  }
}
