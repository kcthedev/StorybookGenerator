import { StoryReader } from "@/components/StoryReader";
import { getStory } from "@/lib/api";
import Link from "next/link";

interface ReaderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { id } = await params;

  try {
    const story = await getStory(id);
    return (
      <main className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-12 lg:px-8">
        <StoryReader initialStory={story} />
      </main>
    );
  } catch {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-lg text-amber-900">Story not found.</p>
        <Link href="/" className="font-medium text-amber-600 hover:text-amber-800">
          Create a new story
        </Link>
      </main>
    );
  }
}
