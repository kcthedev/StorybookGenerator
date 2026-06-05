"use client";

import { useEffect, useState } from "react";
import type { VisualStyle } from "@/types/story";

const styleGradients: Record<VisualStyle, string> = {
  cartoon: "from-amber-200 via-orange-300 to-rose-400",
  watercolor: "from-sky-200 via-indigo-200 to-violet-300",
  pixel: "from-emerald-300 via-teal-400 to-cyan-500",
  realistic: "from-stone-300 via-zinc-400 to-slate-500",
  storybook: "from-yellow-100 via-amber-200 to-orange-300",
  anime: "from-pink-200 via-fuchsia-300 to-purple-400",
  claymation: "from-orange-200 via-amber-300 to-yellow-400",
  crayon: "from-red-200 via-yellow-200 to-blue-300",
  comic_book: "from-yellow-300 via-red-400 to-blue-500",
  pastel: "from-rose-100 via-pink-200 to-sky-200",
  chalk: "from-slate-600 via-slate-500 to-slate-400",
  paper_cutout: "from-lime-200 via-amber-200 to-orange-200",
  oil_painting: "from-amber-300 via-orange-400 to-red-500",
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

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageUrl]);

  return (
    <div
      className="scene-illustration relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-amber-50/90 shadow-inner"
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
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
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
