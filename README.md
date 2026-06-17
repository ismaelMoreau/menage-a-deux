# ménage à deux

Petite page de corvées partagées qui **se remettent à zéro toutes seules**. Tu coches « nourrir le chien », ça disparaît, puis ça revient à faire après le délai choisi (12 h, 1 jour…). Toi et ta copine voyez le **même état** en temps réel, derrière un seul mot de passe.

Vanilla JS + [Firebase Realtime Database](https://firebase.google.com/), hébergé sur GitHub Pages. Aucun build.

## Mise en route (≈ 5 min)

1. **Crée un projet** sur [console.firebase.google.com](https://console.firebase.google.com).
2. **Realtime Database** → *Créer une base* (commence en mode verrouillé), note l'URL `https://...firebaseio.com`.
3. **Authentication** → *Sign-in method* → active **Email/Password**.
4. **Authentication → Users** → *Add user* : crée **un seul** compte (l'e-mail = `sharedEmail` de `firebase-config.js`, p. ex. `menage@a-deux.local`, et le mot de passe = celui que vous taperez tous les deux).
5. **Realtime Database → Rules** → colle :
   ```json
   { "rules": { ".read": "auth != null", ".write": "auth != null" } }
   ```
6. **Project settings → Your apps → Web (`</>`)** : copie la config et reporte `apiKey`, `authDomain`, `databaseURL`, `projectId` dans [`firebase-config.js`](firebase-config.js).
7. `git push` → la page se met à jour automatiquement sur GitHub Pages.

## Sécurité — honnête

Les clés Firebase dans `firebase-config.js` sont **publiques par design** : c'est normal. La protection réelle vient des **règles** (`auth != null`) + du **mot de passe** du compte partagé. Personne sans le mot de passe ne peut lire ou écrire les corvées.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | écran de connexion + interface |
| `style.css` | thème dark void / accent menthe |
| `app.js` | auth, sync temps réel, logique de reset |
| `firebase-config.js` | tes clés (à remplir) |
