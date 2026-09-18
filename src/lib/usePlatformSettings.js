import { db } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

// Réglages plateforme (maintenance, feature flags) — lisibles par tous,
// modifiables uniquement via la fonction sécurisée superAdminAction
export function usePlatformSettings() {
  const { data } = useQuery({
    queryKey: ["platformSettings"],
    queryFn: async () => {
      const list = await db.entities.PlatformSetting.list();
      return list[0] || null;
    },
    staleTime: 30000,
    retry: false,
  });

  return { settings: data };
}