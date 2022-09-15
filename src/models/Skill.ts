export enum Skill {
  Academics,
  Computer,
  Crafts,
  Investigation,
  Medicine,
  Occult,
  Politics,
  Science,

  Athletics,
  Brawl,
  Drive,
  Firearms,
  Larceny,
  Stealth,
  Survival,
  Weaponry,
  
  AnimalKen,
  Empathy,
  Expression,
  Intimidation,
  Persuasion,
  Socialize,
  Streetwise,
  Subterfuge,
}
export type SkillType = keyof typeof Skill
