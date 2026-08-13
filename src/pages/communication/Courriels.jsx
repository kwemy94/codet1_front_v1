import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { courrielService, exerciceService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import Modale from '@/components/ui/Modale';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import ChoixMembre from '@/components/donnees/ChoixMembre';
import { formaterDateHeure } from '@/utils/format';

const SITUATIONS = [
  { valeur: '', libelle: 'Toutes situations' },
  { valeur: 'a_jour', libelle: 'À jour de cotisation' },
  { valeur: 'en_retard', libelle: 'En retard de cotisation' },
  { valeur: 'sans_carte', libelle: "N'ont pas pris leur carte" },
];

export default function Courriels() {
  const [redactionOuverte, setRedactionOuverte] = useState(false);
  const [detail, setDetail] = useState(null);

  const { donnees, chargement, erreur, recharger } = useRequete(() => courrielService.historique(), []);
  const campagnes = donnees?.data ?? [];

  return (
    <div className="pile">
      <div className="rang rang--entre" style={{ flexWrap: 'wrap' }}>
        <p className="tenu" style={{ margin: 0, maxWidth: '56ch' }}>
          Convocations, appels à cotisation, annonces : chaque envoi est conservé,
          avec la liste des destinataires et le résultat.
        </p>
        <Bouton onClick={() => setRedactionOuverte(true)}>Écrire aux membres</Bouton>
      </div>

      {chargement && <Chargement lignes={4} />}
      {erreur && <Erreur message={erreur.message} surReessai={recharger} />}

      {!chargement && campagnes.length === 0 && (
        <Carte>
          <Vide
            titre="Aucun courriel envoyé"
            texte="Écrivez à un membre en particulier, ou à une sélection : tous les actifs, ceux d'une catégorie, ceux en retard de cotisation."
            action={<Bouton onClick={() => setRedactionOuverte(true)}>Écrire aux membres</Bouton>}
          />
        </Carte>
      )}

      {campagnes.length > 0 && (
        <Carte className="carte--nue">
          <div className="tableau-enveloppe">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Objet</th>
                  <th>Portée</th>
                  <th className="col-nombre">Destinataires</th>
                  <th className="col-nombre">Envoyés</th>
                  <th className="col-nombre">Échecs</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {campagnes.map((campagne) => (
                  <tr key={campagne.id} onClick={() => setDetail(campagne)} style={{ cursor: 'pointer' }}>
                    <td>{campagne.objet}</td>
                    <td className="silence">{campagne.portee === 'collectif' ? 'Collectif' : 'Individuel'}</td>
                    <td className="col-nombre">{campagne.nombre_destinataires}</td>
                    <td className="col-nombre">{campagne.envoyes}</td>
                    <td className="col-nombre">
                      {campagne.echecs > 0
                        ? <span style={{ color: 'var(--alerte)', fontWeight: 600 }}>{campagne.echecs}</span>
                        : '—'}
                    </td>
                    <td className="silence chiffre">{formaterDateHeure(campagne.date_envoi)}</td>
                    <td>
                      <Etiquette ton={
                        campagne.statut === 'terminee' ? 'succes'
                          : campagne.statut === 'echouee' ? 'alerte' : 'attente'
                      }>
                        {{ en_cours: 'En cours', terminee: 'Terminé', echouee: 'Échoué' }[campagne.statut]}
                      </Etiquette>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      )}

      {redactionOuverte && (
        <ModaleRedaction
          surFermeture={() => setRedactionOuverte(false)}
          surEnvoi={() => {
            setRedactionOuverte(false);
            recharger();
          }}
        />
      )}

      {detail && <DetailCampagne campagne={detail} surFermeture={() => setDetail(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Rédaction */

function ModaleRedaction({ surFermeture, surEnvoi }) {
  const [portee, setPortee] = useState('collectif');
  const [membre, setMembre] = useState(null);
  const [criteres, setCriteres] = useState({ statut: 'actif' });
  const [apercu, setApercu] = useState(null);
  const [apercuEnCours, setApercuEnCours] = useState(false);

  const referentiels = useRequete(() => referentielService.tout(), []);
  const exercices = useRequete(() => exerciceService.lister(), []);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  /** Les critères effectifs : un membre nommé l'emporte sur toute sélection. */
  const criteresEffectifs = useMemo(
    () => (portee === 'individuel'
      ? (membre ? { membre_ids: [membre.id] } : null)
      : criteres),
    [portee, membre, criteres],
  );

  // L'aperçu suit les critères : le secrétaire voit toujours qui il vise.
  useEffect(() => {
    if (!criteresEffectifs) {
      setApercu(null);
      return undefined;
    }

    let annule = false;
    setApercuEnCours(true);

    const minuteur = setTimeout(async () => {
      try {
        const resultat = await courrielService.apercu(criteresEffectifs);
        if (!annule) setApercu(resultat);
      } catch {
        if (!annule) setApercu(null);
      } finally {
        if (!annule) setApercuEnCours(false);
      }
    }, 250);

    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [criteresEffectifs]);

  const modifierCritere = (cle) => (evenement) =>
    setCriteres((etat) => ({ ...etat, [cle]: evenement.target.value || undefined }));

  const soumettre = async (valeurs) => {
    if (!criteresEffectifs) {
      setError('root', { message: 'Choisissez le membre destinataire.' });
      return;
    }

    try {
      const campagne = await courrielService.envoyer({
        objet: valeurs.objet,
        contenu: valeurs.contenu,
        criteres: criteresEffectifs,
      });
      notifier.succes(`Envoi lancé vers ${campagne.nombre_destinataires} membre(s).`);
      surEnvoi?.();
    } catch (erreur) {
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      large
      titre="Écrire aux membres"
      ouverte
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton
            onClick={handleSubmit(soumettre)}
            chargement={isSubmitting}
            disabled={!apercu?.nombre_retenus}
          >
            {apercu?.nombre_retenus
              ? `Envoyer à ${apercu.nombre_retenus} membre(s)`
              : 'Envoyer'}
          </Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <div className="onglets">
          <button
            type="button"
            className={`onglet ${portee === 'collectif' ? 'onglet--actif' : ''}`}
            onClick={() => setPortee('collectif')}
          >
            Une sélection de membres
          </button>
          <button
            type="button"
            className={`onglet ${portee === 'individuel' ? 'onglet--actif' : ''}`}
            onClick={() => setPortee('individuel')}
          >
            Un membre en particulier
          </button>
        </div>

        {portee === 'individuel' ? (
          <ChoixMembre membre={membre} surChoix={setMembre} label="Destinataire" />
        ) : (
          <div className="grille-2">
            <Champ
              label="Catégorie"
              type="select"
              onChange={modifierCritere('categorie_id')}
              options={[
                { valeur: '', libelle: 'Toutes catégories' },
                ...(referentiels.donnees?.categories_membres ?? []).map((c) => ({
                  valeur: c.id, libelle: c.libelle,
                })),
              ]}
            />
            <Champ
              label="Situation de cotisation"
              type="select"
              onChange={modifierCritere('situation')}
              options={SITUATIONS}
            />
            <Champ
              label="Exercice de référence"
              type="select"
              aide="Sert à la situation de cotisation."
              onChange={modifierCritere('exercice_id')}
              options={[
                { valeur: '', libelle: 'Exercice en cours' },
                ...(exercices.donnees ?? []).map((e) => ({ valeur: e.id, libelle: e.annee })),
              ]}
            />
            <Champ
              label="Sexe"
              type="select"
              onChange={modifierCritere('sexe')}
              options={[
                { valeur: '', libelle: 'Tous' },
                { valeur: 'M', libelle: 'Hommes' },
                { valeur: 'F', libelle: 'Femmes' },
              ]}
            />
          </div>
        )}

        <ApercuDestinataires apercu={apercu} chargement={apercuEnCours} />

        <Champ
          label="Objet"
          placeholder="Convocation à l'assemblée générale du 28 décembre"
          erreur={errors.objet?.message}
          {...register('objet', { required: "Indiquez l'objet du message." })}
        />

        <Champ
          label="Message"
          type="textarea"
          rows={8}
          aide="Le message est adressé nominativement : chaque membre reçoit « Bonjour {son nom} »."
          erreur={errors.contenu?.message}
          {...register('contenu', { required: 'Rédigez le message.' })}
        />
      </form>
    </Modale>
  );
}

/** Ce que l'envoi va atteindre — et ce qu'il n'atteindra pas. */
function ApercuDestinataires({ apercu, chargement }) {
  if (chargement) {
    return <p className="tenu" style={{ margin: 0 }}>Calcul de la sélection…</p>;
  }

  if (!apercu) return null;

  return (
    <div className="pile" style={{ gap: 'var(--e-2)' }}>
      <div className={`message ${apercu.nombre_retenus ? 'message--info' : 'message--alerte'}`}>
        <div>
          <strong>{apercu.nombre_retenus} membre(s)</strong> recevront ce message.
          {apercu.nombre_retenus > 0 && apercu.retenus.length > 0 && (
            <span className="tenu" style={{ display: 'block', marginTop: 4 }}>
              {apercu.retenus.slice(0, 4).map((m) => m.nom_complet).join(', ')}
              {apercu.nombre_retenus > 4 && ` et ${apercu.nombre_retenus - 4} autre(s)`}
            </span>
          )}
        </div>
      </div>

      {apercu.nombre_sans_adresse > 0 && (
        <div className="message message--alerte">
          <div>
            <strong>{apercu.nombre_sans_adresse} membre(s) n'ont pas d'adresse e-mail</strong> et
            ne recevront rien. Joignez-les par téléphone ou par WhatsApp.
            <span className="tenu" style={{ display: 'block', marginTop: 4 }}>
              {apercu.sans_adresse.slice(0, 4).map((m) => `${m.nom_complet} (${m.telephone})`).join(' · ')}
              {apercu.nombre_sans_adresse > 4 && ` et ${apercu.nombre_sans_adresse - 4} autre(s)`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- Détail */

function DetailCampagne({ campagne, surFermeture }) {
  const { donnees, chargement } = useRequete(() => courrielService.consulter(campagne.id), [campagne.id]);
  const complet = donnees ?? campagne;

  return (
    <Modale large titre={complet.objet} ouverte surFermeture={surFermeture}>
      <div className="pile">
        <p className="tenu" style={{ margin: 0 }}>
          Envoyé le {formaterDateHeure(complet.date_envoi)}
          {complet.auteur ? ` par ${complet.auteur.nom_affichage}` : ''}
        </p>

        <div className="carte carte--serree" style={{ background: 'var(--surface-douce)', whiteSpace: 'pre-wrap' }}>
          {complet.contenu}
        </div>

        {complet.nombre_sans_adresse > 0 && (
          <div className="message message--alerte">
            {complet.nombre_sans_adresse} membre(s) sans adresse e-mail n'ont pas été destinataires.
          </div>
        )}

        {chargement && <Chargement lignes={3} />}

        {complet.destinataires && (
          <div className="tableau-enveloppe">
            <table className="tableau">
              <thead>
                <tr><th>Membre</th><th>Adresse</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {complet.destinataires.map((destinataire) => (
                  <tr key={destinataire.id}>
                    <td>
                      {destinataire.membre
                        ? `${destinataire.membre.nom} ${destinataire.membre.prenom ?? ''}`
                        : '—'}
                      <span className="tenu chiffre" style={{ display: 'block' }}>
                        {destinataire.membre?.matricule}
                      </span>
                    </td>
                    <td className="silence">{destinataire.adresse}</td>
                    <td>
                      <Etiquette ton={
                        destinataire.statut === 'envoye' ? 'succes'
                          : destinataire.statut === 'echoue' ? 'alerte' : 'attente'
                      }>
                        {{ en_attente: 'En attente', envoye: 'Envoyé', echoue: 'Échoué' }[destinataire.statut]}
                      </Etiquette>
                      {destinataire.message_erreur && (
                        <span className="tenu" style={{ display: 'block' }}>{destinataire.message_erreur}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modale>
  );
}
