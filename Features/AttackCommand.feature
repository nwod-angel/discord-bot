Feature: Attack Roll
  As a World of Darkness player
  I want to make attack rolls with modifiers
  So that I can resolve combat encounters

  Scenario: Basic unarmed close combat attack
    Given the user issues "/attack attack-type:unarmed-close-combat attacker-dice-pool:7"
    When the bot processes the attack
    Then it sets up the embed with the attacker's pool of 7 (Strength + Brawl)
    And it waits for the user to add options or roll

  Scenario: Armed close combat attack with weapon bonus
    Given the user issues "/attack attack-type:armed-close-combat attacker-dice-pool:5 weapon-bonus:3 weapon-damage:2 damage-type:lethal"
    When the bot processes the attack
    Then it adds +3 to the dice pool for weapon bonus
    And it stores weapon damage 2 for application on success

  Scenario: Ranged attack
    Given the user issues "/attack attack-type:ranged-fired attacker-dice-pool:8 weapon-bonus:2 weapon-damage:3"
    When the bot processes the attack
    Then it uses Dexterity + Firearms as the attack pool
    And defense does not apply to ranged attacks

  Scenario: All-out attack
    Given the user clicks the "All out Attack" button
    When the option is applied
    Then it adds +2 to the dice pool
    And it marks defense as lost to the all-out attack

  Scenario: Attack with willpower
    Given the user clicks the "Attack with Willpower" button
    When the option is applied
    Then it adds +3 to the dice pool
    And it records that willpower was used

  Scenario: Defend with willpower
    Given the user clicks the "Defend with Willpower" button
    When the option is applied
    Then it applies -2 to the attacker's dice pool

  Scenario: Offhand attack
    Given the user clicks the "Offhand Attack" button
    When the option is applied
    Then it applies -2 to the dice pool

  Scenario: Custom modifier
    Given the user issues "/attack mod-1:-4 Darkness"
    When the bot processes the attack
    Then it applies -4 to the dice pool with the description "Darkness"

  Scenario: Rote attack
    Given the user issues "/attack attacker-dice-pool:6 rote:true"
    When the bot rolls the attack
    Then it re-rolls failures once

  Scenario: Custom success threshold
    Given the user issues "/attack attacker-dice-pool:6 success-threshold:7"
    When the bot rolls the attack
    Then it counts successes on dice showing 7+

  Scenario: Roll the attack
    Given the user has configured the attack options
    When the user clicks the "Roll it!" button
    Then the bot rolls the dice pool with all accumulated modifiers
    And it displays the total successes
    And it calculates total damage (successes + weapon damage)
    And it shows the damage type symbols

  Scenario: Cancel the attack
    Given the user is configuring an attack
    When the user clicks the "Cancel!" button
    Then the bot cancels the attack and removes the message after 10 seconds

  Scenario: Attack timeout
    Given the user starts an attack but does not respond
    When 60 seconds pass without interaction
    Then the bot cancels the attack and removes the message after 5 seconds
