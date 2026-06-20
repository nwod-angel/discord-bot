Feature: Dice Rolling
  As a World of Darkness player
  I want to roll nWoD-style dice pools
  So that I can resolve actions in the game

  Scenario: Instant roll with basic dice pool
    Given the user issues "/roll dice-pool:5"
    When the bot processes the roll
    Then it responds with an embed showing the dice results
    And it displays the number of successes
    And it determines success, failure, exceptional success, or critical failure

  Scenario: Extended roll
    Given the user issues "/roll dice-pool:5 extended-rolls:3"
    When the bot processes the roll
    Then it rolls dice 3 times and accumulates successes
    And it responds with an embed showing the cumulative results

  Scenario: Extended roll with target
    Given the user issues "/roll dice-pool:5 extended-rolls:10 target:15"
    When the bot processes the roll
    Then it stops rolling early if 15 successes are reached before all 10 rolls

  Scenario: Roll with custom success threshold
    Given the user issues "/roll dice-pool:5 success-threshold:7"
    When the bot processes the roll
    Then it counts successes on dice showing 7 or higher instead of the default 8

  Scenario: Roll with rote action
    Given the user issues "/roll dice-pool:5 rote:true"
    When the bot processes the roll
    Then it re-rolls dice that failed on the first attempt

  Scenario: Roll with willpower
    Given the user issues "/roll dice-pool:5 use-willpower:true"
    When the bot processes the roll
    Then the dice pool is increased by 3 for spending 1 Willpower
    And the embed description notes Willpower was spent

  Scenario: Roll with custom reroll threshold
    Given the user issues "/roll dice-pool:5 reroll-threshold:9"
    When the bot processes the roll
    Then dice showing 9 or higher are rerolled (9-Again), instead of the default 10-Again

  Scenario: Named roll
    Given the user issues "/roll dice-pool:5 name:Marcus"
    When the bot processes the roll
    Then the response embed shows the name "Marcus" instead of the user's Discord name

  Scenario: Roll with description
    Given the user issues "/roll dice-pool:5 description:Sneak attack"
    When the bot processes the roll
    Then the embed title includes "Sneak attack"

  Scenario: Roll saves result to database
    Given the user issues "/roll dice-pool:4"
    When the bot saves the roll to the database
    Then a SavedRoll entity is created with the interaction data, roll description, successes, and result
