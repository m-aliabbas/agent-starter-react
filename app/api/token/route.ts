import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type RoomConfigurationJson = Parameters<typeof RoomConfiguration.fromJson>[0];

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  metadata?: Record<string, unknown>;
};

type TokenRequestBody = {
  room_config?: RoomConfigurationJson;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export async function GET(req: Request) {
  // Extract and log URL parameters
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);

  console.log('=== URL Parameters ===');
  console.log(params);
  console.log('======================');

  return NextResponse.json({
    message: 'URL Parameters received',
    parameters: params,
    url: url.toString(),
  });
}

export async function POST(req: Request) {
  console.log('===================================');
  console.log('🔵 POST /api/token called');
  console.log('===================================');

  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'THIS API ROUTE IS INSECURE. DO NOT USE THIS ROUTE IN PRODUCTION WITHOUT AN AUTHENTICATION LAYER.'
    );
  }

  try {
    // Extract and log URL parameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams);
    console.log('=== URL Parameters ===');
    console.log(params);
    console.log('======================');

    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse room config from request body.
    const body = (await req.json()) as TokenRequestBody;
    // Recreate the RoomConfiguration object from JSON object.
    const roomConfig = body?.room_config
      ? RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true })
      : undefined;

    // Generate participant token
    const participantName = params.agent_name || 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    console.log('=== Data being sent to LiveKit Agent ===');
    console.log('Participant Metadata:', params);
    console.log('Token Attributes:', params);
    console.log('========================================');

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName, metadata: JSON.stringify(params) },
      roomName,
      roomConfig,
      params as Record<string, string> // Pass URL params as token attributes for agent access
    );

    // Return connection details with URL parameters
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName,
      participantToken,
      metadata: params,
    };

    console.log('=== Response Data ===');
    console.log(data);
    console.log('=====================');
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  roomConfig?: RoomConfiguration,
  attributes?: Record<string, string>
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  // Add custom attributes that the agent can access
  if (attributes) {
    at.attributes = attributes;
  }

  if (roomConfig) {
    at.roomConfig = roomConfig;
  }

  return at.toJwt();
}
