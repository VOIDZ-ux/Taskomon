# Taskomon — Setup Guide

## Prerequisiti

### Node.js (richiede versione >= 18)

```bash
# Installa Node.js su Fedora Linux
sudo dnf install nodejs npm

# Verifica le versioni
node --version   # deve mostrare v18.x o superiore
npm --version
```

---

## 1. Installa le dipendenze

```bash
cd taskomon
npm install
```

---

## 2. Configura Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com/)
2. Crea un nuovo progetto (es. "taskomon-prod")
3. Abilita **Authentication**:
   - Menu laterale → Authentication → Get started
   - Scheda "Sign-in method" → Google → Abilita → Salva
4. Crea **Firestore Database**:
   - Menu laterale → Firestore Database → Create database
   - Scegli "Start in test mode" → Next → Done
5. Ottieni la **configurazione web**:
   - Impostazioni progetto (icona ⚙️) → "Your apps" → `</>` (Web)
   - Registra l'app → copia l'oggetto `firebaseConfig`
6. Apri il file `src/firebase.js` e sostituisci tutti i `"INSERISCI_QUI"` con i valori reali:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "taskomon-prod.firebaseapp.com",
  projectId: "taskomon-prod",
  storageBucket: "taskomon-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

---

## 3. Avvia in browser

```bash
npm run dev
```

Apri [http://localhost:5173](http://localhost:5173)

L'app si avvia con dati demo. Per partire pulito, vai in Settings → Reset all progress.

---

## 4. Build di produzione

```bash
npm run build
```

I file compilati vengono messi nella cartella `dist/`.

---

## 5. Build per Android (richiede Android Studio)

### Prima installazione

```bash
# Aggiungi la piattaforma Android (solo la prima volta)
npx cap add android
```

### Ogni volta che aggiorni il codice

```bash
npm run cap:android
# oppure, passo per passo:
npm run build
npx cap sync android
npx cap open android
# In Android Studio: Run → Run 'app'
```

> **Nota:** Assicurati di avere Android Studio installato e l'SDK Android configurato.
> Scarica da: [developer.android.com/studio](https://developer.android.com/studio)

---

## 6. Build per iOS (richiede Mac + Xcode)

### Prima installazione

```bash
npx cap add ios
```

### Ogni volta che aggiorni il codice

```bash
npm run cap:ios
# oppure, passo per passo:
npm run build
npx cap sync ios
npx cap open ios
# In Xcode: Product → Run (⌘R)
```

> **Nota:** Richiede macOS con Xcode 15+ installato.

---

## Struttura del progetto

```
taskomon/
├── src/
│   ├── App.jsx                  ← root component
│   ├── firebase.js              ← config Firebase (da compilare)
│   ├── components/
│   │   ├── MainScreen.jsx       ← schermata principale
│   │   ├── SettingsScreen.jsx   ← impostazioni
│   │   ├── ProfileScreen.jsx    ← profilo e backup
│   │   ├── CreatureView.jsx     ← pet pixel-art
│   │   ├── HabitRow.jsx         ← riga habit
│   │   ├── TaskRow.jsx          ← riga task
│   │   ├── PantryRow.jsx        ← riga pantry
│   │   ├── Chart.jsx            ← grafico calendario
│   │   ├── TaskSheet.jsx        ← sheet aggiungi/modifica
│   │   ├── Icons.jsx            ← tutti gli SVG icon
│   │   ├── DeleteDialog.jsx     ← dialog elimina
│   │   └── ConfirmDialog.jsx    ← dialog conferma
│   ├── hooks/
│   │   ├── useAppState.js       ← stato app + localStorage
│   │   ├── useFirebaseSync.js   ← sync Firestore
│   │   └── usePetHealth.js      ← salute del Mon
│   ├── utils/
│   │   ├── dateHelpers.js       ← date utilities
│   │   ├── colorHelpers.js      ← color utilities
│   │   └── backupHelpers.js     ← export/import JSON
│   └── styles/
│       └── global.css           ← tutti i CSS
└── public/
    └── TaskomonLogo.png
```

---

## Dev tools (`?dev=1`)

```
http://localhost:5173?dev=1
```

Adding `?dev=1` to the URL reveals a **DEV TOOLS** section at the bottom of Settings. It never appears in production without the param.

### Button: Simulate week complete

Sets the weekly numerator and denominator so the completion rate equals the threshold, then sets `lastWeeklyRollover` to 7 days ago. The next automatic rollover check (within 60 seconds) evaluates the rate and fires the hatch animation if the pet is still an egg.

### Button: Force hatch now

Immediately triggers the hatch animation. Useful to skip the 60-second wait and test the visual transition directly.

To confirm hatch fired, open DevTools → Console and look for:
```
[HATCH] creature state set to hatched
```

---

## Testing the sleep/wake flow (`?debug=sleep`)

```
http://localhost:5173?debug=sleep
```

Clears localStorage and writes a state where the pet is already **hatched** but last activity was 4 hours ago. The inactivity check fires immediately on load and the pet starts **sleepy**.

Complete **"Complete me to wake the pet! 🌟"** to test the wake-from-sleep flow.

To confirm debug mode fired, open DevTools → Console and look for:
```
[DEBUG] initSleepDebug() fired
```

### Alternative — only fires on empty state

```
http://localhost:5173?debug=1
```

Runs `initSleepDebug()` only if localStorage is empty. If data already exists it does nothing.

---

## Pet states

| State     | Trigger                                         | Persisted? |
|-----------|-------------------------------------------------|------------|
| `egg`     | Default                                         | Yes        |
| `hatched` | Weekly rate ≥ threshold at weekly rollover      | Yes        |
| `sleepy`  | No completion for 3+ hours while hatched        | No (transient) |

- Completing any task or habit while sleepy → immediately wakes to `hatched`
- Unchecking the last completion of the day while hatched → returns to `sleepy`

---

## Note

- L'app funziona **offline-first**: tutti i dati sono salvati in `localStorage`.
- Il sync con Firestore avviene automaticamente ogni 2 secondi dopo una modifica (solo se loggati).
- Il backup JSON può essere esportato e importato in qualsiasi momento, anche senza account.
- Per testare su dispositivo Android fisico senza Android Studio, usa `npx cap run android`.
