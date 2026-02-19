import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatTime } from '../utils/audioProcessor';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer;
  onTimeUpdate: (time: number) => void;
}

export const AudioPlayer = ({ audioBuffer, onTimeUpdate }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const duration = audioBuffer?.duration || 0;

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {}
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const updateTime = () => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    const newTime = Math.min(pauseTimeRef.current + elapsed, duration);

    setCurrentTime(newTime);
    onTimeUpdate(newTime);

    if (newTime >= duration - 0.01) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      pauseTimeRef.current = 0;
      setCurrentTime(0);
      return;
    }

    animFrameRef.current = requestAnimationFrame(updateTime);
  };

  const play = () => {
    if (!audioBuffer) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0, pauseTimeRef.current);

    startTimeRef.current = audioContextRef.current.currentTime;
    sourceRef.current = source;
    isPlayingRef.current = true;
    setIsPlaying(true);

    source.onended = () => {
      pauseTimeRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    animFrameRef.current = requestAnimationFrame(updateTime);
  };

  const pause = () => {
    if (!sourceRef.current || !audioContextRef.current) return;

    try {
      sourceRef.current.stop();
    } catch {}

    pauseTimeRef.current += audioContextRef.current.currentTime - startTimeRef.current;
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, pauseTimeRef.current + seconds));
    pauseTimeRef.current = newTime;
    setCurrentTime(newTime);
    onTimeUpdate(newTime);

    if (isPlaying) {
      pause();
      play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    pauseTimeRef.current = newTime;
    setCurrentTime(newTime);
    onTimeUpdate(newTime);

    if (isPlaying) {
      pause();
      play();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => skip(-5)}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={() => skip(5)}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
