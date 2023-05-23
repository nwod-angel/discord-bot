import { RuleParagraph } from "../RuleParagraph";

export default {
    name: "Initiative",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "91"
        }
    ],
    paragraphs: [
        new RuleParagraph({prefix: "Trait", text: "Dexterity + Composure"}),
        "Your character’s Initiative trait reflects her reaction time and ability to think on her feet in a crisis, be it a barroom brawl, a shootout or a desperate lunge to stop a child from wandering into a busy street. When the Storyteller calls for an Initiative roll, you roll one die and add the result to your character’s Initiative trait. The total determines the order in which your character interacts with all other participants of the scene. Once you roll your character’s Initiative the number does not usually change through the course of the scene. She always acts after characters with a higher total, and before those with a lower total. Possible exceptions are applied through use of the Fresh Start Merit (see Chapter 5, p. 112) or by delaying your character’s action (see p. 151). In the event of a tie between two characters, she with the highest Initiative trait goes first. If both Initiative traits are the same, roll a die for each with the highest roll going first.",
        new RuleParagraph({example: true, text: "Diane’s character has a Dexterity of 3 and a Composure of 2. Adding the two produces an Initiative trait of 5. During play, Diane’s character is approached by a mugger and a fight breaks out. Diane rolls a die and adds the result to her character’s Initiative trait. The roll is 7, so her character’s Initiative total is 12. The Storyteller rolls a die for the mugger and gets a 4. The mugger’s Initiative trait is 4. Adding the two together produces an Initiative total of 8. Diane’s character gets the first action, and continues to do so in subsequent turns until the fight is over."}),
        "For more information on Initiative and how it applies to combat, see Chapter 7, p. 151.",
        "As your character’s Attributes change through the use of experience points (or through temporary enhancement during the course of a story), her Initiative changes as well. If your character’s Dexterity or Composure increases during play, don’t forget to adjust her Initiative as well."
    ]
}