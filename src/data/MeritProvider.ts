import { Requirement, Source, MeritDefinition } from "@nwod-angel/nwod-core"
import merits from "./merits";
import { logger } from "../logger.js";


export default class MeritProvider {
    static merits: Array<MeritDefinition>

    static getMerits(name?: string, description?: string) : Array<MeritDefinition> {
        return this.merits.filter(s => 
            (name === undefined || s.name.toLowerCase().includes(name.toLowerCase())) &&
            (description === undefined || s.description.toLowerCase().includes(description.toLowerCase()))
        )
    }

    private static _initialize = (() => {
        logger.debug("Reading merits...")
        MeritProvider.merits = 
        merits.map(merit => new MeritDefinition(
                        merit.name,
                        merit.description,
                        merit.requirements.map(r => new Requirement(r, undefined)),
                        merit.levels.map(l => {
                            var level = l as {level: number, name: string, description: string}
                            return {
                                level: level.level,
                                name: level.name || '',
                                description: level.description
                            }
                        }),
                        merit.sources.map(s => new Source(s.sourceBook, parseInt(s.sourcePage))
                        ))
        )
        
        // Health Checks
        MeritProvider.merits.filter(merit => merit.description === '').forEach(merit => {
            logger.debug({ merit: merit.name, sources: merit.sourcesString() }, 'Merit has no description')
        })
        MeritProvider.merits.filter(merit => merit.requirements.filter(r => r.name === "").length > 0).forEach(merit => {
            logger.debug({ merit: merit.name, sources: merit.sourcesString() }, 'Merit has blank requirements')
        })
    })()
}