# CODET I — Interface web (frontend)

Application React consommant l'API CODET I v1. Elle sert deux publics dans une
même base de code : les responsables du comité (gestion) et les ressortissants
(espace personnel, paiement en ligne, rapports d'AG).

## Démarrer

```bash
cp .env.example .env      # renseigner VITE_URL_API
npm install
npm run dev               # http://localhost:5173
npm run build             # bundle de production dans dist/
```

## Règle d'architecture : tout passe par un service

L'URL de base du backend est définie **une seule fois**, dans `src/config/env.js` :

```js
export const CONFIG = {
  URL_API_BASE: import.meta.env.VITE_URL_API ?? 'http://localhost:8000/api',
  VERSION_API: import.meta.env.VITE_VERSION_API ?? 'v1',
};

export const urlApi = () => `${CONFIG.URL_API_BASE}/${CONFIG.VERSION_API}`;
```

Elle alimente `src/services/httpClient.js`, unique instance Axios de
l'application. Chaque domaine métier a ensuite son service :

| Service | Rôle |
|---|---|
| `authService` | connexion, profil, déconnexion, mot de passe |
| `membreService` | membres, suspension, réactivation |
| `exerciceService` | exercices, clôture annuelle |
| `tarifService` | tarifs versionnés de la carte |
| `carteService` | cartes annuelles, impayés |
| `paiementService` | initiation mobile money, encaissement manuel, statut |
| `contributionService` | contributions, dons, donateurs |
| `reversementService` | simulation et calcul des 20 % |
| `rapportAgService` | dépôt, publication, téléchargement tracé |
| `messageService` | messages au comité et réponses |
| `statistiqueService` | tableau de bord, évolution des recettes |
| `referentielService` | référentiels et paramètres |
| `journalService` | journal des actions |
| `espaceMembreService` | espace personnel du membre |

Trois règles à tenir dans la durée :

1. **Aucun composant n'importe axios** ni n'écrit une URL. Il appelle un service.
2. **Un service par domaine**, exporté depuis `src/services/index.js`.
3. **Les erreurs sont normalisées** par `httpClient` en `{ statut, message, erreurs }` :
   les écrans n'ont qu'une seule forme à traiter, et les messages sont déjà en français.

Le contrôle est vérifiable à tout moment :

```bash
grep -rn "from 'axios'" src/ | grep -v services/httpClient.js   # doit être vide
grep -rn "http://" src/ --include=*.jsx | grep -v config/env.js  # doit être vide
```

## Parti pris de design

Charte inspirée du **Ndop**, le tissu de prestige des Grassfields bamiléké :
coton écru plongé dans une cuve d'indigo, les motifs naissant des zones réservées
par la couture. Trois couleurs, définies dans `src/styles/tokens.css` :

| Couleur | Code | Ce qu'elle est |
|---|---|---|
| Indigo profond | `#1E3462` | La cuve — actions, titres, en-têtes |
| Indigo pâli | `#6C8ABF` | Les bords délavés — montants, états d'attente |
| Écru | `#EFE9DC` | Le coton réservé — fonds, surfaces, traits |

Tout le reste descend de ces trois teintes par éclaircissement ou assombrissement,
y compris les encres (indigo désaturé, jamais du noir). **Une seule couleur sort
de la palette** : une terre cuite `#9C4A2F`, réservée aux impayés — un trésorier
doit les repérer sans lire.

Le **ruban de ventilation** se lit comme un dégradé de cuve : village en indigo
profond, groupement en indigo moyen, congrès en indigo clair, compte du comité en
écru sombre. Les segments sont séparés par une fine couture écrue, exactement le
procédé qui fait naître les motifs d'un Ndop — et qui règle au passage la
distinction de deux teintes voisines.

Tous les contrastes ont été vérifiés au seuil WCAG AA. Les chiffres — matricules,
montants, références — sont composés en chasse fixe tabulaire (`IBM Plex Mono`)
pour que les colonnes s'alignent au franc près ; les titres en
`Bricolage Grotesque`, le texte courant en `Public Sans`.

**Élément signature : le ruban de ventilation.** Chaque franc encaissé se répartit
entre le village, le groupement et le congrès. Le composant `RubanVentilation`
rend cette répartition visible partout où un montant apparaît — sur une carte,
un paiement, un tarif, le tableau de bord — et jusque sur l'écran de connexion,
en filigrane. C'est aussi la part « groupement » qui porte le reversement des 20 %.

Aucune bibliothèque d'interface n'est chargée : les composants (`Bouton`, `Carte`,
`Champ`, `Modale`, `Etiquette`, `Pagination`) et les graphiques sont écrits à la
main en CSS et SVG. Le bundle reste à ~130 ko gzip, ce qui compte pour des membres
qui consultent depuis un forfait data.

Fluidité : transitions de 160 ms, apparition en fondu montant à chaque changement
de page, squelettes de chargement plutôt qu'un écran vide, et
`prefers-reduced-motion` respecté.

## Ce qui est versionné

Le `.gitignore` écarte tout ce qui est téléchargé, reconstruit ou propre à un
poste de travail :

| Écarté | Pourquoi |
|---|---|
| `node_modules/` | Reconstitué par `npm install` depuis `package-lock.json`, lui-même versionné |
| `dist/`, `.vite/` | Régénéré par `npm run build` ; le versionner créerait un conflit à chaque construction |
| `.env`, `*.local` | Contient l'URL du backend et, plus tard, des clés — ne doit jamais partir dans le dépôt |
| `*.log`, `coverage/` | Diagnostics, propres à une exécution |
| `.vscode/`, `.idea/`, `.DS_Store` | Réglages d'éditeur et fichiers de système |

`.env.example` reste versionné : c'est lui qui documente les variables à
renseigner. `package-lock.json` aussi — il garantit des versions de dépendances
identiques pour toute l'équipe.

Le `.gitattributes` normalise les fins de ligne en LF, ce qui évite les diffs
entiers de fichiers lorsqu'une partie de l'équipe travaille sous Windows.

Pour vérifier qu'un fichier est bien écarté :

```bash
git check-ignore -v chemin/du/fichier
```

Si `node_modules` ou `.env` ont déjà été committés par erreur, les ajouter au
`.gitignore` ne suffit pas — il faut les retirer de l'index :

```bash
git rm -r --cached node_modules .env
git commit -m "Retire du suivi les fichiers générés et les secrets"
```

Côté API, le squelette Laravel fournit déjà son propre `.gitignore` (vendor,
.env, storage) : il n'y a rien à ajouter.

## Organisation

```
src/
  config/env.js            URL de base et constantes — point unique
  services/                un fichier par domaine + httpClient
  store/                   authStore (Zustand, session persistée), notifications
  hooks/                   useRequete (appel + états), useDebounce
  components/ui/           Bouton, Carte, Champ, Modale, Etiquette, Pagination, Etats
  components/donnees/      RubanVentilation, BarresAnnuelles, JaugeRecouvrement
  components/layout/       Coque, Rail, Notifications, RouteProtegee
  pages/                   écrans, groupés par domaine
  styles/                  tokens.css (jetons) + global.css
```

## Points à traiter avant la mise en production

1. **CORS et domaine Sanctum** — renseigner `SANCTUM_STATEFUL_DOMAINS` et
   `FRONTEND_URL` côté Laravel avec l'URL réelle du frontend.
2. **Rafraîchissement du paiement** — l'écran de paiement interroge le statut
   toutes les 4 secondes. Si le nombre de membres devient important, passer à un
   canal temps réel (Laravel Echo) pour alléger le serveur.
3. **Réinitialisation du mot de passe** — l'écran de connexion renvoie vers le
   secrétariat, qui réinitialise l'accès depuis la fiche du membre. Un parcours
   en autonomie suppose l'envoi de SMS, classé optionnel au cahier des charges.
