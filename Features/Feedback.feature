Feature: User Feedback
  As a bot developer
  I want to collect user satisfaction feedback on command results
  So that I can improve the bot experience

  Scenario: Happy feedback
    Given the user receives a command result with a feedback prompt
    When the user clicks the 🙂 button
    Then the bot logs a happy feedback message to the feedback channel

  Scenario: Unhappy feedback
    Given the user receives a command result with a feedback prompt
    When the user clicks the 😦 button
    Then the bot logs an unhappy feedback message to the feedback channel
