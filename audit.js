const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


// Journal d'activité du foyer : trace les actions des membres (créations,
// modifications, suppressions) pour l'historique consultable sur /audit-log.
// Appel « fire-and-forget » : une erreur de journalisation ne bloque jamais
// l'action de l'utilisateur.
export function logHouseholdAction(user, action, target = "", details = "") {
  const hid = user?.data?.household_id || user?.household_id;
  if (!hid) return;
  db.entities.HouseholdAuditLog.create({
    household_id: hid,
    action,
    actor: user?.data?.display_name || user?.full_name || user?.email || "Membre",
    target,
    details,
  }).catch(() => {});
}