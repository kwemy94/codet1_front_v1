import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { contributionService, exerciceService, exportService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import Modale from '@/components/ui/Modale';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import ChoixMembre from '@/components/donnees/ChoixMembre';
import PaiementManuel from './finances/PaiementManuel';
import { appliquerErreursApi, formaterDate, formaterMontant } from '@/utils/format';

export default function Contributions() {
  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const [exerciceId, setExerciceId] = useState('');
  const [statut, setStatut] = useState('');
  const [exportEnCours, setExportEnCours] = useState(false);

  const exercices = useRequete(() => exerciceService.lister(), []);

  const filtres = useMemo(
    () => ({ exercice_id: exerciceId || undefined, statut: statut || undefined }),
    [exerciceId, statut],
  );

  const { donnees, chargement, erreur, recharger } = useRequete(
    () => contributionService.lister(filtres),
    [filtres],
  );

  const contributions = donnees?.data ?? [];

  /** L'état édité reprend les filtres affichés. */
  const exporter = async () => {
    setExportEnCours(true);
    try {
      const annee = (exercices.donnees ?? []).find((e) => String(e.id) === String(exerciceId))?.annee;
      await exportService.contributions({ exerciceId: exerciceId || null, annee, statut });
    } catch (probleme) {
      notifier.alerte(probleme.message);
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="pile">
      <Carte serree>
        <div className="rang" style={{ flexWrap: 'wrap' }}>
          <Champ
            type="select"
            value={exerciceId}
            onChange={(evenement) => setExerciceId(evenement.target.value)}
            aria-label="Exercice"
            options={[
              { valeur: '', libelle: 'Tous les exercices' },
              ...(exercices.donnees ?? []).map((exercice) => ({
                valeur: exercice.id,
                libelle: `Exercice ${exercice.annee}`,
              })),
            ]}
          />

          <Champ
            type="select"
            value={statut}
            onChange={(evenement) => setStatut(evenement.target.value)}
            aria-label="Statut de la contribution"
            options={[
              { valeur: '', libelle: 'Tous les statuts' },
              { valeur: 'attendue', libelle: 'Attendues' },
              { valeur: 'encaissee', libelle: 'Encaissées' },
              { valeur: 'recue', libelle: 'Reçues (dons en nature)' },
              { valeur: 'annulee', libelle: 'Annulées' },
            ]}
          />

          <Bouton
            variante="contour"
            className="pousse"
            chargement={exportEnCours}
            onClick={exporter}
          >
            {statut ? 'Exporter la sélection (PDF)' : 'État des contributions (PDF)'}
          </Bouton>

          <Bouton onClick={() => setSaisieOuverte(true)}>Enregistrer une contribution</Bouton>
        </div>
      </Carte>

      {chargement && <Chargement lignes={5} />}
      {erreur && <Erreur message={erreur.message} surReessai={recharger} />}

      <Carte className="carte--nue">
        {!chargement && contributions.length === 0 && (
          <Vide
            titre={
              exerciceId || statut
                ? 'Aucune contribution pour ce filtre'
                : 'Aucune contribution enregistrée'
            }
            texte={
              exerciceId || statut
                ? "Élargissez le filtre, ou enregistrez une nouvelle contribution."
                : 'Dons des membres, des entreprises, des associations ou des partenaires se saisissent ici.'
            }
            action={<Bouton onClick={() => setSaisieOuverte(true)}>Enregistrer une contribution</Bouton>}
          />
        )}

        {contributions.length > 0 && (
          <div className="tableau-enveloppe">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Origine</th>
                  <th>Nature</th>
                  <th>Objet</th>
                  <th className="col-nombre">Montant</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td className="chiffre">{contribution.reference}</td>
                    <td>
                      {contribution.membre?.nom ?? contribution.donateur?.denomination ?? '—'}
                      <span className="tenu" style={{ display: 'block' }}>
                        {contribution.membre ? 'Membre' : 'Donateur externe'}
                      </span>
                    </td>
                    <td className="silence">{LIBELLE_NATURE[contribution.nature] ?? contribution.nature}</td>
                    <td className="silence">
                      {contribution.designation || contribution.motif || contribution.type?.libelle || '—'}
                    </td>
                    <td className="col-nombre montant">
                      {formaterMontant(contribution.montant, { devise: false })}
                      {contribution.nature !== 'financier' && (
                        <span className="tenu" style={{ display: 'block' }}>valeur estimée</span>
                      )}
                      {contribution.nature === 'financier' && Number(contribution.montant_regle ?? 0) > 0
                        && contribution.statut === 'attendue' && (
                        <span className="tenu" style={{ display: 'block' }}>
                          reste {formaterMontant(contribution.solde, { devise: false })}
                        </span>
                      )}
                    </td>
                    <td className="silence chiffre">{formaterDate(contribution.date_contribution)}</td>
                    <td><Etiquette statut={contribution.statut} /></td>
                    <td className="col-nombre">
                      <ActionsStatut contribution={contribution} surChangement={recharger} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      {saisieOuverte && (
        <ModaleContribution
          ouverte
          surFermeture={() => setSaisieOuverte(false)}
          surEnregistrement={() => {
            setSaisieOuverte(false);
            recharger();
          }}
        />
      )}
    </div>
  );
}

function ModaleContribution({ ouverte, surFermeture, surEnregistrement }) {
  const [origine, setOrigine] = useState('donateur');
  const [membre, setMembre] = useState(null);
  const [creationDonateur, setCreationDonateur] = useState(false);
  const [donateurRetenu, setDonateurRetenu] = useState('');

  const referentiels = useRequete(() => referentielService.tout(), []);
  const exercices = useRequete(() => exerciceService.lister(), []);
  const donateurs = useRequete(() => contributionService.listerDonateurs(), []);

  const { register, handleSubmit, reset, watch, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { nature: 'financier' },
  });

  const nature = watch('nature');

  const soumettre = async (valeurs) => {
    if (origine === 'membre' && !membre) {
      setError('membre', { message: 'Choisissez le membre dans la liste de recherche.' });
      return;
    }

    if (origine === 'donateur' && !donateurRetenu) {
      setError('donateur', { message: 'Choisissez un donateur, ou créez-le juste en dessous.' });
      return;
    }

    try {
      await contributionService.enregistrer({
        membreId: origine === 'membre' ? membre.id : null,
        donateurId: origine === 'donateur' ? donateurRetenu : null,
        typeId: valeurs.typeId,
        exerciceId: valeurs.exerciceId,
        date: valeurs.date,
        montant: Number(valeurs.montant),
        nature: valeurs.nature,
        designation: valeurs.designation,
        motif: valeurs.motif,
      });
      notifier.succes('Contribution enregistrée.');
      reset();
      setMembre(null);
      setDonateurRetenu('');
      surEnregistrement?.();
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  const listeDonateurs = donateurs.donnees ?? [];

  return (
    <Modale
      titre="Nouvelle contribution"
      ouverte={ouverte}
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>Enregistrer</Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <div className="onglets">
          <button
            type="button"
            className={`onglet ${origine === 'donateur' ? 'onglet--actif' : ''}`}
            onClick={() => setOrigine('donateur')}
          >
            Donateur externe
          </button>
          <button
            type="button"
            className={`onglet ${origine === 'membre' ? 'onglet--actif' : ''}`}
            onClick={() => setOrigine('membre')}
          >
            Membre du comité
          </button>
        </div>

        {origine === 'membre' ? (
          <ChoixMembre membre={membre} surChoix={setMembre} erreur={errors.membre?.message} />
        ) : (
          <div className="pile" style={{ gap: 'var(--e-2)' }}>
            {donateurs.chargement && <p className="tenu" style={{ margin: 0 }}>Chargement des donateurs…</p>}

            {!donateurs.chargement && listeDonateurs.length === 0 ? (
              <div className="message message--info">
                Aucun donateur n'est encore enregistré. Créez le premier ci-dessous.
              </div>
            ) : (
              <Champ
                label="Donateur"
                type="select"
                value={donateurRetenu}
                onChange={(evenement) => setDonateurRetenu(evenement.target.value)}
                erreur={errors.donateur?.message}
                options={[
                  { valeur: '', libelle: 'Choisir un donateur' },
                  ...listeDonateurs.map((donateur) => ({
                    valeur: donateur.id,
                    libelle: `${donateur.denomination} — ${LIBELLE_CATEGORIE[donateur.categorie_donateur] ?? ''}`,
                  })),
                ]}
              />
            )}

            {creationDonateur ? (
              <FormulaireDonateur
                surAnnulation={() => setCreationDonateur(false)}
                surCreation={(donateur) => {
                  setCreationDonateur(false);
                  setDonateurRetenu(String(donateur.id));
                  donateurs.recharger();
                }}
              />
            ) : (
              <Bouton variante="discret" taille="petit" onClick={() => setCreationDonateur(true)}>
                + Nouveau donateur
              </Bouton>
            )}
          </div>
        )}

        <div className="grille-2">
          <Champ
            label="Type"
            type="select"
            options={[
              { valeur: '', libelle: 'Choisir un type' },
              ...(referentiels.donnees?.types_contributions ?? []).map((type) => ({
                valeur: type.id,
                libelle: type.libelle,
              })),
            ]}
            erreur={errors.typeId?.message}
            {...register('typeId', { required: 'Choisissez le type de contribution.' })}
          />
          <Champ
            label="Exercice"
            type="select"
            options={(exercices.donnees ?? [])
              .filter((exercice) => exercice.statut === 'ouvert')
              .map((exercice) => ({ valeur: exercice.id, libelle: exercice.annee }))}
            erreur={errors.exerciceId?.message}
            {...register('exerciceId', { required: true })}
          />
        </div>

        <Champ
          label="Nature du don"
          type="select"
          aide="Un don matériel ou en services n'a pas de paiement : sa réception est constatée par le secrétariat."
          options={[
            { valeur: 'financier', libelle: 'Financier — argent versé au comité' },
            { valeur: 'materiel', libelle: 'Matériel — biens remis au comité' },
            { valeur: 'service', libelle: 'Services — main-d\'œuvre, transport, expertise' },
          ]}
          {...register('nature')}
        />

        {nature !== 'financier' && (
          <Champ
            label="Désignation du bien ou du service"
            placeholder="5 sacs de ciment, 2 journées de maçonnerie…"
            erreur={errors.designation?.message}
            {...register('designation', { required: 'Décrivez ce qui a été donné.' })}
          />
        )}

        <div className="grille-2">
          <Champ
            label={nature === 'financier' ? 'Montant' : 'Valeur estimée'}
            type="number"
            min="1"
            aide={nature === 'financier' ? undefined : 'Sert aux états financiers, sans flux de trésorerie.'}
            erreur={errors.montant?.message}
            {...register('montant', { required: 'Indiquez le montant.' })}
          />
          <Champ
            label="Date"
            type="date"
            erreur={errors.date?.message}
            {...register('date', { required: 'Indiquez la date.' })}
          />
        </div>

        <Champ label="Motif" placeholder="Construction du forage, aide aux sinistrés…" {...register('motif')} />
      </form>
    </Modale>
  );
}

const LIBELLE_NATURE = {
  financier: 'Financier',
  materiel: 'Matériel',
  service: 'Services',
};

/**
 * Actions de suivi d'un don.
 *
 * Un don matériel ou en services n'a pas de paiement : c'est le secrétariat qui
 * constate sa réception. Un don financier, lui, devient encaissé par
 * l'enregistrement de son paiement — le bouton renvoie donc vers les paiements.
 */
function ActionsStatut({ contribution, surChangement }) {
  const [enCours, setEnCours] = useState(false);
  const [encaissementOuvert, setEncaissementOuvert] = useState(false);

  const enAttente = contribution.statut === 'attendue';
  const materielle = contribution.nature !== 'financier';
  const dejaRegle = Number(contribution.montant_regle ?? 0);

  const changer = async (statut) => {
    setEnCours(true);
    try {
      await contributionService.changerStatut(contribution.id, { statut });
      notifier.succes(statut === 'annulee' ? 'Contribution annulée.' : 'Don marqué comme reçu.');
      surChangement?.();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  if (!enAttente) {
    return null;
  }

  return (
    <>
      <div className="rang rang--fin" style={{ gap: 'var(--e-1)' }}>
        {materielle ? (
          <Bouton variante="discret" taille="petit" chargement={enCours} onClick={() => changer('recue')}>
            Marquer reçu
          </Bouton>
        ) : (
          <Bouton variante="discret" taille="petit" onClick={() => setEncaissementOuvert(true)}>
            {dejaRegle > 0 ? 'Compléter' : 'Encaisser'}
          </Bouton>
        )}

        <Bouton variante="discret" taille="petit" chargement={enCours} onClick={() => changer('annulee')}>
          Annuler
        </Bouton>
      </div>

      {encaissementOuvert && (
        <PaiementManuel
          contribution={contribution}
          surFermeture={() => setEncaissementOuvert(false)}
          surEnregistrement={() => {
            setEncaissementOuvert(false);
            surChangement?.();
          }}
        />
      )}
    </>
  );
}

const LIBELLE_CATEGORIE = {
  personne_physique: 'personne physique',
  entreprise: 'entreprise',
  association: 'association',
  partenaire: 'partenaire',
};

/** Création d'un donateur sans quitter la saisie de la contribution. */
function FormulaireDonateur({ surCreation, surAnnulation }) {
  const [donnees, setDonnees] = useState({
    denomination: '',
    categorie: 'personne_physique',
    telephone: '',
  });
  const [enCours, setEnCours] = useState(false);

  const modifier = (champ) => (evenement) =>
    setDonnees((etat) => ({ ...etat, [champ]: evenement.target.value }));

  const creer = async () => {
    if (!donnees.denomination.trim()) {
      notifier.alerte('Indiquez le nom ou la raison sociale du donateur.');
      return;
    }

    setEnCours(true);
    try {
      const donateur = await contributionService.creerDonateur(donnees);
      notifier.succes(`${donateur.denomination} est enregistré.`);
      surCreation(donateur);
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="carte carte--serree pile" style={{ background: 'var(--surface-douce)' }}>
      <Champ
        label="Nom ou raison sociale"
        value={donnees.denomination}
        onChange={modifier('denomination')}
        placeholder="Société Kamdem & Fils"
      />

      <div className="grille-2">
        <Champ
          label="Catégorie"
          type="select"
          value={donnees.categorie}
          onChange={modifier('categorie')}
          options={[
            { valeur: 'personne_physique', libelle: 'Personne physique' },
            { valeur: 'entreprise', libelle: 'Entreprise' },
            { valeur: 'association', libelle: 'Association' },
            { valeur: 'partenaire', libelle: 'Partenaire' },
          ]}
        />
        <Champ label="Téléphone" value={donnees.telephone} onChange={modifier('telephone')} />
      </div>

      <div className="rang rang--fin">
        <Bouton variante="discret" taille="petit" onClick={surAnnulation}>Annuler</Bouton>
        <Bouton taille="petit" onClick={creer} chargement={enCours}>Créer le donateur</Bouton>
      </div>
    </div>
  );
}
