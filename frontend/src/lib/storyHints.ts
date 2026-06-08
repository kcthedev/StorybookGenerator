const STORY_HINTS = [
  "A detective follows a clue through a rain-soaked city, or a traveler opens a door to another world...",
  "A shy inventor builds a robot friend who starts asking impossible questions...",
  "Two rivals on a cooking show discover a secret ingredient that changes everything...",
  "A lighthouse keeper spots a glowing ship that only appears at midnight...",
  "A kid finds a map tucked inside an old library book, leading to a hidden garden...",
  "A retired superhero is pulled back for one last mission when their city needs them...",
  "A musician hears a melody no one else can, coming from deep beneath the ocean...",
  "A time traveler keeps arriving one day too late to fix the same mistake...",
  "A dragon who is afraid of heights must cross a mountain to save a village...",
  "A postal worker delivers letters addressed to people who do not exist yet...",
  "A stranded astronaut discovers signs of life on a planet that should be empty...",
  "A baker's sourdough starter develops a personality and starts giving advice...",
  "A museum night guard realizes the paintings are rearranging themselves...",
  "A runaway umbrella leads a child through a storm into a town that vanished years ago...",
  "A chess champion plays against a mysterious opponent who never shows their face...",
  "A gardener grows flowers that bloom in colors no one has ever named...",
  "A street magician's tricks start working for real, and the crowd panics...",
  "A deep-sea diver finds a door at the bottom of a trench, slightly ajar...",
  "A school hamster escapes and becomes the unlikely hero of a neighborhood mystery...",
  "A comet passes overhead and everyone in town wakes up with swapped memories...",
] as const;

export const DEFAULT_STORY_HINT = STORY_HINTS[0];

export function getRandomStoryHint(): string {
  const index = Math.floor(Math.random() * STORY_HINTS.length);
  return STORY_HINTS[index];
}
