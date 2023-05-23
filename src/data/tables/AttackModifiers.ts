export default {
    name: "Attack Modifiers",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "154"
        }
    ],
    table: {
        headers: ["Modifier", "Description"],
        rows: [
            ["Aiming", "+1 per turn to a +3 maximum"],
            ["All-Out Attack", "+2 with Brawl or Weaponry attack; lose Defense"],
            ["Armor Piercing", "Ignores amount of target’s armor equal to item’s own rating"],
            ["Autofire Long Burst", "20 or so bullets at as many targets as the shooter wants, pending Storyteller approval. A +3 bonus is applied to each attack roll; -1 per roll for each target if there’s more than one"],
            ["Autofire Medium Burst", "10 or so bullets at one to three targets, with a +2 bonus to each attack roll; -1 per roll for each target if there’s more than one"],
            ["Autofire Short Burst", "Three bullets at a single target with a +1 bonus to the roll"],
            ["Concealment", "Barely -1; partially -2; substantially -3; fully, see “Cover”"],
            ["Dodge", "Double target’s Defense"],
            ["Drawing a Weapon", "Requires one action (one turn) without a Merit, and could negate Defense"],
            ["Firing from Concealment", "Shooter’s own concealment quality (-1, -2 or -3) reduced by one as a penalty to fire back (so, no modifier, -1 or -2)"],
            ["Offhand Attack", "-2 penalty"],
            ["Prone Target", "-2 penalty to hit in ranged combat; +2 bonus to hit when attacker is within close-combat distance"],
            ["Range", "-2 at medium range, -4 at long range"],
            ["Shooting into Close Combat", "-2 per combatant avoided in a single shot (not applicable to autofire)"],
            ["Specified Target", "Torso -1, leg or arm -2, head -3, hand -4, eye -5"],
            ["Surprised or Immobilized Target", "Defense doesn’t apply"],
            ["Touching a Target", "Dexterity + Brawl or Dexterity + Weaponry; armor may or may not apply, Defense does apply"],
            ["Willpower", "Add three dice or +2 to a Resistance trait (Stamina, Resolve, Composure or Defense) in one roll or instance"]
          ]
          
    }
}