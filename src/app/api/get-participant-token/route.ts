import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Get parameters from the URL (e.g., /api/get-participant-token?room=123&username=User)
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");

  // 2. Validate inputs
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  // 3. Get Credentials from .env.local
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Server misconfigured: Missing API keys" }, { status: 500 });
  }

  // 4. Create the Access Token
  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });

  // 5. Set Permissions (Grant join, publish, and subscribe)
  at.addGrant({ 
    roomJoin: true, 
    room: room, 
    canPublish: true, 
    canSubscribe: true 
  });

  // 6. Return the JWT token
  return NextResponse.json(
    { token: await at.toJwt() },
    {
      headers: {
        // This header helps bypass some tunnel warnings for API calls
        "bypass-tunnel-reminder": "true",
      },
    }
  );
}