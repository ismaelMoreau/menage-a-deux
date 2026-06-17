import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase, ref, onValue, push, update, remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig, sharedEmail } from "./firebase-config.js";

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

// ── Authentification ──────────────────────────────────────────────────────────
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  gateError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, sharedEmail, passwordInput.value);
  } catch (err) {
    gateError.textContent = "mot de passe refusé.";
    console.error(err);
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    gate.classList.add("hidden");
    appView.classList.remove("hidden");
    passwordInput.value = "";
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

function markDone(id) {
  update(ref(db, `tasks/${id}`), { lastDone: Date.now() });
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
  const elapsed = now - task.lastDone;
  if (elapsed < task.periodMs) {
    return `fait · revient dans ${humanDuration(task.periodMs - elapsed)}`;
  }
  return `à refaire (échu depuis ${humanDuration(elapsed - task.periodMs)})`;
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
      check.title = "marquer comme fait";
      check.addEventListener("click", () => markDone(id));

      const body = document.createElement("div");
      body.className = "task-body";
      const nameEl = document.createElement("div");
      nameEl.className = "task-name";
      nameEl.textContent = task.name;
      const statusEl = document.createElement("div");
      statusEl.className = "task-status";
      statusEl.textContent = statusText(task, now);
      body.append(nameEl, statusEl);

      const del = document.createElement("button");
      del.className = "task-remove";
      del.innerHTML = "&times;";
      del.title = "retirer";
      del.addEventListener("click", () => {
        if (confirm(`Retirer « ${task.name} » ?`)) removeTask(id);
      });

      li.append(check, body, del);
      taskList.appendChild(li);
    });
}

// Re-render périodique pour que les corvées « repassent » à faire toutes seules.
setInterval(() => { if (!appView.classList.contains("hidden")) render(); }, 30_000);
