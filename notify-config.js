// ─────────────────────────────────────────────────────────────────────────────
// Notifications par e-mail via EmailJS (https://www.emailjs.com) — SANS serveur,
// sans plan Blaze, sans carte. Quand l'un de vous coche une corvée, son
// navigateur envoie un e-mail à l'autre.
//
// Mise en route (≈ 5 min) :
//   1. Crée un compte sur emailjs.com (gratuit).
//   2. Email Services → Add → connecte ta boîte (Gmail, etc.) → note le Service ID.
//   3. Email Templates → Create → utilise les variables {{actor}}, {{task_name}},
//      {{when}} dans le corps, et mets {{to_email}} dans le champ "To". Note le Template ID.
//   4. Account → API Keys → copie la Public Key.
//   5. Reporte les 3 ci-dessous, liste les e-mails des membres, et passe enabled à true.
// ─────────────────────────────────────────────────────────────────────────────

export const emailNotify = {
  enabled: false,
  publicKey: "TA_PUBLIC_KEY",
  serviceId: "TON_SERVICE_ID",
  templateId: "TON_TEMPLATE_ID",
  // On notifie tous les membres SAUF l'auteur de l'action.
  // L'e-mail doit correspondre exactement à celui du compte Firebase.
  members: [
    { email: "toi@exemple.com" },
    { email: "elle@exemple.com" },
  ],
};
