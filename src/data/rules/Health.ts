import { RuleParagraph } from "../RuleParagraph";

export default {
    name: "Health",
    prefix: "Core",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "90-91"
        }
    ],
    paragraphs: [
        new RuleParagraph({prefix: "Traits", text: "Stamina + Size"}),
        "A character’s Health trait reflects his body’s capacity to cope with injury and remain functional. As your character suffers damage, whether accidentally or in combat (see Chapter 7 for details), each point of damage inflicted lowers his Health by one. When your character’s Health points are reduced to three, he suffers a negative modifier to his dice pools. As his Health points continue to decrease, this negative modifier increases as he is slowly overcome by shock and physical trauma. When all of your character’s Health points are marked off as aggravated damage, he is dead. See Chapter 7, p. 152, for more details on types of damage and how they affect a character’s Health.  Obviously, the larger and more robust a character is, the more damage he can withstand before dying.",
        "Health is marked on your character sheet and has both a permanent and a temporary rating. Your character’s permanent rating is filled in on the dots of your character sheet. His temporary points are recorded in the corresponding boxes. Every time your character loses a Health point to damage, mark off the kind of injury inflicted from left to right. When dots and filled boxes are equal, your character is badly hurt or dying.",
        "Your character regains lost Health points at different rates based on the type of damage inflicted. See Chapter 7, p. 175 for details on recovering Health and healing times for bashing, lethal and aggravated harm. When points are recovered, the Health boxes on your character sheet are emptied from right to left.",
        "As your character’s Stamina increases through the use of experience points (or through temporary supernatural enhancements), his Health increases as well. Don’t forget to adjust your character’s Health dots when his Stamina changes."
    ]
}