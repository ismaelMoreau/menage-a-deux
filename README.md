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

Chaque corvée a un délai de rappel (« rappel si pas fait après »). Une **Cloud Function planifiée** vérifie toutes les 30 min les corvées en retard au-delà de ce délai et envoie un e-mail à tout le monde — même téléphones fermés. Un seul rappel par échéance (pas de spam), réarmé dès que quelqu'un fait la corvée.

Mise en route (nécessite le plan **Blaze** — carte requise, coût ≈ 0 $ avec le quota gratuit) :

1. Console Firebase → **Upgrade** le projet vers le plan **Blaze**.
2. Crée un **mot de passe d'application Gmail** : compte Google → Sécurité → Validation en 2 étapes (activée) → *Mots de passe des applications*.
3. Installe le CLI et connecte-toi :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. Depuis la racine du repo, enregistre les 3 secrets :
   ```bash
   firebase functions:secrets:set GMAIL_USER   # ton adresse Gmail
   firebase functions:secrets:set GMAIL_PASS   # le mot de passe d'application
   firebase functions:secrets:set RECIPIENTS   # "toi@x.com,elle@y.com"
   ```
5. Déploie :
   ```bash
   firebase deploy --only functions
   ```

Le code de la fonction est dans [`functions/index.js`](functions/index.js). Pour changer la fréquence, édite `schedule` puis redéploie.

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
| `functions/index.js` | Cloud Function planifiée : rappels e-mail |
