import { StoryCreator } from "@/components/StoryCreator";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 md:py-20">
      <div className="mb-10 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-amber-950 md:text-5xl">
          Storybook Generator
        </h1>
        <p className="mt-4 text-lg text-amber-800/90">
          Turn a simple idea into an interactive picture book. Pick a style,
          generate page by page, and guide the hero with your choices.
        </p>
      </div>
      <StoryCreator />
    </main>
  );
}
