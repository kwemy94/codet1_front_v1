import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { exerciceService, referentielService, tarifService, typeCarteService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import Modale from '@/components/ui/Modale';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import RubanVentilation from '@/components/donnees/RubanVentilation';
import { formaterMontant, formaterPourcentage, appliquerErreursApi } from '@/utils/format';

export default function Tarifs() {
  const [modale, setModale] = useState(null); // 'exercice' | 'type' | 'tarif'

  const exercices = useRequete(() => exerciceService.lister(), []);
  const types = useRequete(() => typeCarteService.lister(), []);
  const destinations = useRequete(() => typeCarteService.destinations(), []);
  const referentiels = useRequete(() => referentielService.tout(), []);
  const tarifs = useRequete(() => tarifService.lister(), []);

  const exercicesOuverts = (exercices.donnees ?? []).filter((exercice) => exercice.statut === 'ouvert');
  const aucunExerciceOuvert = !exercices.chargement && exercicesOuverts.length === 0;

  const toutRecharger = () => {
    exercices.recharger();
    tarifs.recharger();
  };

  const cloturer = async (exercice) => {
    const confirme = window.confirm(
      `Clôturer l'exercice ${exercice.annee} ? Le reversement au CODET I sera figé et plus aucun paiement ne pourra y être rattaché.`,
    );
    if (!confirme) return;

    try {
      await exerciceService.cloturer(exercice.id);
      notifier.succes(`Exercice ${exercice.annee} clôturé.`);
      toutRecharger();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    }
  };

  return (
    <div className="pile" style={{ gap: 'var(--e-5)' }}>
      {aucunExerciceOuvert && (
        <div className="message message--info">
          <div style={{ flex: 1 }}>
            Tous les exercices sont clôturés : aucune carte ni aucun paiement ne peut
            être enregistré. Ouvrez l'exercice suivant pour reprendre les encaissements.
          </div>
          <Bouton taille="petit" onClick={() => setModale('exercice')}>Ouvrir un exercice</Bouton>
        </div>
      )}

      <Carte
        titre="Exercices"
        action={<Bouton variante="contour" taille="petit" onClick={() => setModale('exercice')}>Ouvrir un exercice</Bouton>}
      >
        {exercices.chargement && <Chargement lignes={3} />}
        {exercices.erreur && <Erreur message={exercices.erreur.message} surReessai={exercices.recharger} />}

        {!exercices.chargement && (exercices.donnees ?? []).length === 0 && (
          <Vide
            titre="Aucun exercice"
            texte="L'exercice délimite l'année de cotisation : tarifs, cartes et reversement s'y rattachent."
            action={<Bouton onClick={() => setModale('exercice')}>Ouvrir le premier exercice</Bouton>}
          />
        )}

        {(exercices.donnees ?? []).length > 0 && (
          <div className="tableau-enveloppe">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Période</th>
                  <th className="col-nombre">Cartes émises</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(exercices.donnees ?? []).map((exercice) => (
                  <tr key={exercice.id}>
                    <td className="chiffre">{exercice.annee}</td>
                    <td className="silence chiffre">{exercice.date_debut} → {exercice.date_fin}</td>
                    <td className="col-nombre">{exercice.cartes_count ?? 0}</td>
                    <td><Etiquette statut={exercice.statut} /></td>
                    <td className="col-nombre">
                      {exercice.statut === 'ouvert' && (
                        <Bouton variante="discret" taille="petit" onClick={() => cloturer(exercice)}>
                          Clôturer
                        </Bouton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <Carte
        titre="Types de cartes"
        action={<Bouton variante="contour" taille="petit" onClick={() => setModale('type')}>Nouveau type</Bouton>}
      >
        <p className="tenu">
          La carte annuelle est due par tout ressortissant et son montant dépend de sa
          catégorie. Vous pouvez créer d'autres types — carte d'honneur, carte de
          soutien — avec leur propre répartition.
        </p>

        {types.chargement && <Chargement lignes={2} />}

        <div className="grille-2" style={{ marginTop: 'var(--e-4)' }}>
          {(types.donnees ?? []).map((type) => (
            <div key={type.id} className="carte carte--serree">
              <div className="rang rang--entre">
                <strong>{type.libelle}</strong>
                <Etiquette ton={type.obligatoire ? 'primaire' : 'neutre'}>
                  {type.obligatoire ? 'Obligatoire' : 'Facultative'}
                </Etiquette>
              </div>
              {type.description && <p className="tenu" style={{ margin: '6px 0 0' }}>{type.description}</p>}
              <p className="tenu" style={{ margin: '6px 0 0' }}>
                {type.cartes_count ?? 0} carte(s) émise(s)
              </p>
            </div>
          ))}
        </div>
      </Carte>

      <Carte
        titre="Tarifs en vigueur"
        action={
          <Bouton variante="contour" taille="petit" onClick={() => setModale('tarif')} disabled={aucunExerciceOuvert}>
            Nouveau tarif
          </Bouton>
        }
      >
        <p className="tenu">
          Modifier un montant crée une nouvelle version. Les cartes déjà émises
          conservent le tarif appliqué au moment de leur émission.
        </p>

        {tarifs.chargement && <Chargement lignes={4} />}

        {!tarifs.chargement && (tarifs.donnees ?? []).length === 0 && (
          <Vide
            titre="Aucun tarif défini"
            texte="Sans tarif, aucune carte ne peut être émise pour cet exercice."
            action={<Bouton onClick={() => setModale('tarif')} disabled={aucunExerciceOuvert}>Définir un tarif</Bouton>}
          />
        )}

        <div className="grille-2" style={{ marginTop: 'var(--e-4)' }}>
          {(tarifs.donnees ?? []).map((tarif) => (
            <div key={tarif.id} className="carte carte--serree">
              <div className="rang rang--entre">
                <span style={{ minWidth: 0 }}>
                  <strong>{tarif.type_carte?.libelle ?? 'Carte'}</strong>
                  <span className="tenu" style={{ display: 'block' }}>
                    {tarif.categorie?.libelle ?? 'Toutes catégories'} · exercice {tarif.exercice?.annee}
                  </span>
                </span>
                <span className="montant">{formaterMontant(tarif.montant_minimum)}</span>
              </div>

              <div style={{ marginTop: 'var(--e-3)' }}>
                <RubanVentilation
                  compact
                  hauteur={7}
                  parts={Object.fromEntries(
                    (tarif.repartitions ?? []).map((ligne) => [ligne.destination?.code ?? '?', ligne.montant]),
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Carte>

      <Carte titre="Destinations des fonds">
        <p className="tenu">
          Le taux détermine la part de chaque destination qui revient au compte du
          CODET I. Une modification ne s'applique qu'aux exercices non encore calculés.
        </p>

        {destinations.chargement && <Chargement lignes={3} />}

        <div className="pile" style={{ marginTop: 'var(--e-4)' }}>
          {(destinations.donnees ?? []).map((destination) => (
            <LigneDestination
              key={destination.id}
              destination={destination}
              surModification={destinations.recharger}
            />
          ))}
        </div>
      </Carte>

      {modale === 'exercice' && (
        <ModaleExercice
          exercices={exercices.donnees ?? []}
          surFermeture={() => setModale(null)}
          surCreation={() => {
            setModale(null);
            toutRecharger();
          }}
        />
      )}

      {modale === 'type' && (
        <ModaleType
          surFermeture={() => setModale(null)}
          surCreation={() => {
            setModale(null);
            types.recharger();
          }}
        />
      )}

      {modale === 'tarif' && (
        <ModaleTarif
          exercices={exercicesOuverts}
          types={types.donnees ?? []}
          categories={referentiels.donnees?.categories_membres ?? []}
          destinations={destinations.donnees ?? []}
          surFermeture={() => setModale(null)}
          surEnregistrement={() => {
            setModale(null);
            tarifs.recharger();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Exercice */

function ModaleExercice({ exercices, surFermeture, surCreation }) {
  const derniere = exercices.reduce((max, exercice) => Math.max(max, exercice.annee), new Date().getFullYear() - 1);
  const proposee = derniere + 1;

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      annee: proposee,
      dateDebut: `${proposee}-01-01`,
      dateFin: `${proposee}-12-31`,
    },
  });

  const soumettre = async (valeurs) => {
    try {
      await exerciceService.ouvrir({
        annee: Number(valeurs.annee),
        dateDebut: valeurs.dateDebut,
        dateFin: valeurs.dateFin,
      });
      notifier.succes(`Exercice ${valeurs.annee} ouvert. Définissez maintenant ses tarifs.`);
      surCreation?.();
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      titre="Ouvrir un exercice"
      ouverte
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>Ouvrir l'exercice</Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <p className="tenu" style={{ margin: 0 }}>
          Plusieurs exercices peuvent rester ouverts simultanément, par exemple le temps
          de recouvrer les retards de l'année précédente.
        </p>

        <Champ
          label="Année"
          type="number"
          min="2000"
          max="2100"
          erreur={errors.annee?.message}
          {...register('annee', { required: "Indiquez l'année." })}
        />

        <div className="grille-2">
          <Champ label="Début" type="date" {...register('dateDebut', { required: true })} />
          <Champ label="Fin" type="date" {...register('dateFin', { required: true })} />
        </div>

        <div className="message message--info">
          Les tarifs ne sont pas repris automatiquement d'un exercice à l'autre :
          vous les redéfinissez, ce qui évite de reconduire un montant par inadvertance.
        </div>
      </form>
    </Modale>
  );
}

/* -------------------------------------------------------------- Type de carte */

function ModaleType({ surFermeture, surCreation }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  const soumettre = async (valeurs) => {
    try {
      const type = await typeCarteService.creer({
        libelle: valeurs.libelle,
        description: valeurs.description,
        obligatoire: valeurs.obligatoire === 'true',
      });
      notifier.succes(`Type « ${type.libelle} » créé. Définissez maintenant son tarif.`);
      surCreation?.();
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      titre="Nouveau type de carte"
      ouverte
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>Créer le type</Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <Champ
          label="Libellé"
          placeholder="Carte de membre d'honneur"
          erreur={errors.libelle?.message}
          {...register('libelle', { required: 'Donnez un nom au type de carte.' })}
        />

        <Champ
          label="Description"
          type="textarea"
          placeholder="Carte facultative, intégralement reversée au compte du CODET I."
          {...register('description')}
        />

        <Champ
          label="Portée"
          type="select"
          aide="Une carte obligatoire est due par tous et son montant dépend de la catégorie du membre."
          options={[
            { valeur: 'false', libelle: 'Facultative — souscrite librement' },
            { valeur: 'true', libelle: 'Obligatoire — due par tout ressortissant' },
          ]}
          {...register('obligatoire')}
        />
      </form>
    </Modale>
  );
}

/* --------------------------------------------------------------------- Tarif */

function ModaleTarif({ exercices, types, categories, destinations, surFermeture, surEnregistrement }) {
  const [montant, setMontant] = useState('');
  const [lignes, setLignes] = useState([{ destinationId: '', montant: '' }]);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  const somme = lignes.reduce((total, ligne) => total + (Number(ligne.montant) || 0), 0);
  const attendu = Number(montant) || 0;
  const coherent = attendu > 0 && somme === attendu;

  const modifierLigne = (index, champ) => (evenement) =>
    setLignes((etat) =>
      etat.map((ligne, i) => (i === index ? { ...ligne, [champ]: evenement.target.value } : ligne)),
    );

  const soumettre = async (valeurs) => {
    try {
      await tarifService.enregistrerVersion({
        exerciceId: valeurs.exerciceId,
        typeCarteId: valeurs.typeCarteId,
        categorieId: valeurs.categorieId || null,
        montantMinimum: attendu,
        repartitions: lignes
          .filter((ligne) => ligne.destinationId && Number(ligne.montant) > 0)
          .map((ligne) => ({ destinationId: ligne.destinationId, montant: Number(ligne.montant) })),
      });
      notifier.succes('Nouvelle version du tarif enregistrée.');
      surEnregistrement?.();
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  const apercu = Object.fromEntries(
    lignes
      .filter((ligne) => ligne.destinationId && Number(ligne.montant) > 0)
      .map((ligne) => [
        destinations.find((destination) => String(destination.id) === String(ligne.destinationId))?.code ?? '?',
        Number(ligne.montant),
      ]),
  );

  return (
    <Modale
      large
      titre="Nouveau tarif"
      ouverte
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting} disabled={!coherent}>
            Enregistrer le tarif
          </Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <div className="grille-2">
          <Champ
            label="Type de carte"
            type="select"
            options={[
              { valeur: '', libelle: 'Choisir un type' },
              ...types.map((type) => ({ valeur: type.id, libelle: type.libelle })),
            ]}
            {...register('typeCarteId', { required: true })}
          />
          <Champ
            label="Exercice"
            type="select"
            options={exercices.map((exercice) => ({ valeur: exercice.id, libelle: exercice.annee }))}
            {...register('exerciceId', { required: true })}
          />
        </div>

        <Champ
          label="Catégorie concernée"
          type="select"
          aide="Laissez « toutes catégories » pour une carte dont le montant ne dépend pas du statut du membre."
          options={[
            { valeur: '', libelle: 'Toutes catégories' },
            ...categories.map((categorie) => ({ valeur: categorie.id, libelle: categorie.libelle })),
          ]}
          {...register('categorieId')}
        />

        <Champ
          label="Montant de la carte"
          type="number"
          min="1"
          value={montant}
          onChange={(evenement) => setMontant(evenement.target.value)}
        />

        <div>
          <p className="surtitre">Répartition du montant</p>
          <p className="tenu" style={{ marginTop: 0 }}>
            Une seule ligne suffit si la totalité revient à une même destination.
          </p>

          <div className="pile" style={{ gap: 'var(--e-2)' }}>
            {lignes.map((ligne, index) => (
              <div className="rang" key={index} style={{ gap: 'var(--e-2)' }}>
                <Champ
                  type="select"
                  value={ligne.destinationId}
                  onChange={modifierLigne(index, 'destinationId')}
                  aria-label="Destination"
                  className="pousse"
                  style={{ flex: 1 }}
                  options={[
                    { valeur: '', libelle: 'Choisir une destination' },
                    ...destinations.map((destination) => ({
                      valeur: destination.id,
                      libelle: `${destination.libelle} — reversé à ${formaterPourcentage(destination.taux_reversement, 0)}`,
                    })),
                  ]}
                />
                <Champ
                  type="number"
                  min="0"
                  placeholder="Montant"
                  value={ligne.montant}
                  onChange={modifierLigne(index, 'montant')}
                  aria-label="Montant de la ligne"
                  style={{ width: 140 }}
                />
                {lignes.length > 1 && (
                  <Bouton
                    variante="discret"
                    taille="petit"
                    onClick={() => setLignes((etat) => etat.filter((_, i) => i !== index))}
                    aria-label="Retirer la ligne"
                  >
                    ✕
                  </Bouton>
                )}
              </div>
            ))}
          </div>

          <Bouton
            variante="discret"
            taille="petit"
            onClick={() => setLignes((etat) => [...etat, { destinationId: '', montant: '' }])}
          >
            + Ajouter une destination
          </Bouton>
        </div>

        <div className={`message ${coherent ? 'message--succes' : 'message--alerte'}`}>
          {coherent
            ? `La répartition totalise bien ${formaterMontant(attendu)}.`
            : `La répartition totalise ${formaterMontant(somme)} — elle doit être égale au montant de la carte.`}
        </div>

        {Object.keys(apercu).length > 0 && <RubanVentilation hauteur={10} parts={apercu} />}
      </form>
    </Modale>
  );
}

/* --------------------------------------------------------------- Destination */

function LigneDestination({ destination, surModification }) {
  const [taux, setTaux] = useState(String(destination.taux_reversement ?? 0));
  const [enCours, setEnCours] = useState(false);
  const modifie = Number(taux) !== Number(destination.taux_reversement);

  const enregistrer = async () => {
    setEnCours(true);
    try {
      await typeCarteService.modifierDestination(destination.id, { taux_reversement: Number(taux) });
      notifier.succes(`${destination.libelle} : reversement fixé à ${formaterPourcentage(taux, 0)}.`);
      surModification?.();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="rang" style={{ gap: 'var(--e-3)', flexWrap: 'wrap' }}>
      <span style={{ flex: 1, minWidth: 200 }}>
        <strong>{destination.libelle}</strong>
        <span className="tenu chiffre" style={{ display: 'block' }}>{destination.code}</span>
      </span>

      <Champ
        type="number"
        min="0"
        max="100"
        value={taux}
        onChange={(evenement) => setTaux(evenement.target.value)}
        aria-label={`Taux de reversement de ${destination.libelle}`}
        style={{ width: 110 }}
      />
      <span className="tenu">% reversés au CODET I</span>

      <Bouton variante="contour" taille="petit" onClick={enregistrer} chargement={enCours} disabled={!modifie}>
        Enregistrer
      </Bouton>
    </div>
  );
}
