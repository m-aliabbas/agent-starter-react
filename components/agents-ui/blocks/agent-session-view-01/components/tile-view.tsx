'use client';

import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import {
  type TrackReference,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { cn } from '@/lib/shadcn/utils';

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface TileLayoutProps {
  chatOpen: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerWaveLineWidth?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerBarCount?: number;
}

export function TileLayout({ audioVisualizerColor }: TileLayoutProps) {
  const { state, audioTrack, videoTrack: agentVideoTrack } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const previewTrack = cameraTrack && !cameraTrack.publication.isMuted ? cameraTrack : screenShareTrack;
  const assistantColor = audioVisualizerColor ?? '#5f52f6';
  const assistantWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const assistantHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;
  const previewWidth = previewTrack?.publication.dimensions?.width ?? 0;
  const previewHeight = previewTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-[1.4rem] border border-[#d9dcff] bg-[linear-gradient(135deg,#fbfbff_0%,#eef1ff_72%,#e7fbf1_100%)] shadow-[0_12px_30px_rgba(76,61,176,0.10)] md:size-24">
        {agentVideoTrack ? (
          <VideoTrack
            width={assistantWidth}
            height={assistantHeight}
            trackRef={agentVideoTrack}
            className="size-full object-cover"
          />
        ) : (
          <AgentAudioVisualizerBar
            size="icon"
            barCount={5}
            state={state}
            audioTrack={audioTrack}
            color={assistantColor}
            className="h-8 gap-1"
          >
            <span className="min-h-1.5 w-1.5 rounded-full bg-current/20 data-[lk-highlighted=true]:bg-current" />
          </AgentAudioVisualizerBar>
        )}
      </div>

      {previewTrack && (
        <div className="hidden size-14 overflow-hidden rounded-[1rem] border border-[#d9dcff] bg-white shadow-[0_8px_20px_rgba(76,61,176,0.10)] sm:block">
          <VideoTrack
            width={previewWidth}
            height={previewHeight}
            trackRef={previewTrack}
            className={cn('size-full object-cover')}
          />
        </div>
      )}
    </div>
  );
}
