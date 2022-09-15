export enum Attribute {
    Intelligence,
    Wits,
    Resolve,
    Strength,
    Dexterity,
    Stamina,
    Presence,
    Manipulation,
    Composure,
  }
  export type AttributeType = keyof typeof Attribute