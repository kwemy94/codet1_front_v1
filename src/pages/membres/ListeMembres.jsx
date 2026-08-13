import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportService, membreService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import StatutMembre from '@/components/donnees/StatutMembre';
import Pagination from '@/components/ui/Pagination';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import FormulaireMembre from './FormulaireMembre';
import { formaterDate } from '@/utils/format';

export default function ListeMembres() {
  const estAdmin = useAuthStore((etat) => etat.estAdministrateur());
  const [recherche, setRecherche] = useState('');
  const [statut, setStatut] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [page, setPage] = useState(1);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(null);

  const rechercheRetardee = useDebounce(recherche);

  const filtres = useMemo(
    () => ({
      recherche: rechercheRetardee || undefined,
      statut: statut || undefined,
      categorie_id: categorieId || undefined,
      page,
    }),
    [rechercheRetardee, statut, categorieId, page],
  );

  const { donnees, chargement, erreur, recharger } = useRequete(
    () => membreService.lister(filtres),
    [filtres],
  );

  const referentiels = useRequete(() => referentielService.tout(), []);

  const membres = donnees?.data ?? [];

  const changerFiltre = (setter) => (evenement) => {
    setter(evenement.target.value);
    setPage(1);
  };

  /** Édite l'historique du membre sans quitter la liste de recherche. */
  const exporterHistorique = async (membre) => {
    setExportEnCours(membre.id);
    try {
      await exportService.historiqueMembre(membre.id, membre.matricule);
    } catch (probleme) {
      notifier.alerte(probleme.message);
    } finally {
      setExportEnCours(null);
    }
  };

  return (
    <div className="pile">
      <Carte serree>
        <div className="rang" style={{ flexWrap: 'wrap', gap: 'var(--e-3)' }}>
          <Champ
            placeholder="Matricule, nom, téléphone…"
            value={recherche}
            onChange={changerFiltre(setRecherche)}
            style={{ minWidth: 240 }}
            aria-label="Rechercher un membre"
          />

          <Champ
            type="select"
            value={statut}
            onChange={changerFiltre(setStatut)}
            aria-label="Filtrer par statut"
            options={[
              { valeur: '', libelle: 'Tous les statuts' },
              { valeur: 'actif', libelle: 'Actifs' },
              { valeur: 'inactif', libelle: 'Inactifs' },
              { valeur: 'decede', libelle: 'Décédés' },
            ]}
          />

          <Champ
            type="select"
            value={categorieId}
            onChange={changerFiltre(setCategorieId)}
            aria-label="Filtrer par catégorie"
            options={[
              { valeur: '', libelle: 'Toutes les catégories' },
              ...(referentiels.donnees?.categories_membres ?? []).map((categorie) => ({
                valeur: categorie.id,
                libelle: categorie.libelle,
              })),
            ]}
          />

          {estAdmin && (
            <Bouton className="pousse" onClick={() => setFormulaireOuvert(true)}>
              Ajouter un membre
            </Bouton>
          )}
        </div>
      </Carte>

      <Carte className="carte--nue">
        {chargement && <div style={{ padding: 'var(--e-5)' }}><Chargement /></div>}
        {erreur && <div style={{ padding: 'var(--e-4)' }}><Erreur message={erreur.message} surReessai={recharger} /></div>}

        {!chargement && !erreur && membres.length === 0 && (
          <Vide
            titre="Aucun membre ne correspond"
            texte="Modifiez la recherche ou enregistrez un nouveau ressortissant."
            action={estAdmin && <Bouton onClick={() => setFormulaireOuvert(true)}>Ajouter un membre</Bouton>}
          />
        )}

        {!chargement && membres.length > 0 && (
          <>
            <div className="tableau-enveloppe">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Téléphone</th>
                    <th>Adhésion</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {membres.map((membre) => (
                    <tr key={membre.id}>
                      <td className="chiffre">{membre.matricule}</td>
                      <td>
                        <Link to={`/membres/${membre.id}`}>{membre.nom_complet}</Link>
                      </td>
                      <td className="silence">{membre.categorie?.libelle ?? '—'}</td>
                      <td className="chiffre">{membre.telephone}</td>
                      <td className="silence">{formaterDate(membre.date_adhesion)}</td>
                      <td title={membre.motif_statut ?? undefined}>
                        <Etiquette statut={membre.statut} />
                        {membre.motif_statut && membre.statut !== 'actif' && (
                          <span className="tenu" style={{ display: 'block', maxWidth: 180 }}>
                            {membre.motif_statut}
                          </span>
                        )}
                      </td>
                      <td className="col-nombre">
                        <div className="rang rang--fin" style={{ gap: 'var(--e-1)', flexWrap: 'wrap' }}>
                        {estAdmin && (
                          <Bouton
                            variante="discret"
                            taille="petit"
                            chargement={exportEnCours === membre.id}
                            onClick={() => exporterHistorique(membre)}
                          >
                            Historique
                          </Bouton>
                        )}
                        {estAdmin && <StatutMembre membre={membre} surChangement={recharger} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={donnees?.meta} surChangement={setPage} />
          </>
        )}
      </Carte>

      {formulaireOuvert && (
        <FormulaireMembre
          ouvert
          surFermeture={() => setFormulaireOuvert(false)}
          surEnregistrement={() => {
            setFormulaireOuvert(false);
            recharger();
          }}
          referentiels={referentiels.donnees}
        />
      )}
    </div>
  );
}
