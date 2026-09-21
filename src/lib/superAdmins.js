// Statut super admin / fondateur : dérivé du JWT (calculé et signé côté
// serveur à partir de la table super_admins et de CORE_SUPER_ADMIN_EMAILS —
// voir functions/api/[[route]].js). Aucune liste d'emails ici : outre le
// risque de désynchronisation avec le serveur, publier des emails réels dans
// le bundle JS public n'est pas souhaitable.
export function isSuperAdmin(user) {
  return !!user?.is_super_admin;
}

export function isFounder(user) {
  return !!user?.is_founder;
}

// Conservé pour compatibilité avec le code existant qui appelle ce hook —
// ce n'est plus une requête réseau, juste une lecture du JWT déjà en mémoire.
export function useIsSuperAdmin(user) {
  return isSuperAdmin(user);
}
