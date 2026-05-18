Feature: Table Lookup
  As a World of Darkness player
  I want to look up game tables (weapons, armor, vehicles, etc.)
  So that I can reference game data quickly during play

  Scenario: Look up a single table by exact name
    Given the user issues "/table name:Armor"
    When the bot searches for tables
    Then it returns the table rendered as an ASCII table in a code block
    And it includes the table name and source references

  Scenario: Autocomplete table name
    Given the user types "/table name:Me"
    When the autocomplete handler fires
    Then it suggests up to 25 matching table names

  Scenario: No tables found
    Given the user issues "/table name:NonexistentTable"
    When the bot searches for tables
    Then it responds with "No tables found."

  Scenario: Multiple tables found
    Given the user issues "/table name:Weapon"
    When the bot finds multiple matching tables
    Then it responds with "Multiple tables found"
