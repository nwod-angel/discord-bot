Feature: Spellcasting Assistant
  As a Mage: The Awakening player
  I want to calculate spell factor modifiers for casting spells
  So that I know the dice pool modifier or extended target number

  Scenario: Instant spell with increased potency
    Given the user issues "/cast action:instant potency:3"
    When the bot calculates modifiers
    Then it applies a -4 modifier for potency 3 (2 per step above 1)

  Scenario: Instant spell with multiple targets
    Given the user issues "/cast action:instant targets:4"
    When the bot calculates modifiers
    Then it applies a -4 modifier for 4 targets (log2(4) * -2)

  Scenario: Instant spell with increased size
    Given the user issues "/cast action:instant size:10"
    When the bot calculates modifiers
    Then it applies a -2 modifier for size 10 (log2(10/5) * -2)

  Scenario: Instant spell with radius
    Given the user issues "/cast action:instant radius:10"
    When the bot calculates modifiers
    Then it applies a -6 modifier for 10-yard radius (log2(10) * -2)

  Scenario: Instant spell with advanced radius
    Given the user issues "/cast action:instant radius-advanced:20"
    When the bot calculates modifiers
    Then it applies the advanced radius modifier (ceil(log4(20)) * -2)

  Scenario: Instant spell with transitory duration (turns)
    Given the user issues "/cast action:instant duration-turns:5"
    When the bot calculates modifiers
    Then it applies a -6 modifier for 5 turns

  Scenario: Instant spell with prolonged duration (hours)
    Given the user issues "/cast action:instant duration-hours:12"
    When the bot calculates modifiers
    Then it applies a -4 modifier for 12 hours

  Scenario: Instant spell with prolonged duration (days)
    Given the user issues "/cast action:instant duration-days:2"
    When the bot calculates modifiers
    Then it applies a -8 modifier for 2 days

  Scenario: Instant spell with advanced prolonged duration
    Given the user issues "/cast action:instant duration-advanced-prolonged:week"
    When the bot calculates modifiers
    Then it applies a -6 modifier for one week advanced prolonged

  Scenario: Extended spell with increased potency
    Given the user issues "/cast action:extended potency:3"
    When the bot calculates the target number
    Then it adds +2 to the target for potency 3

  Scenario: Extended spell with size
    Given the user issues "/cast action:extended size:20"
    When the bot calculates modifiers
    Then it adds +2 to the target for size 20

  Scenario: Extended spell with indefinite duration
    Given the user issues "/cast action:extended duration-advanced-prolonged:indefinite"
    When the bot calculates modifiers
    Then it adds +5 to the target for indefinite duration

  Scenario: Combined instant spell modifiers
    Given the user issues "/cast action:instant potency:2 targets:3 size:8"
    When the bot calculates modifiers
    Then it shows each modifier separately
    And it displays the total modifier sum
