import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.GATEWAY_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "GATEWAY_BASE_URL is not configured in Vercel" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
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
        body
      },
      { status: response.ok ? 200 : 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Gateway health check failed"
      },
      { status: 502 }
    );
  }
}
