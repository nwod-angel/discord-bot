import ArcanaRules from "./ArcanaRules";
import BedlamDerangementAvoidanceFugue from "./BedlamDerangementAvoidanceFugue";
import BedlamDerangementDepressionMelancholia from "./BedlamDerangementDepressionMelancholia";
import BedlamDerangementFixationObsessiveCompulsion from "./BedlamDerangementFixationObsessiveCompulsion";
import BedlamDerangementInferiorityComplexAnxiety from "./BedlamDerangementInferiorityComplexAnxiety";
import BedlamDerangementIrrationalityMultiplePersonality from "./BedlamDerangementIrrationalityMultiplePersonality";
import BedlamDerangementNarcissismMegolomania from "./BedlamDerangementNarcissismMegolomania";
import BedlamDerangementPhobiaHysteria from "./BedlamDerangementPhobiaHysteria";
import BedlamDerangementSuspicionParanoia from "./BedlamDerangementSuspicionParanoia";
import BedlamDerangementVocalizationSchizophrenia from "./BedlamDerangementVocalizationSchizophrenia";
import DrawbacksOfGnosis from "./DrawbacksOfGnosis";
import EffectsOfGnosis from "./EffectsOfGnosis";
import MageExperiencePointCost from "./MageExperiencePointCost";
import MageSight from "./MageSight";
import RoteSpecialties from "./RoteSpecialties";
import ScrutinizingBeingsAndObjects from "./ScrutinizingBeingsAndObjects";
import UnseenSenses from "./UnseenSenses";
import UnvielingResonance from "./UnvielingResonance";

export default [
    // MtAw
    // Character
    MageExperiencePointCost, 

    // Spell Casting
    ScrutinizingBeingsAndObjects,
    UnvielingResonance,
    RoteSpecialties,
    EffectsOfGnosis,
    DrawbacksOfGnosis,
    MageSight,
    UnseenSenses,

    BedlamDerangementAvoidanceFugue,
    BedlamDerangementDepressionMelancholia,
    BedlamDerangementFixationObsessiveCompulsion,
    BedlamDerangementInferiorityComplexAnxiety,
    BedlamDerangementIrrationalityMultiplePersonality,
    BedlamDerangementNarcissismMegolomania,
    BedlamDerangementPhobiaHysteria,
    BedlamDerangementSuspicionParanoia,
    BedlamDerangementVocalizationSchizophrenia
    
]
.concat(ArcanaRules)