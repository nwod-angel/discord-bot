import CombatCharging from "./rules/wod/CombatCharging";
import CombatDelayingActions from "./rules/wod/CombatDelayingActions";
import CombatFlankAndRearAttacks from "./rules/wod/CombatFlankAndRearAttacks";
import CombatGoingProne from "./rules/wod/CombatGoingProne";
import CombatInitiative from "./rules/wod/CombatInitiative";
import CombatMovement from "./rules/wod/CombatMovement";
import CombatSurprise from "./rules/wod/CombatSurprise";
import CombatUnarmed from "./rules/wod/CombatUnarmed";
import CombatUnarmedGrapple from "./rules/wod/CombatUnarmedGrapple";
import Defense from "./rules/wod/Defense";
import ExperiencePointCost from "./rules/wod/ExperiencePointCost";
import Health from "./rules/wod/Health";
import Initiative from "./rules/wod/Initiative";
import PoisonsAndToxins from "./rules/wod/PoisonsAndToxins";
import Speed from "./rules/wod/Speed";

import mtawRules from "./rules/mtaw/mtaw-rules";
import SkillRules from "./rules/wod/SkillRules";

export default [
    Defense,
    ExperiencePointCost,
    Health,
    Initiative,
    PoisonsAndToxins,
    CombatDelayingActions,
    CombatInitiative,
    CombatSurprise,
    CombatUnarmed,
    CombatUnarmedGrapple,
    CombatCharging,
    CombatFlankAndRearAttacks,
    CombatGoingProne,
    CombatMovement,
    Speed,
]
.concat(mtawRules)
.concat(SkillRules)