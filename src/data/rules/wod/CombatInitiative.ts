import { RuleParagraph } from "../../RuleParagraph";

export default {
    name: "Combat: Initiative",
    prefix: "Core",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "151"
        }
    ],
    paragraphs: [
        "In order to determine who gets to act before whom in combat, and to resolve combatants’ actions, you use a system of Initiative. At the beginning of combat, roll a die for your character and add his Dexterity and Composure scores to the result. The total is his standing in the Initiative for the entire fight (from the first turn when the action commences till the last turn when only one side is left standing).",
        "The Storyteller rolls and records Initiative for all of the characters she controls. All of the players’ totals are intermixed in that roster, in order from highest to lowest. He with the highest has the best command of what’s going on; he acts quickly or doesn’t lose his cool. She with the lowest Initiative total struggles to keep up with events or loses precious time trying to decide what to do.",
        "If there is ever a tie between players’ characters and/or those controlled by the Storyteller, the combined Dexterity and Composure scores of the competitors are compared. He with the highest total breaks the tie. If there’s still a tie — Dexterity + Composure is equal, too — a die is rolled for each rival, the highest roll winning. If more than one character is ever tied in Initiative order, die rolls are made all round, the highest roller winning. If even die rolls tie, continue rolling until a pecking order is established.",
        new RuleParagraph({
            example: true,
            text: "Carson’s character has 3 Dexterity and 2 Composure. Carson rolls a 6 for Initiative, for a total of 11. One of the Storyteller’s thugs also gets an Initiative total of 11. Their Dexterity and Composure scores both add to 5, so no winner can be resolved there. A die is rolled for each. Both get a 3. Another die is rolled for each, this time with a 4 for Carson and an 8 for the Storyteller. The thug acts before Carson’s character throughout the combat scene."
        }),
        "The Fresh Start Merit (see p. 112) allows a character to gauge a struggle once it’s begun and change his tactics or focus. He can reposition himself in the turn-by-turn roster as a result."
    ]
}