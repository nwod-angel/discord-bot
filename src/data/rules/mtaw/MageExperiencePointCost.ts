export default {
    name: "Experience Point Costs",
    prefix: "MtAw",
    sources: [
        {
            sourceBook: "Mage: the Awakening",
            sourcePage: "69"
        }
    ],
    paragraphs: [
        {prefix: "Attribute", text: "New dots x 5"},
        {prefix: "Skill", text: "New dots x 3"},
        {prefix: "Skill Specialty", text: "3 points"},
        {prefix: "Ruling Arcana*", text: "New dots x 6"},
        {prefix: "Common Arcana*", text: "New dots x 7"},
        {prefix: "Inferior Arcanum*", text: "New dots x 8"},
        {prefix: "Rote", text: "2 points per dot**"},
        {prefix: "Merit", text: "New dots x 2"},
        {prefix: "Gnosis", text: "New dots x 8"},
        {prefix: "Wisdom", text: "New dots x 3"},
        {prefix: "Willpower", text: "8 experience points***"},
        "* The categories of Ruling, Common and Inferior are determined by the character’s Path. See “The Laws of Higher Realities,” p. 132.",
        "** Rotes are rated by the highest Arcanum dot used, so a Forces 3 rote would cost six experience points to learn.",
        "*** Experience points can be spent on Willpower only to restore dots lost through sacrifice (such as when a mage creates a new rote, p. 291, or performs some other feat that requires such a sacrifice)."
    ]
}

