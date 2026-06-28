import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  writeSessionCookies,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!body.accessToken || !body.refreshToken) {
      return NextResponse.json({ error: "Session tokens are required." }, { status: 400 });
    }
    const { identity } = createBrowserIdentityServices();
    const verified = await identity.verifySession(body.accessToken);
    const response = NextResponse.json({ verified: true });
    writeSessionCookies(
      response,
      { ...verified, refreshToken: body.refreshToken },
      false,
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Session verification failed." }, { status: 401 });
  }
}
