"use client";

import { useState } from "react";
import type { VisualStyle } from "@/types/story";

const styleGradients: Record<VisualStyle, string> = {
  cartoon: "from-amber-200 via-orange-300 to-rose-400",
  watercolor: "from-sky-200 via-indigo-200 to-violet-300",
  pixel: "from-emerald-300 via-teal-400 to-cyan-500",
  realistic: "from-stone-300 via-zinc-400 to-slate-500",
  storybook: "from-yellow-100 via-amber-200 to-orange-300",
};

interface SceneIllustrationProps {
  sceneDescription: string;
  visualStyle: VisualStyle;
  imageUrl?: string | null;
}

export function SceneIllustration({
  sceneDescription,
  visualStyle,
  imageUrl,
}: SceneIllustrationProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const gradient = styleGradients[visualStyle];
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div
      className="relative h-full min-h-[220px] w-full overflow-hidden rounded-2xl shadow-inner"
      role="img"
      aria-label={sceneDescription}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-500 ${
          showImage && loaded ? "opacity-0" : "opacity-100"
        }`}
      />

      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt={sceneDescription}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}

      {!showImage && (
        <div className="absolute inset-0 flex items-end p-6">
          <p className="text-sm font-medium leading-relaxed text-white drop-shadow-md md:text-base">
            {sceneDescription}
          </p>
        </div>
      )}

      {showImage && !loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-amber-900 shadow">
            Loading illustration…
          </span>
        </div>
      )}
    </div>
  );
}
