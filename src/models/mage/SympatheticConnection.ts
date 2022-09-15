export enum SympatheticConnection {
    Sensory,
    Intimate,
    Known,
    Acquainted,
    Encountered,
    Described,
    Unknown,
}
export type SympatheticConnectionType = keyof typeof SympatheticConnection