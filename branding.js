const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Identité visuelle de la plateforme Kolo
export const APP_NAME = "Kolo";
// Logo officiel Kolo : « K » dégradé teal-vert avec icône de cadenas
export const LOGO_URL =
  "https://media.db.com/images/public/6aabd8ed17d08162f186fc14/04b391ded_KoloOfficial.png";