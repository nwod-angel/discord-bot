export default {
    name: "Armor",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "170"
        }
    ],
    table: {
        headers:
            ["Class", "Rating", "Strength", "Defense", "Speed", "Cost"],
        rows: [
            ["Reinforced/thick clothing", "1/0", "1", "0", "0", "n/a"],
            ["Kevlar vest* (thin)", "1/2", "1", "0", "0", "•"],
            ["Flak jacket*", "2/3", "1", "-1", "0", "••"],
            ["Full riot gear*", "3/4", "2", "-2", "-1", "•••"],
            ["Leather (hard)", "1/0", "2", "-1", "0", "•"],
            ["Chainmail", "2/1", "3", "-2", "-2", "••"],
            ["Plate", "3/2", "4", "-2", "-3", "••••"]
        ]

    }
}