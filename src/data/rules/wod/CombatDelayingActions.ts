import { RuleParagraph } from "../../RuleParagraph";

export default {
    name: "Combat: Delaying Actions",
    prefix: "Core",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "151"
        }
    ],
    paragraphs: [
        "Your character doesn’t have to act in the order of his Initiative standing in any given turn. He could refrain from acting until something happens in his environment. Maybe he waits till an opponent shows his face or wants to sprint across an open street during a lull in the shooting. In this case, your character delays his position in the Initiative roster, activating it when you choose. His Initiative rank resets to one that best reflects the time of his action.",
        new RuleParagraph({
            example: true,
            text: "Example: If Mitch’s character originally had an Initiative rank of 10, but he holds his action, the Storyteller slots him into the sequence at a rank closest to when an action is taken. If Larry’s character has an Initiative rank of 6 and Mitch acts immediately after him, the Storyteller slots Mitch in at 5. If Mitch had prepared an action and said, “My character hits Larry’s if he attacks,” then Mitch’s character goes on 7, right before Larry’s character."
        }),
        "If two or more characters delay their actions till the same moment in a turn, resolve their order as if their Initiative totals are tied.",
        "A delayed action can be held over into the next turn for a temporary benefit. The delaying character sacrifices his action in the first turn (he can do nothing except move up to his Speed) in order to act any time he chooses in the next turn. Afterward, the character’s Initiative ranking returns to normal.",
        {
            example: true,
            text: "Example: Sanders and Washington are in a fight. Sanders has an Initiative of 12 and Washington has an Initiative of 8. From turn to turn, Sanders will always act before Washington. If he wants to, however, Washington can forfeit his action in turn one. He can do nothing but move up to his Speed in that turn. In turn two, he can act at any point in the Initiative roster that he likes — say, on Initiative 13 to precede Sanders. In turn three, Washington’s Initiative ranking returns to 8. If he wants to “get the jump” on Sanders again, he has to forfeit an action again."
        },
        "A character might delay an action from one turn to the next in order to trigger an attack on a specific opponent. A gunman might wait for a target to cross a street, for example, even when the target knows the gunman awaits and there’s no element of surprise."
    ]
}