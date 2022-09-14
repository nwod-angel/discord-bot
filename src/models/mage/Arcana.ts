export enum Arcana {
  Death,
  Fate,
  Forces,
  Life,
  Matter,
  Mind,
  Prime,
  Space,
  Spirit,
  Time,
}
export type ArcanaType = keyof typeof Arcana;