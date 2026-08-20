import { useMemo, useState } from 'react';
import { carteService, membreService, referentielService, typeCarteService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useDebounce } from '@/hooks/useDebounce';
import { notifier } from '@/store/notificationStore';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Modale from '@/components/ui/Modale';
import { Chargement, Vide } from '@/components/ui/Etats';
import RapportLot from '@/components/donnees/RapportLot';

/**
 * Émission de cartes pour plusieurs membres.
 *
 * On ne présélectionne jamais : le secrétariat choisit explicitement qui
 * reçoit une carte. Les filtres servent à réduire la liste, la case d'en-tête
 * à retenir tous les membres affichés.
 */
export default function EmissionLot({ exercices, surFermeture, surEmission }) {
  const [exerciceId, setExerciceId] = useState(
    () => exercices.find((e) => e.statut === 'ouvert')?.id ?? '',
  );
  const [typeCarteId, setTypeCarteId] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState([]);
  const [enCours, setEnCours] = useState(false);
  const [rapport, setRapport] = useState(null);

  const rechercheRetardee = useDebounce(recherche);

  const types = useRequete(() => typeCarteService.lister({ actifs_seulement: true }), []);
  const referentiels = useRequete(() => referentielService.tout(), []);

  const filtres = useMemo(
    () => ({
      statut: 'actif',
      recherche: rechercheRetardee || undefined,
      categorie_id: categorieId || undefined,
      par_page: 100,
    }),
    [rechercheRetardee, categorieId],
  );

  const membres = useRequete(() => membreService.lister(filtres), [filtres]);
  const liste = membres.donnees?.data ?? [];

  const basculer = (id) =>
    setSelection((etat) => (etat.includes(id) ? etat.filter((x) => x !== id) : [...etat, id]));

  const tousAffichesRetenus = liste.length > 0 && liste.every((m) => selection.includes(m.id));

  const basculerTous = () =>
    setSelection((etat) =>
      tousAffichesRetenus
        ? etat.filter((id) => !liste.some((m) => m.id === id))
        : [...new Set([...etat, ...liste.map((m) => m.id)])],
    );

  const emettre = async () => {
    setEnCours(true);
    try {
      const resultat = await carteService.emettreEnLot({
        membreIds: selection,
        exerciceId,
        typeCarteId,
      });
      setRapport(resultat);
      setSelection([]);
      surEmission?.();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  const pret = selection.length > 0 && exerciceId && typeCarteId;

  return (
    <Modale
      large
      titre={rapport ? "Résultat de l'émission" : 'Émettre des cartes en bloc'}
      ouverte
      surFermeture={surFermeture}
      pied={
        rapport ? (
          <>
            <Bouton variante="contour" onClick={() => setRapport(null)}>Nouvelle émission</Bouton>
            <Bouton onClick={surFermeture}>Terminer</Bouton>
          </>
        ) : (
          <>
            <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
            <Bouton onClick={emettre} chargement={enCours} disabled={!pret}>
              {selection.length > 0 ? `Émettre ${selection.length} carte(s)` : 'Émettre'}
            </Bouton>
          </>
        )
      }
    >
      {rapport ? (
        <RapportLot rapport={rapport} libelleReussite="carte(s) émise(s)" />
      ) : (
        <div className="pile">
          <div className="grille-2">
            <Champ
              label="Exercice"
              type="select"
              value={exerciceId}
              onChange={(e) => setExerciceId(e.target.value)}
              options={[
                { valeur: '', libelle: 'Choisir un exercice' },
                ...exercices
                  .filter((exercice) => exercice.statut === 'ouvert')
                  .map((exercice) => ({ valeur: exercice.id, libelle: `Exercice ${exercice.annee}` })),
              ]}
            />
            <Champ
              label="Type de carte"
              type="select"
              value={typeCarteId}
              onChange={(e) => setTypeCarteId(e.target.value)}
              aide="Le montant s'ajuste à la catégorie de chaque membre."
              options={[
                { valeur: '', libelle: 'Choisir un type' },
                ...(types.donnees ?? []).map((type) => ({ valeur: type.id, libelle: type.libelle })),
              ]}
            />
          </div>

          <div className="rang" style={{ gap: 'var(--e-2)', flexWrap: 'wrap' }}>
            <Champ
              placeholder="Matricule, nom, téléphone…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              aria-label="Rechercher un membre"
              style={{ flex: 1, minWidth: 200 }}
            />
            <Champ
              type="select"
              value={categorieId}
              onChange={(e) => setCategorieId(e.target.value)}
              aria-label="Filtrer par catégorie"
              options={[
                { valeur: '', libelle: 'Toutes catégories' },
                ...(referentiels.donnees?.categories_membres ?? []).map((c) => ({
                  valeur: c.id, libelle: c.libelle,
                })),
              ]}
            />
          </div>

          {membres.chargement && <Chargement lignes={4} />}

          {!membres.chargement && liste.length === 0 && (
            <Vide titre="Aucun membre actif ne correspond" texte="Élargissez la recherche." />
          )}

          {liste.length > 0 && (
            <div className="tableau-enveloppe" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="tableau">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        className="case-ligne"
                        checked={tousAffichesRetenus}
                        onChange={basculerTous}
                        aria-label="Retenir tous les membres affichés"
                      />
                    </th>
                    <th>Membre</th>
                    <th>Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {liste.map((membre) => (
                    <tr key={membre.id} onClick={() => basculer(membre.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input
                          type="checkbox"
                          className="case-ligne"
                          checked={selection.includes(membre.id)}
                          onChange={() => basculer(membre.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Retenir ${membre.nom_complet}`}
                        />
                      </td>
                      <td>
                        {membre.nom_complet}
                        <span className="tenu chiffre" style={{ display: 'block' }}>{membre.matricule}</span>
                      </td>
                      <td className="silence">{membre.categorie?.libelle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="tenu" style={{ margin: 0 }}>
            Un membre déjà titulaire d'une carte de ce type sera signalé sans interrompre
            l'émission des autres.
          </p>
        </div>
      )}
    </Modale>
  );
}
