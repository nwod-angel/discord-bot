import { RuleParagraph } from "../../RuleParagraph";

export default {
    name: "Combat: Unarmed Combat: Grapple Maneuvers",
    prefix: "Core",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "157-159"
        }
    ],
    paragraphs: [
        new RuleParagraph( { prefix: "Render opponent prone", text: "Both combatants fall to the ground. Either party must break the hold in order to stand again in a subsequent turn. Rising is considered an action in a turn. (See “Going Prone,” on p. 164.) If one combatant manages to rise, close-combat attack rolls to hit the prone opponent gain a +2 bonus." }),
        { prefix: "Damage opponent", text: "Successes achieved on this turn’s Strength + Brawl roll are applied as points of bashing damage inflicted on your character’s opponent. Your character crushes, squeezes, bends or bites his victim." },
        {
            prefix: "Immobilize opponent", text: "Your character seeks to interfere with his victim’s actions. Even one success renders the target immobile. The victim’s physical actions are restricted to breaking free (he cannot attempt any overpowering maneuvers of his own), although he could bring mental or some supernatural capabilities to bear (Storyteller’s discretion). Furthermore, the victim’s Defense does not apply against attacks from opponents outside the grapple. So, if your character immobilizes a victim, attacks on him from your character’s allies are not penalized by the victim’s Defense." + "\n" +
                "Once an opponent is immobilized, he remains so from turn to turn until he breaks the hold. You do not need to make further overpower rolls from turn to turn to keep the victim immobilized. He is automatically considered immobile thereafter. Your character can do nothing except maintain the hold, however. If he dedicates an action to any other effort, the target is no longer immobile. Your character still has a grip, but a successful overpower effort is required in a subsequent turn to immobilize the opponent all over again." + "\n" +
                "Trying to break free from immobilization is handled like a contested action between grapplers. A Strength + Brawl roll is made for the victim, and it’s penalized by the holder’s Strength. Successes rolled are compared to those that were gained by the holder when he applied the immobilization maneuver. If more are gained, the hold is broken and the victim is free again. Say that Greer manages to immobilize Sloan and gets three successes in the effort. To break free in subsequent turns, rolls made for Sloan (Strength + Brawl - Greer’s Strength) must achieve four or more successes."
        },
        { prefix: "Draw weapon", text: "With one or more successes, your character reaches a weapon on his person, on his opponent or nearby. Drawing or acquiring the weapon is an entire turn’s action. The weapon has to be small, such as a knife or small gun (a pistol), in order to be brought to bear in grappling combat." },
        { prefix: "Attack with drawn weapon", text: "An attack is made with a drawn weapon. Each success achieved on your Strength + Brawl roll inflicts a point of damage. The kind of damage is appropriate to the weapon used — bashing for brass knuckles or lethal for a knife or pistol. A Weaponry or Firearms roll is not made under these circumstances, because it’s your character’s ability to overpower his opponent in grappling combat that dictates how well the weapon is used. The advantage of bringing a weapon to bear manifests in bonus dice to your Strength + Brawl roll for the attack, and in the severity of damage that might be done (say, lethal for a knife)." },
        { prefix: "Turn a drawn weapon", text: "If your character’s opponent has a weapon drawn in a grapple, your character may seek to turn the weapon on her enemy. Her action is dedicated to gaining control of the weapon and turning it, even while it’s still in her opponent’s hand. Your character’s action in a subsequent turn must be a successful attack in order to turn the weapon completely. If your character’s opponent manages to regain control of the weapon in his action, before your character’s attack is completed, no attack can be made in a subsequent turn. Thus, control of a weapon can be wrestled over from turn to turn in a grapple, with each combatant seeking to gain control and then make an attack." },
        { prefix: "Disarm opponent", text: "If you get one or more successes, your character manages to pry an object from his opponent’s hand. Taking possession of the item thereafter (in another turn) is the equivalent of drawing a weapon (see above). No damage is inflicted." },
        { prefix: "Use opponent as protection from ranged attacks", text: "see “Concealment” on p. 162." },
    ]
}