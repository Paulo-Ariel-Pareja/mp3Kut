import { useEffect, useRef, useState } from 'react';
import { Scissors, X } from 'lucide-react';
import { CutPoint, formatTime } from '../utils/audioProcessor';

interface WaveformProps {
  audioBuffer: AudioBuffer;
  cutPoints: CutPoint[];
  onAddCutPoint: (time: number) => void;
  onRemoveCutPoint: (id: string) => void;
  currentTime: number;
}

export const Waveform = ({
  audioBuffer,
  cutPoints,
  onAddCutPoint,
  onRemoveCutPoint,
  currentTime,
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const x = i;
      const y1 = (1 + min) * amp;
      const y2 = (1 + max) * amp;

      if (i === 0) {
        ctx.moveTo(x, y1);
      } else {
        ctx.lineTo(x, y1);
      }
      ctx.lineTo(x, y2);
    }

    ctx.stroke();

    const progressX = (currentTime / audioBuffer.duration) * width;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.stroke();

    cutPoints.forEach((point) => {
      const x = (point.time / audioBuffer.duration) * width;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }, [audioBuffer, cutPoints, currentTime]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const time = (x / width) * audioBuffer.duration;

    const clickThreshold = 10;
    const clickedPoint = cutPoints.find((point) => {
      const pointX = (point.time / audioBuffer.duration) * width;
      return Math.abs(pointX - x) < clickThreshold;
    });

    if (clickedPoint) {
      onRemoveCutPoint(clickedPoint.id);
    } else {
      onAddCutPoint(time);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const clickThreshold = 10;
    const hoveredCutPoint = cutPoints.find((point) => {
      const pointX = (point.time / audioBuffer.duration) * width;
      return Math.abs(pointX - x) < clickThreshold;
    });

    setHoveredPoint(hoveredCutPoint ? hoveredCutPoint.id : null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scissors className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Forma de Onda</h3>
          <span className="text-sm text-gray-400 ml-auto">
            Haz clic para agregar puntos de corte
          </span>
        </div>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          className={`w-full h-32 rounded ${
            hoveredPoint ? 'cursor-pointer' : 'cursor-crosshair'
          }`}
        />
      </div>

      {cutPoints.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">
            Puntos de Corte ({cutPoints.length})
          </h4>
          <div className="space-y-2">
            {cutPoints
              .sort((a, b) => a.time - b.time)
              .map((point, index) => (
                <div
                  key={point.id}
                  className="flex items-center justify-between bg-gray-700 rounded px-3 py-2"
                >
                  <span className="text-gray-300 text-sm">
                    Corte {index + 1}: {formatTime(point.time)}
                  </span>
                  <button
                    onClick={() => onRemoveCutPoint(point.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
