from app.models.story import StoryOptions
from app.services.story_tone import ending_narration_note, mood_narration_note


def build_narration_instructions(options: StoryOptions) -> str:
    audience_notes = {
        "all_ages": "Family-friendly, clear, and welcoming to every listener.",
        "teen": "More emotional range and sharper expression.",
        "adult": "Sophisticated, nuanced delivery for mature listeners.",
    }

    audience = audience_notes.get(
        options.audience.value, "Clear and engaging for all listeners."
    )
    mood = mood_narration_note(options.mood)
    ending = ending_narration_note(options.ending)

    return (
        f"You are narrating an illustrated interactive story based on this idea: {options.idea}. "
        f"{mood} {ending} {audience} "
        "Read naturally, with appropriate pauses. Do not add commentary beyond the text."
    )
