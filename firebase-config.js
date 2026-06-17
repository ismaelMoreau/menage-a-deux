// ─────────────────────────────────────────────────────────────────────────────
// Config Firebase — REMPLACE les valeurs ci-dessous par les tiennes.
//
// Console Firebase → ⚙ Paramètres du projet → tes applications → SDK setup.
// Ces clés sont PUBLIQUES par nature : la sécurité vient des règles Realtime DB
// (".read"/".write": "auth != null") + du compte e-mail/mot de passe partagé,
// PAS du secret de ces clés.
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  databaseURL: "https://TON_PROJET-default-rtdb.firebaseio.com",
  projectId: "TON_PROJET",
};

// E-mail du compte UNIQUE partagé entre toi et ta copine.
// Crée cet utilisateur dans Authentication → Users. Vous ne tapez que le
// mot de passe à l'écran de connexion ; cet e-mail est utilisé en coulisse.
export const sharedEmail = "menage@a-deux.local";
