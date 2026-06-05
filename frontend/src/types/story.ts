export type Category =
  | "fiction"
  | "adventure"
  | "comedy"
  | "fantasy"
  | "educational"
  | "sci_fi"
  | "fairy_tale"
  | "animal"
  | "friendship"
  | "bedtime"
  | "superhero"
  | "nature"
  | "historical";

export type VisualStyle =
  | "cartoon"
  | "watercolor"
  | "pixel"
  | "realistic"
  | "storybook"
  | "anime"
  | "claymation"
  | "crayon"
  | "comic_book"
  | "pastel"
  | "chalk"
  | "paper_cutout"
  | "oil_painting";

export type Audience = "all_ages" | "teen" | "adult";

export type StoryType =
  | "happy_ending"
  | "open_ending"
  | "mystery"
  | "age_rated"
  | "choose_your_own"
  | "suspense"
  | "inspiring"
  | "quest"
  | "surprise_twist"
  | "bedtime_calm";

export type ReadingLayout = "split" | "vertical";

export type LlmProvider = "openai" | "gemini";

export interface LlmProviderStatus {
  id: LlmProvider;
  label: string;
  configured: boolean;
  available: boolean;
}

export interface StoryOptions {
  idea: string;
  category: Category;
  visual_style: VisualStyle;
  story_type: StoryType;
  audience?: Audience;
  character_name: string;
  llm_provider?: LlmProvider;
}

export interface ActionChoice {
  choice_id: string;
  label: string;
}

export interface StoryPage {
  page_number: number;
  text: string;
  scene_description: string;
  image_url?: string | null;
  choices: ActionChoice[];
  is_ending: boolean;
  recap?: string | null;
}

export interface StoryState {
  id: string;
  title: string;
  options: StoryOptions;
  pages: StoryPage[];
  current_page: number;
}
