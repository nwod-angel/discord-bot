Feature: Rule Lookup
  As a World of Darkness player
  I want to look up game rules by name or keyword
  So that I can check rules without leaving Discord

  Scenario: Look up a single rule by exact name
    Given the user issues "/rule name:Defense"
    When the bot searches for rules
    Then it returns a single embed with the full rule text broken into paragraphs
    And it includes any examples and source references

  Scenario: Search rules by keyword
    Given the user issues "/rule search:grapple"
    When the bot searches for rules
    Then it returns rules whose content contains "grapple"

  Scenario: Autocomplete rule name
    Given the user types "/rule name:Com"
    When the autocomplete handler fires
    Then it suggests up to 25 matching rule names

  Scenario: No rules found
    Given the user issues "/rule name:NonexistentRule"
    When the bot searches for rules
    Then it responds with "No rules found."

  Scenario: Multiple rules found
    Given the user issues "/rule search:combat"
    When the bot finds multiple matching rules
    Then it shows a summary list of up to 25 rule titles
