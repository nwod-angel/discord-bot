# Bot Commands — Manual Test Reference

Every slash command with all options and example invocations.

---

## `/hello`

No options. Returns an ephemeral "Hello there!" greeting.

```
/hello
```

## `/goodbye`

No options. ⚠️ **Destructive** — removes all slash commands from the server. Dev only.

```
/goodbye
```

## `/roll` — Dice rolling

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `dice-pool` | ✅ | Integer (≥0) | Number of dice to roll |
| `name` | | String (autocomplete) | Name of the entity rolling |
| `description` | | String | Description of the roll |
| `success-threshold` | | Integer | Lowest die value counting as success (default: 8) |
| `reroll-threshold` | | Integer | Lowest die value triggering a reroll (default: 10) |
| `extended-rolls` | | Integer | If set, roll this many times (extended roll) |
| `target` | | Integer | Stop extended roll after this many successes |
| `rote` | | Boolean | Reroll failures once |
| `use-willpower` | | Boolean | Spend 1 willpower for +3 dice |

```
/roll dice-pool:5
/roll dice-pool:5 name:Magnus description:Shooting at the werewolf
/roll dice-pool:8 name:Magnus rote:true use-willpower:true
/roll dice-pool:10 extended-rolls:5 target:10
/roll dice-pool:3 success-threshold:7 reroll-threshold:9
```

## `/spell` — Spell lookup

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `name` | | String (autocomplete) | Spell name |
| `description` | | String | Search in spell descriptions |
| `arcana` | | Choice | Filter by arcana |
| `dots` | | Integer (1–5) | Primary arcana dot level |
| `practice` | | Choice | Filter by practice |

```
/spell name:Forensic Gaze
/spell arcana:Death
/spell arcana:Forces dots:3
/spell practice:Weaving
/spell description:corpse
/spell arcana:Death dots:2 practice:Knowing
```

## `/merit` — Merit lookup

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `name` | | String (autocomplete) | Merit name |
| `description` | | String | Search in merit descriptions |

```
/merit name:Ambidextrous
/merit name:Architectural Attunement
/merit description:Defense
```

## `/rule` — Rule lookup

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `name` | | String (autocomplete) | Rule name |
| `search` | | String | Search rules for an exact keyword/phrase |

```
/rule name:Willpower
/rule name:Defense
/rule search:grapple
/rule search:combat
```

## `/table` — Table lookup

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `name` | | String (autocomplete) | Table name |
| `description` | | String | Search in table descriptions |

```
/table name:Size
/table description:damage
```

## `/cast` — Spellcasting factor calculator

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `action` | | Choice: `Instant` / `Extended` | Cast as instant or extended action |
| `potency` | | Integer (≥1) | Desired potency (default: 1) |
| `targets` | | Integer (≥1) | Number of targets (default: 1) |
| `size` | | Integer (≥1) | Size of largest target (default: 5) |
| `radius` | | Integer (≥1) | Area radius in yards |
| `radius-advanced` | | Integer (≥1) | Advanced area radius in yards |
| `volume` | | Integer (≥1) | Volume in cubic yards |
| `volume-advanced` | | Integer (≥1) | Advanced volume in cubic yards |
| `duration-turns` | | Integer (≥1) | Duration in turns (transitory) |
| `duration-hours` | | Integer (≥1) | Duration in hours (prolonged) |
| `duration-days` | | Integer (≥1) | Duration in days (prolonged) |
| `duration-advanced-prolonged` | | Choice | Advanced prolonged duration |

```
/cast
/cast potency:3 targets:5
/cast action:extended potency:2 targets:10 size:5
/cast radius:10 potency:2
/cast volume:50 potency:3
/cast duration-hours:24 potency:2
/cast action:extended potency:5 targets:20 size:10 radius:20 duration-days:7
/cast duration-advanced-prolonged:Indefinite potency:4
```

## `/attack` — Combat attack roll

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `attack-type` | ✅ | Choice | Type of attack (see choices below) |
| `attacker-dice-pool` | ✅ | Integer (≥0) | Dice pool for the attack |
| `name` | | String | Attacker name |
| `target` | | String | Target name |
| `description` | | String | Attack description |
| `weapon-bonus` | | Integer (≥0) | Weapon bonus dice |
| `weapon-damage` | | Integer (≥0) | Weapon damage modifier |
| `damage-type` | | Choice | Bashing / Lethal / Aggravated (±Resistant) |
| `rote` | | Boolean | Rote action |
| `success-threshold` | | Integer | Success threshold (default: 8) |
| `reroll-threshold` | | Integer | Reroll threshold (default: 10) |
| `mod-1` … `mod-9` | | String | Extra modifiers, e.g. `-4 Darkness` or `+3 Enhanced Dexterity` |

**Attack type choices:**

| Value | Label |
|-------|-------|
| `unarmed-close-combat` | 👊 Strength + Brawl (vs Defence & Armor) |
| `armed-close-combat` | 🪓 Strength + Weaponry (vs Defence & Armor) |
| `armed-close-combat-finesse` | 🗡️ Dexterity + Weaponry (vs Defence & Armor) |
| `ranged-fired` | 🔫 Dexterity + Firearms (vs Armor only) |
| `ranged-thrown` | ⚾ Dexterity + Athletics (vs Defence & Armor) |

**Damage type choices:** Bashing, Lethal, Aggravated (each with a Resistant variant)

```
/attack attack-type:unarmed-close-combat attacker-dice-pool:7 name:Magnus target:Werewolf
/attack attack-type:ranged-fired attacker-dice-pool:9 name:Magnus target:Zombie weapon-bonus:2 weapon-damage:3 damage-type:lethal
/attack attack-type:armed-close-combat-finesse attacker-dice-pool:8 name:Magnus target:Vampire mod-1:-2 Wounded mod-2:+3 Enhanced Strength
/attack attack-type:armed-close-combat attacker-dice-pool:6 rote:true success-threshold:7
```

After the attack embed appears, interactive buttons let you add combat options (aiming, willpower, etc.) or roll directly.

## `/paradox` — Paradox roll

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `gnosis` | ✅ | Integer (1–10) | Caster's Gnosis |
| `wisdom` | | Integer (1–10) | Caster's Wisdom |
| `arcanum-dots` | | Integer (1–10) | Highest Arcanum dots of the spell |
| `path` | | Choice | Caster's Path (Acanthus, Mastigos, Moros, Obrimos, Thyrsus) |
| `name` | | String | Caster name |
| `description` | | String | Paradox roll description |
| `casts` | | Integer (≥0) | Previous vulgar spell casts (default: 0) |
| `rote` | | Boolean | Casting a rote |
| `tool` | | Boolean | Using a magical tool |
| `in-shadow` | | Boolean | Casting in Shadow (-2 dice) |
| `sleepers` | | Boolean | Sleeper witnesses (+2 dice) |
| `mitigation` | | Integer (≥0) | Mana spent to subtract dice |
| `backlash` | | Integer (≥0) | Convert paradox successes to bashing damage |
| `other-mods` | | Integer | Other dice pool modifiers |
| `other-mods-description` | | String | Description of other mods |

```
/paradox gnosis:3 wisdom:5 arcanum-dots:3 path:Acanthus name:Mercuria
/paradox gnosis:5 casts:2 sleepers:true name:Magnus
/paradox gnosis:4 wisdom:7 arcanum-dots:4 mitigation:2 tool:true
/paradox gnosis:6 in-shadow:true casts:3 backlash:2
/paradox gnosis:3 rote:true other-mods:-1 other-mods-description:Wounded
```

## `/post` — Post as character (requires API)

| Option | Required | Type | Description |
|--------|----------|------|-------------|
| `character` | ✅ | String (autocomplete) | Character ID or name |
| `content` | ✅ | String (max 2000) | Message content |
| `image_url` | | String | Override character portrait URL |

```
/post character:123 content:I look around the room carefully.
/post character:Magnus content:I cast the spell. image_url:https://example.com/portrait.png
```

---

**⚠️ Avoid in production:** `/goodbye` (removes all commands) and `/post` (requires API server running).
