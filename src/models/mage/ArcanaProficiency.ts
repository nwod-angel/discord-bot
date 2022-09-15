export enum ArcanaProficiency {
	Initiate,
	Apprentice,
	Disciple,
	Adept,
	Master
  }
  export type ArcanaProficiencyType = keyof typeof ArcanaProficiency