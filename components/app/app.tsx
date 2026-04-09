'use client';

import { useEffect, useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import { useLocalParticipant, useRoomContext, useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();
  
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();

  useEffect(() => {
    if (room.state === 'connected' && localParticipant.localParticipant) {
      const connectionData = {
        room: room.name || '',
        roomID: (room as any).sid || '',
        participant: localParticipant.localParticipant.name || '',
        pID: localParticipant.localParticipant.identity || '',
        metadata: localParticipant.localParticipant.metadata || '',
      };
      
      console.log('=== Connection Details (Ready for Agent) ===');
      console.log(connectionData);
      
      // Parse and show metadata if available
      if (connectionData.metadata) {
        try {
          const parsedMetadata = JSON.parse(connectionData.metadata);
          console.log('=== URL Parameters for Agent ===');
          console.log(parsedMetadata);
          console.log('================================');
        } catch (e) {
          console.log('Metadata:', connectionData.metadata);
        }
      }
      console.log('============================================');
    }
  }, [room, room.state, localParticipant.localParticipant]);

  return null;
}

interface AppProps {
  appConfig: AppConfig;
  urlParams?: { [key: string]: string | string[] | undefined };
}

export function App({ appConfig, urlParams }: AppProps) {
  const tokenSource = useMemo(() => {
    console.log('=== Creating Token Source ===');
    console.log('URL Params:', urlParams);
    console.log('Sandbox Endpoint:', process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT);
    console.log('============================');
    
    if (typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string') {
      console.log('Using SANDBOX token source with URL params');
      return getSandboxTokenSource(appConfig, urlParams);
    }
    
    // Create custom token source that sends URL params to backend
    const queryString = urlParams 
      ? '?' + new URLSearchParams(urlParams as Record<string, string>).toString() 
      : '';
    
    const endpoint = `/api/token${queryString}`;
    console.log('Using LOCAL /api/token endpoint:', endpoint);
    
    return TokenSource.endpoint(endpoint);
  }, [appConfig, urlParams]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  // Update local participant metadata with URL params after connection
  const room = session.room;
  useEffect(() => {
    if (room && urlParams && room.localParticipant) {
      const metadataStr = JSON.stringify(urlParams);
      console.log('=== Setting Participant Metadata ===');
      console.log('Metadata:', metadataStr);
      console.log('====================================');
      room.localParticipant.setMetadata(metadataStr);
    }
  }, [room, urlParams]);

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController appConfig={appConfig} />
      </main>
      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}
