'use client';

import { useEffect, useRef } from 'react';

type KeyMode = 'black' | 'cream';

function keyFramePixels(data: Uint8ClampedArray, mode: KeyMode) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (mode === 'black') {
      const lum = Math.max(r, g, b);
      if (lum <= 28) data[i + 3] = 0;
      else if (lum < 58) data[i + 3] = Math.min(data[i + 3], Math.floor((lum - 28) * 8));
    } else {
      const lum = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum > 168 && sat < 48) {
        data[i + 3] = Math.min(data[i + 3], Math.max(0, Math.floor((212 - lum) * 7)));
      }
    }
  }
}

type KeyedVideoProps = {
  src: string;
  playing: boolean;
  startAt?: number;
  rate?: number;
  keyMode: KeyMode;
  className?: string;
  style?: React.CSSProperties;
};

export function KeyedVideo({
  src,
  playing,
  startAt = 0.5,
  rate = 1,
  keyMode,
  className,
  style,
}: KeyedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let raf = 0;
    video.playbackRate = rate;

    const paint = () => {
      if (video.readyState >= 2) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        keyFramePixels(frame.data, keyMode);
        ctx.putImageData(frame, 0, 0);
      }
      raf = requestAnimationFrame(paint);
    };

    const boot = () => {
      video.currentTime = startAt;
      if (playing) video.play().catch(() => {});
      else video.pause();
      paint();
    };

    if (video.readyState >= 2) boot();
    else video.addEventListener('loadeddata', boot, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('loadeddata', boot);
    };
  }, [src, playing, startAt, rate, keyMode]);

  return (
    <>
      <video ref={videoRef} src={src} loop muted playsInline preload="auto" style={{ display: 'none' }} />
      <canvas ref={canvasRef} className={className} style={style} />
    </>
  );
}
