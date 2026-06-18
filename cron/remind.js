const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("dotenv").config();

const serviceAccount = require(process.env.SERVICE_ACCOUNT || "./serviceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

async function main() {
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

  if (!due.length) {
    console.log(`${new Date().toISOString()} rien à rappeler`);
    await admin.app().delete();
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  const to = process.env.RECIPIENTS.split(",").map((s) => s.trim()).filter(Boolean);
  const lines = due.map((d) => `• ${d.name}`).join("\n");

  await transporter.sendMail({
    from: `ménage à deux <${process.env.GMAIL_USER}>`,
    to,
    subject: `Rappel : ${due.length} corvée(s) en attente`,
    text: `Personne n'a encore fait :\n\n${lines}\n\n— ménage à deux`,
  });

  const updates = {};
  for (const d of due) updates[`tasks/${d.id}/lastRemind`] = now;
  await db.ref().update(updates);

  console.log(`${new Date().toISOString()} rappel envoyé: ${due.length} corvée(s)`);
  await admin.app().delete();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
