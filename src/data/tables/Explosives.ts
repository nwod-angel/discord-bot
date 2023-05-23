export default {
    name: "Explosives",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "179"
        }
    ],
    table: {
        headers:
            ["Type", "Throwing Modifier", "Blast Area", "Damage", "Size", "Cost", "Example"],
        rows: [
            ["Incendiary*", "-1", "2", "2", "1", "n/a", "Molotov Cocktail"],
            ["Concussion**", "+2", "3", "4", "1", "•••", "Concussion Grenade†"],
            ["Shredding", "+2", "3", "4", "1", "•••", "Shrapnel Grenade†"],
            ["Single Destructive", "+1", "4", "4+", "1", "•••", "Stick of Dynamite"],
            ["High Explosive***", "n/a", "20+", "6+", "1-3", "••••", "Plastique"]
        ]


    }
}