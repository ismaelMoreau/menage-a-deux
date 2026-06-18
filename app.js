import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase, ref, onValue, push, update, remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";
import { emailNotify } from "./notify-config.js";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((err) => console.error("SW:", err));
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const tasksRef = ref(db, "tasks");

const UNIT_MS = {
  minutes: 60_000,
  heures: 3_600_000,
  jours: 86_400_000,
};

// ── Éléments ────────────────────────────────────────────────────────────────
const gate = document.getElementById("gate");
const appView = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const gateError = document.getElementById("gateError");
const logoutBtn = document.getElementById("logoutBtn");
const addForm = document.getElementById("addForm");
const taskNameInput = document.getElementById("taskName");
const periodValueInput = document.getElementById("periodValue");
const periodUnitInput = document.getElementById("periodUnit");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

let tasks = {};
let editingId = null;

// ── Authentification ──────────────────────────────────────────────────────────
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  gateError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
  } catch (err) {
    gateError.textContent = "e-mail ou mot de passe refusé.";
    console.error(err);
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    gate.classList.add("hidden");
    appView.classList.remove("hidden");
    passwordInput.value = "";
    emailInput.value = "";
    subscribeTasks();
  } else {
    appView.classList.add("hidden");
    gate.classList.remove("hidden");
  }
});

// ── Synchronisation temps réel ───────────────────────────────────────────────
function subscribeTasks() {
  onValue(tasksRef, (snap) => {
    tasks = snap.val() || {};
    render();
  });
}

// ── Ajout / retrait / complétion ─────────────────────────────────────────────
addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = taskNameInput.value.trim();
  if (!name) return;
  const periodMs = Number(periodValueInput.value) * UNIT_MS[periodUnitInput.value];
  push(tasksRef, {
    name,
    periodMs,
    lastDone: null,
    order: Date.now(),
  });
  taskNameInput.value = "";
  periodValueInput.value = "12";
});

function currentName() {
  const u = auth.currentUser;
  return u ? (u.displayName || u.email.split("@")[0]) : "";
}

function toggleDone(id, task) {
  if (isDone(task, Date.now())) {
    update(ref(db, `tasks/${id}`), { lastDone: null, lastDoneBy: null });
  } else {
    update(ref(db, `tasks/${id}`), { lastDone: Date.now(), lastDoneBy: currentName() });
    notifyOthers(task.name);
  }
}

async function notifyOthers(taskName) {
  if (!emailNotify.enabled) return;
  const me = auth.currentUser?.email;
  const recipients = emailNotify.members.filter((m) => m.email !== me);
  if (!recipients.length) return;
  const { default: emailjs } = await import("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm");
  const when = new Date().toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" });
  for (const r of recipients) {
    emailjs
      .send(emailNotify.serviceId, emailNotify.templateId,
        { to_email: r.email, actor: currentName(), task_name: taskName, when },
        { publicKey: emailNotify.publicKey })
      .catch((err) => console.error("mail:", err));
  }
}

function setDoneTime(id, ts) {
  update(ref(db, `tasks/${id}`), { lastDone: ts, lastDoneBy: currentName() });
}

function toLocalInput(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function removeTask(id) {
  remove(ref(db, `tasks/${id}`));
}

// ── Logique de reset & rendu ─────────────────────────────────────────────────
function isDone(task, now) {
  return task.lastDone != null && now - task.lastDone < task.periodMs;
}

function humanDuration(ms) {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} j`;
}

function statusText(task, now) {
  if (task.lastDone == null) return "jamais fait — à faire";
  const by = task.lastDoneBy ? ` par ${task.lastDoneBy}` : "";
  const elapsed = now - task.lastDone;
  if (elapsed < task.periodMs) {
    return `fait${by} · revient dans ${humanDuration(task.periodMs - elapsed)}`;
  }
  return `à refaire (fait${by} il y a ${humanDuration(elapsed)})`;
}

function render() {
  const now = Date.now();
  const entries = Object.entries(tasks);
  taskList.innerHTML = "";
  emptyState.classList.toggle("hidden", entries.length > 0);

  entries
    .map(([id, task]) => ({ id, task, done: isDone(task, now) }))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;       // à faire d'abord
      return (a.task.order || 0) - (b.task.order || 0);
    })
    .forEach(({ id, task, done }) => {
      const li = document.createElement("li");
      li.className = "task" + (done ? " done" : task.lastDone != null ? " due" : "");

      const check = document.createElement("button");
      check.className = "task-check";
      check.textContent = done ? "✓" : "○";
      check.title = done ? "annuler (pas fait)" : "marquer comme fait";
      check.addEventListener("click", () => toggleDone(id, task));

      const body = document.createElement("div");
      body.className = "task-body";
      const nameEl = document.createElement("div");
      nameEl.className = "task-name";
      nameEl.textContent = task.name;
      const periodEl = document.createElement("span");
      periodEl.className = "task-period";
      periodEl.textContent = `↻ ${humanDuration(task.periodMs)}`;
      nameEl.appendChild(periodEl);
      body.appendChild(nameEl);

      if (editingId === id) {
        const editRow = document.createElement("div");
        editRow.className = "task-edit";
        const timeInput = document.createElement("input");
        timeInput.type = "datetime-local";
        timeInput.className = "field";
        timeInput.value = toLocalInput(task.lastDone ?? now);
        const save = document.createElement("button");
        save.className = "btn-primary btn-sm";
        save.textContent = "ok";
        save.addEventListener("click", () => {
          if (timeInput.value) setDoneTime(id, new Date(timeInput.value).getTime());
          editingId = null;
          render();
        });
        const cancel = document.createElement("button");
        cancel.className = "btn-ghost btn-sm";
        cancel.textContent = "annuler";
        cancel.addEventListener("click", () => { editingId = null; render(); });
        editRow.append(timeInput, save, cancel);
        body.appendChild(editRow);
      } else {
        const statusEl = document.createElement("div");
        statusEl.className = "task-status";
        statusEl.textContent = statusText(task, now);
        body.appendChild(statusEl);
      }

      const edit = document.createElement("button");
      edit.className = "task-icon";
      edit.innerHTML = "&#9998;";
      edit.title = "corriger l'heure";
      edit.addEventListener("click", () => {
        editingId = editingId === id ? null : id;
        render();
      });

      const del = document.createElement("button");
      del.className = "task-icon task-remove";
      del.innerHTML = "&times;";
      del.title = "retirer";
      del.addEventListener("click", () => {
        if (confirm(`Retirer « ${task.name} » ?`)) removeTask(id);
      });

      li.append(check, body, edit, del);
      taskList.appendChild(li);
    });
}

// Re-render périodique pour que les corvées « repassent » à faire toutes seules.
setInterval(() => {
  if (!appView.classList.contains("hidden") && editingId === null) render();
}, 30_000);
