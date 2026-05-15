"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: string[];
}

export function PhasePhotoGallery({ photos }: Props) {
  const [index, setIndex] = useState(0);

  if (!photos.length) return null;

  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <div className="relative w-full h-[280px] md:h-[420px] bg-[#0f172a] flex items-center justify-center overflow-hidden">
      {/* Current image */}
      <img
        key={index}
        src={photos[index]}
        alt={`Photo ${index + 1}`}
        className="max-h-full max-w-full object-contain select-none"
      />

      {/* Prev / Next arrows — only shown when multiple photos */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && photos.length <= 10 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <p className="absolute bottom-3 right-3 text-[11px] text-slate-400 pointer-events-none">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
