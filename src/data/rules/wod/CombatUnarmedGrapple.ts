import { RuleParagraph } from "../../RuleParagraph";

export default {
    name: "Combat: Unarmed Combat: Grapple",
    prefix: "Core",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "157-159"
        }
    ],
    paragraphs: [
        "Your character gets a hold of or tackles a target and may apply a clinch with various effects, from immobilizing the victim to crushing him. Roll Strength + Brawl to achieve a hold. The target’s Defense is subtracted from your attack pool, as normal.",
        "If the victim has yet to act in the turn, he may try and break loose at his stage of Initiative.  Alternatively, the target may try to turn the tables on his attacker and perform an overpowering grappling maneuver of his own. In either case, roll Strength + Brawl, but the attacker’s Strength is subtracted from the dice pool. Even one success breaks the hold or allows a maneuver to be performed as explained below.  If the attacker’s hold is broken, the grapple is over (although the attacker can attempt to grapple again). If the victim’s roll fails, he does not free himself or does not accomplish a maneuver. The attacker still has a grip on him.  The victim of a grapple can try to free himself or perform a maneuver in subsequent turns unless he is immobilized (see below).",
        "If in the next turn the attacker still has a hold, he can try to overpower his opponent. A Strength + Brawl roll is made. The target’s Strength rather than Defense is subtracted from the attacker’s dice pool. If no successes are gained, the attacker still has a hold, but accomplishes nothing more in the turn (he does not overpower his victim). If even one success is gained, one of the following overpowering maneuvers can be accomplished in the turn.  See **Combat: Unarmed Combat: Grapple Maneuvers**",
        "If multiple people seek to grapple a single target, and they get a hold, the target can try to break free of all holds simultaneously. Roll Strength + Brawl and subtract the highest Strength among the grapplers, with an additional penalty for each grappler after the first. So, if Anton tries to break out of a hold imposed by three opponents, and the highest Strength among them is 4, Anton’s breakout roll suffers a -6 penalty.",
        "Grappling with an opponent has its drawbacks. Grapplers lose the capacity to dodge (see “Dodge,” p. 156) and can perform only close-combat attacks. Ranged attacks are not allowed. (Wrestling over and using a small gun in a grapple is not considered a ranged attack for our purposes here.) Also see “Shooting into Close Combat,” p. 162, and “Autofire,” p. 160. The “All-Out Attack” technique (p. 157) cannot be used to attempt overpowering maneuvers or to break out of a grapple. All-out attack negates the user’s Defense in close combat, while grapplers already ignore each other’s Defense once a hold is achieved.",
        new RuleParagraph({
            example: true, text: "Drew seeks to grapple with Anderson. Drew first needs to get a grip on Anderson in his part of Initiative. Doing so requires an action and a successful Strength + Brawl roll, penalized by Anderson’s Defense. If Anderson’s order in Initiative comes later in the turn, he can try to break out with a successful Strength + Brawl roll, in this case penalized by Drew’s Strength. Or Anderson can immediately try to perform a maneuver on Drew since the two are already locked. The same roll (Strength + Brawl - Drew’s Strength) is applied and any successes rolled allow Anderson to perform a task, from doing damage to prying an object from Drew’s free hand." + "\n" +
                "If in the next turn Drew still has a hold on Anderson, a Strength + Brawl roll, penalized by Anderson’s Strength, is made to see if Drew can perform any maneuvers on Anderson." + "\n" +
                "Anderson can keep tying to break free each turn, or he can attempt maneuvers on Drew each turn. Until Anderson breaks free, the grapple continues and Drew may continue to inflict his own maneuvers."
        })
    ]
}