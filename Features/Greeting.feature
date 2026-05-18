Feature: Greeting
  As a user
  I want to test that the bot is responsive
  So that I can verify it is online and working

  Scenario: Hello command
    Given the user issues "/hello"
    When the bot processes the command
    Then it responds with "Hello there!" as an ephemeral message

  Scenario: Goodbye command
    Given the user issues "/goodbye"
    When the bot processes the command
    Then it clears all guild slash commands for the server
