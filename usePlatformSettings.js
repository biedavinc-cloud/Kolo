const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

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