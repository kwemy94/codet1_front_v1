import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { carteService, exerciceService, exportService, membreService, typeCarteService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useAuthStore } from '@/store/authStore';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Etiquette from '@/components/ui/Etiquette';
import { Chargement, Erreur } from '@/components/ui/Etats';
import RubanVentilation from '@/components/donnees/RubanVentilation';
import AccesMembre from '@/components/donnees/AccesMembre';
import StatutMembre from '@/components/donnees/StatutMembre';
import Modale from '@/components/ui/Modale';
import { formaterDate, formaterMontant, initiales } from '@/utils/format';

export default function FicheMembre() {
  const { id } = useParams();
  const estAdmin = useAuthStore((etat) => etat.estAdministrateur());
  const [emissionOuverte, setEmissionOuverte] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);
  const { donnees: membre, chargement, erreur, recharger } = useRequete(
    () => membreService.consulter(id),
    [id],
  );

  // Squelette au premier chargement seulement : un rechargement en arrière-plan
  // ne doit pas démonter l'écran, sous peine d'emporter les modales ouvertes.
  if (chargement && !membre) return <Chargement lignes={6} />;
  if (erreur) return <Erreur message={erreur.message} surReessai={recharger} />;
  if (!membre) return null;

  /** Historique complet du membre : tous les exercices, impayés compris. */
  const exporterHistorique = async () => {
    setExportEnCours(true);
    try {
      await exportService.historiqueMembre(membre.id, membre.matricule);
    } catch (probleme) {
      notifier.alerte(probleme.message);
    } finally {
      setExportEnCours(false);
    }
  };

  const emettreCarte = async (typeCarteId) => {
    try {
      const exercice = await exerciceService.courant();
      if (!exercice) {
        notifier.alerte("Aucun exercice n'est ouvert. Ouvrez-en un dans Tarifs et exercices.");
        return;
      }
      await carteService.emettre({ membreId: membre.id, exerciceId: exercice.id, typeCarteId });
      notifier.succes(`Carte ${exercice.annee} émise pour ${membre.nom_complet}.`);
      setEmissionOuverte(false);
      recharger();
    } catch (probleme) {
      notifier.alerte(probleme.message);
    }
  };

  return (
    <div className="pile" style={{ gap: 'var(--e-5)' }}>
      {membre.statut !== 'actif' && (
        <div className="message message--alerte">
          <div>
            <strong>
              {membre.statut === 'decede' ? 'Membre décédé' : 'Membre suspendu'}
              {membre.date_changement_statut ? ` — ${formaterDate(membre.date_changement_statut)}` : ''}
            </strong>
            {membre.motif_statut && <span style={{ display: 'block' }}>{membre.motif_statut}</span>}
            <span className="tenu" style={{ display: 'block', marginTop: 4 }}>
              Son historique reste consultable et ses cotisations passées demeurent aux comptes du comité.
              {membre.statut === 'inactif' && ' Aucune carte ne peut lui être émise tant qu\'il n\'est pas réactivé.'}
            </span>
          </div>
        </div>
      )}

      <Carte>
        <div className="rang rang--haut" style={{ gap: 'var(--e-4)' }}>
          <span className="jeton-initiales" style={{ width: 52, height: 52, fontSize: 'var(--t-md)' }}>
            {initiales(membre.nom, membre.prenom ?? '')}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="surtitre chiffre">{membre.matricule}</p>
            <h2>{membre.nom_complet}</h2>
            <p className="silence" style={{ margin: 0 }}>
              {membre.categorie?.libelle} · {membre.profession || 'Profession non renseignée'}
            </p>
          </div>

          <div className="rang" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Etiquette statut={membre.statut} />
            {estAdmin && <StatutMembre membre={membre} surChangement={recharger} />}
            {estAdmin && (
              <Bouton variante="contour" chargement={exportEnCours} onClick={exporterHistorique}>
                Historique (PDF)
              </Bouton>
            )}
            {estAdmin && <AccesMembre membre={membre} surChangement={recharger} />}
            {estAdmin && <Bouton variante="contour" onClick={() => setEmissionOuverte(true)}>Émettre une carte</Bouton>}
          </div>
        </div>
      </Carte>

      <div className="grille-2">
        <Carte titre="Coordonnées">
          <dl className="pile" style={{ gap: 'var(--e-3)', margin: 0 }}>
            <Ligne libelle="Téléphone" valeur={membre.telephone} mono />
            <Ligne libelle="E-mail" valeur={membre.email || '—'} />
            <Ligne
              libelle="Localisation"
              valeur={[membre.localisation?.ville, membre.localisation?.pays].filter(Boolean).join(', ') || '—'}
            />
            <Ligne libelle="Quartier" valeur={membre.localisation?.quartier || '—'} />
            <Ligne libelle="Adhésion" valeur={formaterDate(membre.date_adhesion)} />
            <Ligne
              libelle="Espace personnel"
              valeur={
                membre.a_un_compte
                  ? membre.acces?.doit_changer_mot_de_passe
                    ? 'Accès créé — mot de passe provisoire'
                    : 'Accès actif'
                  : 'Aucun accès'
              }
            />
          </dl>
        </Carte>

        <Carte titre="Cartes annuelles">
          {!membre.cartes?.length ? (
            <p className="tenu">Aucune carte émise pour ce membre.</p>
          ) : (
            <div className="pile">
              {membre.cartes.map((carte) => (
                <div key={carte.id} className="pile" style={{ gap: 'var(--e-2)' }}>
                  <div className="rang rang--entre">
                    <span style={{ minWidth: 0 }}>
                      <span className="chiffre">{carte.exercice}</span>
                      <span className="tenu" style={{ display: 'block' }}>{carte.type_carte?.libelle}</span>
                    </span>
                    <span className="montant">{formaterMontant(carte.montant_regle)} / {formaterMontant(carte.montant_du)}</span>
                    <Etiquette statut={carte.statut} />
                    {carte.imprimable && (
                      <Link
                        to={`/cartes/${carte.id}/impression`}
                        className="bouton bouton--discret bouton--petit"
                      >
                        Imprimer
                      </Link>
                    )}
                  </div>
                  {carte.repartition && (
                    <RubanVentilation compact hauteur={6} parts={carte.repartition} />
                  )}
                </div>
              ))}
            </div>
          )}

          <Link to={`/paiements?membre_id=${membre.id}`} className="tenu">Voir tous ses paiements</Link>
        </Carte>
      </div>

      <Carte
        titre="Contributions et dons"
        action={
          membre.total_dons > 0 && (
            <span className="montant">{formaterMontant(membre.total_dons)} au total</span>
          )
        }
      >
        {!membre.contributions?.length ? (
          <p className="tenu">
            Aucun don enregistré pour ce membre. Les dons financiers, matériels ou en
            services se saisissent depuis l'écran Contributions.
          </p>
        ) : (
          <div className="tableau-enveloppe">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Nature</th>
                  <th>Objet</th>
                  <th className="col-nombre">Montant</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {membre.contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td className="chiffre">{contribution.reference}</td>
                    <td className="silence">{LIBELLE_NATURE[contribution.nature] ?? contribution.nature}</td>
                    <td className="silence">
                      {contribution.designation || contribution.motif || contribution.type || '—'}
                    </td>
                    <td className="col-nombre montant">
                      {formaterMontant(contribution.montant, { devise: false })}
                      {contribution.nature !== 'financier' && (
                        <span className="tenu" style={{ display: 'block' }}>valeur estimée</span>
                      )}
                    </td>
                    <td className="silence chiffre">{formaterDate(contribution.date_contribution)}</td>
                    <td><Etiquette statut={contribution.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      {emissionOuverte && (
        <ModaleEmission
          membre={membre}
          surFermeture={() => setEmissionOuverte(false)}
          surEmission={emettreCarte}
        />
      )}
    </div>
  );
}

const LIBELLE_NATURE = {
  financier: 'Financier',
  materiel: 'Matériel',
  service: 'Services',
};

/** Choix du type de carte à émettre pour l'exercice courant. */
function ModaleEmission({ membre, surFermeture, surEmission }) {
  const [typeRetenu, setTypeRetenu] = useState('');
  const [enCours, setEnCours] = useState(false);
  const types = useRequete(() => typeCarteService.lister({ actifs_seulement: true }), []);

  const emettre = async () => {
    if (!typeRetenu) return;
    setEnCours(true);
    await surEmission(typeRetenu);
    setEnCours(false);
  };

  return (
    <Modale
      titre="Émettre une carte"
      ouverte
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={emettre} chargement={enCours} disabled={!typeRetenu}>Émettre</Bouton>
        </>
      }
    >
      <div className="pile">
        <p className="tenu" style={{ margin: 0 }}>
          La carte est émise sur l'exercice ouvert, au tarif en vigueur pour la
          catégorie « {membre.categorie?.libelle} ».
        </p>

        {types.chargement && <Chargement lignes={2} />}

        {(types.donnees ?? []).map((type) => (
          <button
            key={type.id}
            type="button"
            className={`carte carte--serree choix-type ${String(typeRetenu) === String(type.id) ? 'choix-type--actif' : ''}`}
            onClick={() => setTypeRetenu(type.id)}
          >
            <span className="rang rang--entre">
              <strong>{type.libelle}</strong>
              <Etiquette ton={type.obligatoire ? 'primaire' : 'neutre'}>
                {type.obligatoire ? 'Obligatoire' : 'Facultative'}
              </Etiquette>
            </span>
            {type.description && <span className="tenu">{type.description}</span>}
          </button>
        ))}
      </div>
    </Modale>
  );
}

function Ligne({ libelle, valeur, mono = false }) {
  return (
    <div className="rang rang--entre" style={{ gap: 'var(--e-4)' }}>
      <dt className="tenu">{libelle}</dt>
      <dd className={mono ? 'chiffre' : ''} style={{ margin: 0, textAlign: 'right' }}>{valeur}</dd>
    </div>
  );
}
