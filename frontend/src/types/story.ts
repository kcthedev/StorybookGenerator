export type Category =
  | "fiction"
  | "adventure"
  | "comedy"
  | "fantasy"
  | "educational";

export type VisualStyle =
  | "cartoon"
  | "watercolor"
  | "pixel"
  | "realistic"
  | "storybook";

export type StoryType =
  | "happy_ending"
  | "open_ending"
  | "mystery"
  | "age_rated";

export type ReadingLayout = "split" | "vertical";

export interface StoryOptions {
  idea: string;
  category: Category;
  visual_style: VisualStyle;
  story_type: StoryType;
  character_name: string;
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
}

export interface StoryState {
  id: string;
  title: string;
  options: StoryOptions;
  pages: StoryPage[];
  current_page: number;
}
