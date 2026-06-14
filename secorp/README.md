# SEC Prepa — Application S.E. Corporation
**Prepa Concours | Makepe, Douala | 655 230 364**

Application web mobile-first de gestion de prepa concours.
Frontend deploye sur **Vercel**, donnees sur **Firebase Firestore** (plan gratuit).

---

## Ce qui est gratuit, ce qui est payant

| Service | Utilise | Cout |
|---|---|---|
| Firebase Firestore | Oui — toutes les donnees texte | **Gratuit** (1 Go, 50k lectures/jour) |
| Firebase Storage (fichiers) | Non — supprime | Payant depuis sept. 2024 |
| Vercel (frontend) | Oui | **Gratuit** |
| GitHub (code + justificatifs) | Oui | **Gratuit** |

Les justificatifs de caisse (photos de reçus) sont conserves directement dans le depot GitHub dans le dossier `justificatifs/`. Aucun service payant requis.

---

## Identifiants par defaut

> Modifiez ces mots de passe dans `src/lib/auth.js` avant de pousser sur GitHub.

| Role | Champ Nom | Mot de passe |
|---|---|---|
| Administrateur | `SECORP_ADMIN` | `SEC@2024!Admin` |
| Super Administrateur | *(pas de nom)* | `SUP3R#SEC0rp!2024` |

---

## Deploiement complet — GitHub + Vercel + Firebase

### ETAPE 1 — Creer le projet Firebase (5 minutes)

1. Aller sur https://console.firebase.google.com
2. Cliquer **Ajouter un projet**, donner un nom (ex : `sec-prepa`)
3. Desactiver Google Analytics, cliquer **Creer le projet**

**Activer Firestore :**
- Menu gauche : **Build > Firestore Database**
- Cliquer **Creer une base de donnees**
- Choisir **Mode production**
- Region : `europe-west1` (la plus proche du Cameroun)
- Cliquer **Activer**

**NE PAS activer Storage** — ce service est desormais payant et non necessaire.

**Recuperer la configuration Web :**
- Roue dentee en haut a gauche > **Parametres du projet**
- Descendre jusqu'a **Vos applications**, cliquer l'icone `</>` (Web)
- Donner un nom (ex : `sec-prepa-web`), cliquer **Enregistrer l'application**
- Vous verrez un bloc de code avec `apiKey`, `authDomain`, etc. Copiez ces valeurs.

---

### ETAPE 2 — Appliquer les regles Firestore (2 minutes)

- Menu gauche : **Firestore Database > Regles**
- Remplacer tout le contenu par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

- Cliquer **Publier**

> Note : Ces regles sont ouvertes pour simplifier le demarrage. Pour la production,
> il est recommande de les affiner apres que l'application fonctionne.

---

### ETAPE 3 — Creer le fichier .env en local (2 minutes)

A la racine du projet, copier le fichier `.env.example` et le renommer `.env` :

```
REACT_APP_FIREBASE_API_KEY=AIzaSyCV_0x1nlrFZOsiS6tU3BM0nqHozJD4XpM
REACT_APP_FIREBASE_AUTH_DOMAIN=se-corp-management-6a8ed.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=se-corp-management-6a8ed
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=311700663688
REACT_APP_FIREBASE_APP_ID=1:311700663688:web:65019693928654ea035e3d
```

Remplacer chaque valeur par celles copiees depuis Firebase.
Ce fichier ne sera JAMAIS pousse sur GitHub (protege par le .gitignore).

---

### ETAPE 4 — Pousser sur GitHub (5 minutes)

Si Git n'est pas installe : https://git-scm.com/downloads

Ouvrir un terminal dans le dossier du projet et taper ces commandes une par une :

```bash
git init
git add .
git commit -m "Initial commit - SEC Prepa"
```

Aller sur https://github.com/new :
- Nom du depot : `sec-prepa` (ou autre)
- Visibilite : **Private** (recommande — vos mots de passe admin sont dans le code)
- Ne pas cocher "Initialize with README"
- Cliquer **Create repository**

GitHub affiche ensuite des commandes a copier-coller. Elles ressemblent a :

```bash
git remote add origin https://github.com/VOTRE_USERNAME/sec-prepa.git
git branch -M main
git push -u origin main
```

---

### ETAPE 5 — Deployer sur Vercel (5 minutes)

1. Aller sur https://vercel.com et creer un compte (avec votre compte GitHub)
2. Cliquer **Add New Project**
3. Selectionner le depot GitHub `sec-prepa`
4. Vercel detecte automatiquement que c'est un projet React
5. **AVANT de cliquer Deploy** — ouvrir la section **Environment Variables** et ajouter les 5 variables :

```
REACT_APP_FIREBASE_API_KEY          = votre valeur
REACT_APP_FIREBASE_AUTH_DOMAIN      = votre valeur
REACT_APP_FIREBASE_PROJECT_ID       = votre valeur
REACT_APP_FIREBASE_MESSAGING_SENDER_ID = votre valeur
REACT_APP_FIREBASE_APP_ID           = votre valeur
```

6. Cliquer **Deploy**

Vercel construit et publie. Vous obtenez une URL du type `sec-prepa.vercel.app`.
Partagez cette URL avec les parents et l'administrateur.

---

### ETAPE 6 — Mises a jour futures (30 secondes)

Chaque modification du code se deploie avec 3 commandes :

```bash
git add .
git commit -m "Description de la modification"
git push
```

Vercel detecte le push automatiquement et redploie sans aucune action de votre part.

---

## Gestion des justificatifs de caisse

Les photos de reçus et justificatifs sont conserves dans GitHub, pas dans Firebase.

**Procedure :**
1. Prendre la photo du reçu avec le telephone
2. Transferer la photo sur l'ordinateur
3. La deposer dans `justificatifs/AAAA-MM-JJ/` (creer le sous-dossier si necessaire)
4. `git add . && git commit -m "Justificatif du JJ/MM/AAAA" && git push`

Les fichiers sont ainsi conserves de facon permanente et accessibles depuis GitHub.

---

## Collections Firestore (tout en texte/JSON — 100% gratuit)

| Collection | Contenu |
|---|---|
| `students/{id}` | Profil, mot de passe, concours, paiements de chaque eleve |
| `dossiers/{id}` | Demandes de dossier avec statut (en_attente / valide / rejete) |
| `cni/{id}` | Demandes CNI avec statut |
| `caisse/{AAAA-MM-JJ}` | Entrees, depenses, justification texte de chaque journee |
| `config/dossierForm` | Champs du formulaire dossier (configure par l'admin) |
| `config/cniForm` | Champs du formulaire CNI (configure par l'admin) |

---

## Structure du projet

```
secorp/
├── .env.example             → Modele (5 variables Firebase, pas de Storage)
├── .env                     → Vos vraies cles (JAMAIS sur GitHub)
├── .gitignore               → Exclut .env et node_modules
├── vercel.json              → Configuration Vercel
├── firestore.rules          → Regles Firestore
├── justificatifs/           → Reçus et photos de depenses (sur GitHub)
│   └── README.md
├── package.json
├── public/index.html
└── src/
    ├── App.js
    ├── index.js
    ├── lib/
    │   ├── firebase.js      → Firestore uniquement (pas de Storage)
    │   └── auth.js          → Logique de connexion
    ├── styles/global.css
    └── components/
        ├── auth/LoginPage
        ├── shared/TopBar
        ├── client/
        │   ├── ClientDashboard
        │   ├── ClientProfile
        │   ├── ClientFormation
        │   ├── ClientDossiers
        │   └── ClientCNI
        └── admin/
            ├── AdminDashboard
            ├── AdminStudents
            ├── AdminDossiers
            ├── AdminCNI
            ├── AdminCaisse       → Entrees/depenses/justification texte uniquement
            ├── AdminFormConfig
            └── SuperAdminLogin   → Comptabilite globale + historique complet
```

---

## Premiere utilisation apres deploiement

1. Ouvrir l'URL Vercel
2. Se connecter : nom `SECORP_ADMIN`, mot de passe `SEC@2024!Admin`
3. Onglet **Formulaires** : configurer les champs pour les dossiers et la CNI
4. Onglet **Eleves** : inscrire les premiers eleves

---

## Changer les mots de passe

Ouvrir `src/lib/auth.js` et modifier les deux constantes en haut :

```js
const ADMIN_PASSWORD = 'VotreNouveauMotDePasse';
const SUPER_ADMIN_PASSWORD = 'VotreNouveauMotDePasseSuperAdmin';
```

Puis pousser sur GitHub. Vercel redploie automatiquement.
