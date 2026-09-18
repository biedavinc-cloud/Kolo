import { db } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

// Super administrateurs fondateurs : protégés, jamais retirables
export const SUPER_ADMIN_EMAILS = [
  "vincentnogue2@gmail.com",
  "vincentnogue@yahoo.com",
];

export function isSuperAdmin(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(email);
}

// Super administrateurs dynamiques (module Super Admin) + fondateurs
export function useIsSuperAdmin(user) {
  const email = (user?.email || "").toLowerCase().trim();
  const { data: supers = [] } = useQuery({
    queryKey: ["superAdmins"],
    queryFn: () => db.entities.SuperAdmin.list(),
    staleTime: 60000,
    retry: false,
  });
  if (!user) return false;
  return (
    SUPER_ADMIN_EMAILS.includes(email) ||
    supers.some((s) => (s.email || "").toLowerCase().trim() === email)
  );
}