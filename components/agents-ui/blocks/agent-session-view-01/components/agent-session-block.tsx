'use client';

import React from 'react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/shadcn/utils';
import { TileLayout } from './tile-view';

export interface AgentSessionView_01Props {
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  isPreConnectBufferEnabled?: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  className?: string;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  isPreConnectBufferEnabled = true,
  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { state: agentState } = useAgent();
  void supportsVideoInput;
  void supportsScreenShare;

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: false,
    camera: false,
    screenShare: false,
  };

  return (
    <section
      ref={ref}
      className={cn(
        'relative min-h-svh w-full overflow-hidden bg-[linear-gradient(180deg,#fbfaff_0%,#f4f1ff_52%,#f8fbff_100%)]',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,82,246,0.14),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(150,240,195,0.10),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-svh max-w-5xl items-center justify-center px-4 py-5 md:px-6 md:py-8">
        <div className="flex h-[calc(100svh-2.5rem)] max-h-[920px] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-[#dcdfff] bg-white/88 shadow-[0_32px_110px_rgba(76,61,176,0.16)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 border-b border-[#ebe8ff] px-5 py-4 md:px-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em] text-[#8e88b7] uppercase">
                Live Property Chat
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#261f58] md:text-3xl">
                UK Property Advisor
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#726c96] md:text-base">
                Ask about renting, buying, deposits, offers, mortgages, or comparing homes.
              </p>
            </div>

            <TileLayout
              chatOpen={supportsChatInput}
              audioVisualizerType={audioVisualizerType}
              audioVisualizerColor={audioVisualizerColor}
              audioVisualizerColorShift={audioVisualizerColorShift}
              audioVisualizerBarCount={audioVisualizerBarCount}
              audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
              audioVisualizerRadialRadius={audioVisualizerRadialRadius}
              audioVisualizerGridRowCount={audioVisualizerGridRowCount}
              audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
              audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
            />
          </div>

          {isPreConnectBufferEnabled && messages.length === 0 && (
            <div className="px-5 pt-3 md:px-6">
              <Shimmer className="inline-flex rounded-full bg-[#f5f3ff] px-4 py-2 text-sm font-medium text-[#5a4fc9] shadow-[inset_0_0_0_1px_rgba(207,212,255,0.8)]">
                {preConnectMessage}
              </Shimmer>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col px-3 pt-3 pb-3 md:px-4 md:pb-4">
            <div className="min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-[#ebe8ff] bg-[linear-gradient(180deg,#fdfcff_0%,#f7f4ff_100%)]">
              <AgentChatTranscript
                agentState={agentState}
                messages={messages}
                className="h-full min-h-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none [&>div>div]:px-4 [&>div>div]:py-4 md:[&>div>div]:px-6"
              />
            </div>

            <div className="mt-3 rounded-[1.5rem] border border-[#ebe8ff] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(76,61,176,0.08)]">
              <AgentControlBar
                variant="livekit"
                controls={controls}
                isChatOpen={supportsChatInput}
                isConnected={session.isConnected}
                onDisconnect={session.end}
                className="rounded-none border-0 bg-transparent p-0 shadow-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
