/* Config publique du client Supabase — projet SSB.
   L'URL et la cle "publishable" (anon) sont concues pour vivre cote client,
   la securite reelle vient des regles RLS cote Supabase, pas du secret de
   cette cle. Ne jamais mettre ici la cle service_role ni le mot de passe
   Postgres. */
(function () {
  "use strict";
  window.SSB_SUPABASE_URL = "https://lowxkzmrcdgvdlsfvdto.supabase.co";
  window.SSB_SUPABASE_ANON_KEY = "sb_publishable_PaPJkBfU3DtMUUNTGmLwOg_ytL-E6eW";
  // Cle de stockage de session utilisee par le SDK Supabase v2 :
  // sb-<ref-projet>-auth-token. account.js la lit directement pour savoir
  // s'il faut afficher "Mon espace" dans le header, sans charger les 200 ko
  // du SDK sur chaque page du site.
  window.SSB_SUPABASE_STORAGE_KEY = "sb-lowxkzmrcdgvdlsfvdto-auth-token";
})();
