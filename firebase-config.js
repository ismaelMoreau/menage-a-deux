// ─────────────────────────────────────────────────────────────────────────────
// Config Firebase — REMPLACE les valeurs ci-dessous par les tiennes.
//
// Console Firebase → ⚙ Paramètres du projet → tes applications → SDK setup.
// Ces clés sont PUBLIQUES par nature : la sécurité vient des règles Realtime DB
// (".read"/".write": "auth != null") + des comptes e-mail/mot de passe,
// PAS du secret de ces clés.
//
// Crée DEUX utilisateurs dans Authentication → Users (un par personne).
// Chacun se connecte avec son propre e-mail + mot de passe.
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  databaseURL: "https://TON_PROJET-default-rtdb.firebaseio.com",
  projectId: "TON_PROJET",
};
