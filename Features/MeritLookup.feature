Feature: Merit Lookup
  As a World of Darkness player
  I want to look up merits by name or description
  So that I can find character options and their rules quickly

  Scenario: Look up a single merit by exact name
    Given the user issues "/merit name:Architectural Attunement"
    When the bot searches for merits
    Then it returns a single embed with the full merit details
    And the embed includes Requirements, Effect, level-by-level breakdown, and Sources

  Scenario: Search merits by description keyword
    Given the user issues "/merit description:Defense"
    When the bot searches for merits
    Then it returns merits whose description contains "Defense"

  Scenario: Autocomplete merit name
    Given the user types "/merit name:Arc"
    When the autocomplete handler fires
    Then it suggests up to 25 matching merit names

  Scenario: Multiple merits found
    Given the user issues "/merit name:Atavism"
    When the bot finds one exact match among multiple partial matches
    Then it shows only the exact match

  Scenario: No merits found
    Given the user issues "/merit name:NonexistentMerit"
    When the bot searches for merits
    Then it responds with an embed titled "No merits found."
