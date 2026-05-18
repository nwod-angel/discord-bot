Feature: Spell Lookup
  As a Mage: The Awakening player
  I want to look up spells by name, arcana, practice, or description
  So that I can quickly reference spell rules during play

  Scenario: Look up a single spell by exact name
    Given the user issues "/spell name:Forensic Gaze"
    When the bot searches for the spell
    Then it returns a single embed with the full spell details
    And the embed includes Requirements, Practice, Action, Duration, Aspect, Cost, Effect, and Sources

  Scenario: Look up spells by arcana
    Given the user issues "/spell arcana:Death"
    When the bot searches for spells
    Then it returns a list of all Death Arcana spells grouped by dot level

  Scenario: Look up spells by practice
    Given the user issues "/spell practice:Knowing"
    When the bot searches for spells
    Then it returns a list of all Knowing practice spells

  Scenario: Filter spells by arcana and dots
    Given the user issues "/spell arcana:Death dots:2"
    When the bot searches for spells
    Then it returns only Death 2 spells

  Scenario: Autocomplete spell name
    Given the user types "/spell name:For"
    When the autocomplete handler fires
    Then it suggests up to 25 matching spell names with arcana and dot level shown

  Scenario: Search spells by description keyword
    Given the user issues "/spell description:corpse"
    When the bot searches for spells
    Then it returns spells whose description contains "corpse"

  Scenario: No spells found
    Given the user issues "/spell name:NonexistentSpell"
    When the bot searches for spells
    Then it responds with "No spells found."

  Scenario: Multiple spells found — grouped by arcana
    Given the user issues "/spell arcana:Death"
    When the bot finds more than one spell
    Then it groups spells by their primary arcana and displays them in a list
