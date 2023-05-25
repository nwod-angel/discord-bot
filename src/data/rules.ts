import CombatDelayingActions from "./rules/CombatDelayingActions";
import CombatInitiative from "./rules/CombatInitiative";
import CombatSurprise from "./rules/CombatSurprise";
import CombatUnarmed from "./rules/CombatUnarmed";
import CombatUnarmedGrapple from "./rules/CombatUnarmedGrapple";
import Defense from "./rules/Defense";
import DrawbacksOfGnosis from "./rules/DrawbacksOfGnosis";
import EffectsOfGnosis from "./rules/EffectsOfGnosis";
import Health from "./rules/Health";
import Initiative from "./rules/Initiative";
import MageSight from "./rules/MageSight";
import PoisonsAndToxins from "./rules/PoisonsAndToxins";
import RoteSpecialties from "./rules/RoteSpecialties";
import Speed from "./rules/Speed";
import UnseenSenses from "./rules/UnseenSenses";

export default [
    Defense,
    Health,
    Initiative,
    PoisonsAndToxins,
    RoteSpecialties,
    EffectsOfGnosis,
    DrawbacksOfGnosis,
    MageSight,
    UnseenSenses,
    CombatDelayingActions,
    CombatInitiative,
    CombatSurprise,
    CombatUnarmed,
    CombatUnarmedGrapple,
    Speed
]