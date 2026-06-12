"""Helpers for mood and ending sliders (0–100)."""


def mood_guidance(mood: int) -> str:
    if mood <= 20:
        return (
            "Mood/tone: melancholic and bittersweet. Lean into sadness, loss, or quiet sorrow "
            "while keeping the story meaningful."
        )
    if mood <= 40:
        return (
            "Mood/tone: gently somber with emotional depth. Allow tender or wistful moments "
            "without becoming bleak."
        )
    if mood <= 60:
        return (
            "Mood/tone: balanced emotional range. Mix light and heavy beats naturally "
            "as the plot demands."
        )
    if mood <= 80:
        return (
            "Mood/tone: warm and uplifting. Favor hope, humor, and comforting beats "
            "without ignoring stakes."
        )
    return (
        "Mood/tone: joyful, optimistic, and lighthearted. Celebrate wonder, laughter, "
        "and feel-good momentum."
    )


def ending_guidance(ending: int) -> str:
    if ending <= 20:
        return (
            "Ending style: full closure. Resolve the central conflict and major threads "
            "with a satisfying, complete conclusion."
        )
    if ending <= 40:
        return (
            "Ending style: mostly resolved. Tie up the main plot while allowing minor "
            "loose ends to feel natural."
        )
    if ending <= 60:
        return (
            "Ending style: open-ended. Offer partial resolution and leave some questions "
            "for the reader to ponder."
        )
    if ending <= 80:
        return (
            "Ending style: suspenseful. End with unresolved tension, unanswered questions, "
            "or a looming threat."
        )
    return (
        "Ending style: cliffhanger. Stop at a dramatic reveal or crisis that makes "
        "the reader desperate to know what happens next."
    )


def mood_music_description(mood: int) -> str:
    if mood <= 25:
        return "slow piano and soft minor-key strings, reflective and bittersweet"
    if mood <= 50:
        return "gentle acoustic instruments with a neutral, storybook warmth"
    if mood <= 75:
        return "warm acoustic guitar and light bells with an uplifting feel"
    return "upbeat acoustic instruments with light rhythm and bright harmony"


def mood_narration_note(mood: int) -> str:
    if mood <= 25:
        return "Soft, restrained delivery with room for sorrow and tenderness."
    if mood <= 50:
        return "Natural literary narration with balanced emotional nuance."
    if mood <= 75:
        return "Warm delivery with gentle optimism and inviting energy."
    return "Bright, playful pacing with warmth and optimism."


def ending_narration_note(ending: int) -> str:
    if ending <= 25:
        return "Land the final beats with calm resolution and closure."
    if ending <= 50:
        return "Close with a sense of completion while staying thoughtful."
    if ending <= 75:
        return "Leave a hint of mystery or tension in your phrasing."
    return "Build quiet suspense at the end; pause meaningfully before the final line."
