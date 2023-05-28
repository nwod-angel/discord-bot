export default {
    name: "Effects of Gnosis",
    sources: [
        {
            sourceBook: "Mage: the Awakening",
            sourcePage: "76"
        }
    ],
    table: {
        headers: ["Gnosis", "Trait Max", "Mana (max/turn)", "Aura", "Paradox Base", "Casting time"],
        rows: [
            ["1", "5", "10/1", "", "1 die", "3 hours"],
            ["2", "5", "11/2", "", "1 die", "3 hours"],
            ["3", "5", "12/3", "", "2 dice", "1 hour"],
            ["4", "5", "13/4", "", "2 dice", "1 hour"],
            ["5", "5", "14/5", "", "3 dice", "30 minutes"],
            ["6", "6", "15/6", "+1", "3 dice", "30 minutes"],
            ["7", "7", "20/7", "+2", "4 dice", "10 minutes"],
            ["8", "8", "30/8", "+3", "4 dice", "10 minutes"],
            ["9", "9", "50/10", "+4", "5 dice", "1 minute"],
            ["10", "10", "100/15", "+5", "5 dice", "1 minute"]
          ]
    },
    seeAlso: [
      { type: "rule", name: "Effects of Gnosis" }
    ]
}