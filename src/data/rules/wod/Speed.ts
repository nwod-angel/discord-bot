import { RuleParagraph } from "../../RuleParagraph";

export default {
    name: "Speed",
    prefix: "Core",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "95"
        }
    ],
    paragraphs: [
        {prefix: "Trait", text: "Strength + Dexterity + species factor (5 for adult humans, 3 for human children; see below for other examples)"},
        "Your character’s Speed is the number of yards she can travel in a single turn. This trait is a combination of her Strength (lean muscle mass), Dexterity (coordination and agility) and a species factor that reflects her age, physical configuration, Size and other considerations. Other species such as horses and cheetahs have physical configurations that lend themselves to high travel rates.",
        "See also table: **Species Speed**",
        "So, a being’s Strength and Dexterity are added to the above number to determine its Speed.",
        "Your character’s Speed represents the number of yards she can move in a turn and still perform an action. She can move and perform an action in a turn, or perform an action and move, but she cannot move, perform an action and move again all in the same turn.",
        "Alternatively, she can run at up to double her Speed in a turn, but can usually take no other action. See Chapter 7, p. 164, for details. Also, when your character suffers an injury modifier based on her current Health, her Speed is reduced as well.",
        new RuleParagraph({example: true, text: "Katie’s character has a Strength of 2 and a Dexterity of 2. The character is a human adult, so her Speed is 9 (2+2+5), meaning she can walk or jog nine yards or run 18 yards per turn. If the character is injured and has only three Health points remaining, she incurs a -1 modifier to dice pools and Speed, reducing the trait to 8."}),
        "If your character’s Strength or Dexterity changes through the use of experience points (or through temporary enhancement during the course of a story), her Speed changes as well. If you change your character’s Strength or Dexterity, don’t forget to adjust her Speed."
    ]
}