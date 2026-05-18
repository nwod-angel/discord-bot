Feature: Paradox Roll
  As a Mage: The Awakening player
  I want to roll paradox for vulgar spellcasting
  So that I can determine the consequences of breaking the Veil

  Scenario: Basic paradox roll
    Given the user issues "/paradox gnosis:3"
    When the bot calculates the paradox dice pool
    Then it uses gnosis 3 to determine the base pool (ceil(3/2) = 2 dice)
    And it rolls the paradox dice and reports the result level (No Paradox / Havoc / Bedlam / Anomaly / Branding / Manifestation)

  Scenario: Paradox with sleeper witnesses
    Given the user issues "/paradox gnosis:5 sleepers:true"
    When the bot calculates modifiers
    Then it adds +2 dice for sleeper witnesses

  Scenario: Paradox with magical tool
    Given the user issues "/paradox gnosis:5 tool:true"
    When the bot calculates modifiers
    Then it subtracts 1 die for using a magical tool

  Scenario: Paradox with rote casting
    Given the user issues "/paradox gnosis:5 rote:true"
    When the bot calculates modifiers
    Then it subtracts 1 die for casting a rote

  Scenario: Paradox in the Shadow
    Given the user issues "/paradox gnosis:5 in-shadow:true"
    When the bot calculates modifiers
    Then it subtracts 2 dice for casting in the Shadow

  Scenario: Mana mitigation
    Given the user issues "/paradox gnosis:7 mitigation:2"
    When the bot calculates modifiers
    Then it subtracts 2 dice from the pool for mana spent
    And it reports the mana expenditure

  Scenario: Paradox backlash
    Given the user issues "/paradox gnosis:5 backlash:2"
    When the bot calculates the result
    Then it subtracts 2 successes from the paradox result
    And it reports the backlash as resistant bashing damage

  Scenario: Previous vulgar casts
    Given the user issues "/paradox gnosis:5 casts:3"
    When the bot calculates modifiers
    Then it adds +3 dice for 3 previous vulgar casts

  Scenario: Custom modifiers
    Given the user issues "/paradox gnosis:5 other-mods:4 other-mods-description:Hellfire"
    When the bot calculates modifiers
    Then it adds +4 dice with the description "Hellfire"

  Scenario: Havoc result — wisdom roll
    Given the user issues "/paradox gnosis:3"
    And the paradox roll results in Havoc
    When the bot processes the result
    Then it displays the Havoc summary
    And if wisdom was provided, it rolls wisdom to determine spell effect alteration

  Scenario: Bedlam result — derangement determination
    Given the user issues "/paradox gnosis:3 arcanum-dots:2"
    And the paradox roll results in Bedlam
    When the bot processes the result
    Then it determines a mild derangement (arcanum < 3)
    And it sets the duration based on wisdom

  Scenario: Anomaly result — path-based effect
    Given the user issues "/paradox gnosis:5 arcanum-dots:4 path:Acanthus"
    And the paradox roll results in Anomaly
    When the bot processes the result
    Then it reports a Time-based anomaly with radius 80 yards

  Scenario: Branding result — arcana-based brand
    Given the user issues "/paradox gnosis:3 arcanum-dots:3"
    And the paradox roll results in Branding
    When the bot processes the result
    Then it reports a Disfigurement brand

  Scenario: Manifestation result — abyssal entity
    Given the user issues "/paradox gnosis:3 arcanum-dots:5"
    And the paradox roll results in Manifestation
    When the bot processes the result
    Then it reports a Rank 4-5 entity manifestation

  Scenario: Interactive wisdom prompt
    Given the user issues "/paradox gnosis:3" without providing wisdom
    And the result type needs wisdom
    When the bot needs wisdom
    Then it sends button prompts for the user to select their Wisdom rating
    And it waits up to 30 seconds for a response

  Scenario: Interactive arcanum dots prompt
    Given the user issues "/paradox gnosis:3" without providing arcanum-dots
    And the result type needs arcanum dots
    When the bot needs arcanum dots
    Then it sends button prompts for the user to select the highest arcanum dots
    And it waits up to 30 seconds for a response

  Scenario: Interactive path prompt
    Given the user issues "/paradox gnosis:3" without providing a path
    And the result type is Anomaly
    When the bot needs the path
    Then it sends button prompts for the user to select their path
    And it waits up to 30 seconds for a response
