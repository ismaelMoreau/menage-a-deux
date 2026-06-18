# ménage à deux

Petite page de corvées partagées qui **se remettent à zéro toutes seules**. Tu coches « nourrir le chien », ça disparaît, puis ça revient à faire après le délai choisi (12 h, 1 jour…). Toi et ta copine voyez le **même état** en temps réel, chacun avec son propre compte, et la page affiche **qui** a fait quoi.

Vanilla JS + [Firebase Realtime Database](https://firebase.google.com/), hébergé sur GitHub Pages. Aucun build.

## Mise en route (≈ 5 min)

1. **Crée un projet** sur [console.firebase.google.com](https://console.firebase.google.com).
2. **Realtime Database** → *Créer une base* (commence en mode verrouillé), note l'URL `https://...firebaseio.com`.
3. **Authentication** → *Sign-in method* → active **Email/Password**.
4. **Authentication → Users** → *Add user* : crée **deux** comptes (un par personne), chacun avec son e-mail + mot de passe.
5. **Realtime Database → Rules** → colle :
   ```json
   { "rules": { ".read": "auth != null", ".write": "auth != null" } }
   ```
6. **Project settings → Your apps → Web (`</>`)** : copie la config et reporte `apiKey`, `authDomain`, `databaseURL`, `projectId` dans [`firebase-config.js`](firebase-config.js).
7. `git push` → la page se met à jour automatiquement sur GitHub Pages.

## Rappels par e-mail (corvée en retard que personne ne fait)

Chaque corvée a un délai de rappel (« rappel si pas fait après »). Un **cron local** (sur ta machine allumée 24/7) vérifie toutes les 10 min les corvées en retard au-delà de ce délai et envoie un e-mail à tout le monde — même téléphones fermés. Un seul rappel par échéance (pas de spam), réarmé dès que quelqu'un fait la corvée. **Gratuit, pas de plan Blaze ni carte.** Seul compromis : si la machine est éteinte/hors-ligne, les rappels sont en pause.

Mise en route :

1. **Clé de service Firebase** : Console → ⚙ Paramètres du projet → *Comptes de service* → *Générer une nouvelle clé privée*. Enregistre le fichier sous `cron/serviceAccount.json` (jamais commité). Fonctionne sur le plan gratuit.
2. **Mot de passe d'application Gmail** : compte Google → Sécurité → Validation en 2 étapes (activée) → *Mots de passe des applications*.
3. **Config** : `cp cron/.env.example cron/.env` puis remplis `GMAIL_USER`, `GMAIL_PASS`, `RECIPIENTS`.
4. **Dépendances** : `cd cron && npm install`.
5. **Test manuel** : `node remind.js` (doit afficher « rien à rappeler » ou envoyer un mail).
6. **Automatiser** (timer systemd utilisateur, sans sudo) :
   ```bash
   mkdir -p ~/.config/systemd/user
   cp cron/menage-remind.service cron/menage-remind.timer ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable --now menage-remind.timer
   loginctl enable-linger "$USER"   # tourne même sans session ouverte
   ```
   Alternative crontab : `*/10 * * * * cd ~/menage-a-deux/cron && /usr/bin/node remind.js >> remind.log 2>&1`

Le code est dans [`cron/remind.js`](cron/remind.js). Fréquence : `OnUnitActiveSec` dans le `.timer` (ou la ligne crontab).

## Installer sur le téléphone

C'est une **PWA** : ouvre https://ismaelmoreau.github.io/menage-a-deux/ dans le navigateur, puis
- **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil* (ou la bannière d'installation).
- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

Ça s'ouvre alors en plein écran avec son icône, comme une vraie app. Fonctionne hors-ligne pour l'affichage (les changements se synchronisent dès le retour du réseau).

## Sécurité — honnête

Les clés Firebase dans `firebase-config.js` sont **publiques par design** : c'est normal. La protection réelle vient des **règles** (`auth != null`) + des **comptes** : personne sans un identifiant valide ne peut lire ou écrire les corvées.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | écran de connexion + interface |
| `style.css` | thème dark void / accent menthe |
| `app.js` | auth, sync temps réel, logique de reset |
| `firebase-config.js` | tes clés (à remplir) |
| `cron/remind.js` | script local (cron/systemd) : rappels e-mail |
