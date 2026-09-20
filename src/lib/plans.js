// Plans d'abonnement Kolo — accès restreints selon le plan.
// Réexporte la source unique partagée avec le backend (voir shared/plans.js)
// pour que prix et limites affichés ici ne puissent jamais diverger de ce
// que le serveur applique réellement.
export { TRIAL_DAYS, PLANS, planById, getPlanLimits } from "../../shared/plans.js";
