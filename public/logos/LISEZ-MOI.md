# Emblèmes de la carte unique de développement

Ces deux fichiers sont affichés sur le recto de la carte imprimable
(`src/pages/cotisations/CarteImprimable.jsx`).

| Fichier | Emplacement sur la carte |
|---|---|
| `chefferie-bangang.svg` | Angle supérieur gauche — sceau de la chefferie |
| `cosudegbang.svg` | Angle supérieur droit — emblème du comité supérieur |

## Ce sont des reconstitutions provisoires

Ils ont été redessinés d'après une photographie de la carte physique : image
floue, prise de biais, emblèmes partiellement couverts par le cachet humide.
Les formes générales et les couleurs (#C0161C rouge, #1C3F94 bleu) sont fidèles,
mais les détails — motifs sculptés du sceau, frise sous l'oiseau — relèvent de
l'interprétation.

**Avant toute impression en série, demandez les fichiers originaux** à la
chefferie et au bureau du CO.SU.DE.G.BANG. Ils existent nécessairement, puisque
les cartes physiques ont été imprimées.

## Comment les remplacer

Déposez les fichiers officiels dans ce dossier **sous les mêmes noms** :

```
public/logos/chefferie-bangang.svg
public/logos/cosudegbang.svg
```

Aucune ligne de code n'est à modifier. Deux points de vigilance :

- **Préférez le SVG.** Il reste net quelle que soit la taille d'impression.
  À défaut, un PNG à 600 dpi minimum (le sceau fait 13 mm sur la carte, soit
  environ 300 pixels de côté à cette résolution). Si vous fournissez un PNG,
  changez l'extension dans `CarteImprimable.jsx`.
- **Fond transparent ou blanc cassé** (`#FDFDF8`, la couleur du papier de la
  carte). Un fond blanc pur créerait un rectangle visible.

Après remplacement, videz le cache du navigateur ou faites `npm run build`.
