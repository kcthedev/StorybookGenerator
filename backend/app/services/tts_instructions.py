from app.models.story import StoryOptions


def build_narration_instructions(options: StoryOptions) -> str:
    category_notes = {
        "adventure": "Adventurous pacing with a sense of wonder and momentum.",
        "comedy": "Light, playful delivery with warmth and gentle humor.",
        "fantasy": "Magical, immersive tone that draws the listener into another world.",
        "bedtime": "Soft, slow, and soothing — perfect for winding down.",
        "mystery": "Measured suspense with quiet curiosity and tension.",
        "suspense": "Taut and gripping, building anticipation without rushing.",
        "friendship": "Warm, heartfelt, and emotionally connected.",
        "fairy_tale": "Classic storybook cadence — whimsical and timeless.",
        "educational": "Clear, encouraging, and easy to follow.",
        "sci_fi": "Futuristic and vivid, with crisp imaginative detail.",
        "animal": "Gentle and lively, as if sharing a beloved animal tale.",
        "superhero": "Bold and heroic, with energetic confidence.",
        "nature": "Peaceful and atmospheric, evoking the outdoors.",
        "historical": "Dignified and evocative, like a trusted chronicler.",
        "fiction": "Natural literary narration with emotional nuance.",
    }
    story_type_notes = {
        "happy_ending": "Leave room for warmth and optimism.",
        "open_ending": "Thoughtful and reflective, inviting imagination.",
        "mystery": "Keep a hint of intrigue in your phrasing.",
        "suspense": "Build quiet tension; pause meaningfully.",
        "inspiring": "Uplifting and sincere, never preachy.",
        "quest": "Epic and purposeful, like a journey unfolding.",
        "surprise_twist": "Subtle shifts in energy when revelations appear.",
        "bedtime_calm": "Very gentle, unhurried, and reassuring.",
        "choose_your_own": "Engaging and inviting, as if speaking directly to the reader.",
        "age_rated": "Mature but restrained — nuanced, never gratuitous.",
    }
    audience_notes = {
        "all_ages": "Family-friendly, clear, and welcoming to every listener.",
        "teen": "More emotional range and sharper expression.",
        "adult": "Sophisticated, nuanced delivery for mature listeners.",
    }

    category = category_notes.get(
        options.category.value, "Engaging storybook narration."
    )
    story_type = story_type_notes.get(
        options.story_type.value, "Match the emotional arc of the scene."
    )
    audience = audience_notes.get(
        options.audience.value, "Clear and engaging for all listeners."
    )

    return (
        f"You are narrating an illustrated interactive story about {options.character_name}. "
        f"Genre: {options.category.value.replace('_', ' ')}. "
        f"Story type: {options.story_type.value.replace('_', ' ')}. "
        f"{category} {story_type} {audience} "
        "Read naturally, with appropriate pauses. Do not add commentary beyond the text."
    )
