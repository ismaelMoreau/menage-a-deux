const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp({
  databaseURL: "https://menage-a-deux-22f1d-default-rtdb.firebaseio.com",
});

const GMAIL_USER = defineSecret("GMAIL_USER");   // ton adresse Gmail (expéditeur)
const GMAIL_PASS = defineSecret("GMAIL_PASS");   // mot de passe d'application Gmail
const RECIPIENTS = defineSecret("RECIPIENTS");   // destinataires, séparés par des virgules

exports.reminders = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "America/Toronto",
    secrets: [GMAIL_USER, GMAIL_PASS, RECIPIENTS],
  },
  async () => {
    const db = admin.database();
    const snap = await db.ref("tasks").get();
    const tasks = snap.val() || {};
    const now = Date.now();

    const due = [];
    for (const [id, t] of Object.entries(tasks)) {
      const base = t.lastDone ?? t.order ?? now;
      const dueTime = base + (t.periodMs || 0);
      const reminderTime = dueTime + (t.remindAfterMs || 0);
      const doneRecently = t.lastDone != null && now - t.lastDone < (t.periodMs || 0);
      const alreadyReminded = t.lastRemind != null && t.lastRemind >= dueTime;
      if (!doneRecently && now >= reminderTime && !alreadyReminded) {
        due.push({ id, name: t.name });
      }
    }
    if (!due.length) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER.value(), pass: GMAIL_PASS.value() },
    });
    const to = RECIPIENTS.value().split(",").map((s) => s.trim()).filter(Boolean);
    const lines = due.map((d) => `• ${d.name}`).join("\n");

    await transporter.sendMail({
      from: `ménage à deux <${GMAIL_USER.value()}>`,
      to,
      subject: `Rappel : ${due.length} corvée(s) en attente`,
      text: `Personne n'a encore fait :\n\n${lines}\n\n— ménage à deux`,
    });

    const updates = {};
    for (const d of due) updates[`tasks/${d.id}/lastRemind`] = now;
    await db.ref().update(updates);
  }
);
