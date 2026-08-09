import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { exerciceService, rapportAgService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useAuthStore } from '@/store/authStore';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import Modale from '@/components/ui/Modale';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import { formaterDate, appliquerErreursApi } from '@/utils/format';

const TYPES = [
  { valeur: 'proces_verbal', libelle: 'Procès-verbal' },
  { valeur: 'rapport_moral', libelle: 'Rapport moral' },
  { valeur: 'rapport_financier', libelle: 'Rapport financier' },
  { valeur: 'resolutions', libelle: 'Résolutions' },
  { valeur: 'annexe', libelle: 'Annexe' },
];

const LIBELLE_TYPE = Object.fromEntries(TYPES.map((type) => [type.valeur, type.libelle]));

export default function RapportsAg() {
  const estAdmin = useAuthStore((etat) => etat.estAdministrateur());
  const [depotOuvert, setDepotOuvert] = useState(false);

  const { donnees, chargement, erreur, recharger } = useRequete(() => rapportAgService.lister(), []);
  const rapports = donnees?.data ?? [];

  const publier = async (rapport) => {
    try {
      await rapportAgService.publier(rapport.id);
      notifier.succes('Rapport publié — il est visible par tous les membres.');
      recharger();
    } catch (probleme) {
      notifier.alerte(probleme.message);
    }
  };

  const telecharger = async (rapport, document) => {
    try {
      await rapportAgService.telecharger(rapport.id, document.id, document.nom_fichier);
    } catch (probleme) {
      notifier.alerte(probleme.message);
    }
  };

  return (
    <div className="pile">
      {estAdmin && (
        <div className="rang rang--fin">
          <Bouton onClick={() => setDepotOuvert(true)}>Déposer un rapport</Bouton>
        </div>
      )}

      {chargement && <Chargement lignes={5} />}
      {erreur && <Erreur message={erreur.message} surReessai={recharger} />}

      {!chargement && rapports.length === 0 && (
        <Carte>
          <Vide
            titre="Aucun rapport publié pour l'instant"
            texte={
              estAdmin
                ? "Déposez le procès-verbal de la dernière Assemblée Générale, puis publiez-le pour le rendre visible à tous les membres."
                : "Les rapports d'Assemblée Générale seront consultables ici dès leur publication par le comité."
            }
            action={estAdmin && <Bouton onClick={() => setDepotOuvert(true)}>Déposer un rapport</Bouton>}
          />
        </Carte>
      )}

      <div className="pile">
        {rapports.map((rapport) => (
          <Carte key={rapport.id}>
            <div className="rang rang--haut rang--entre" style={{ flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <p className="surtitre">
                  {LIBELLE_TYPE[rapport.type_rapport] ?? rapport.type_rapport} · Exercice{' '}
                  <span className="chiffre">{rapport.exercice?.annee}</span>
                </p>
                <h3>{rapport.intitule}</h3>
                <p className="tenu" style={{ margin: '4px 0 0' }}>
                  Assemblée du {formaterDate(rapport.date_ag)}
                  {rapport.lieu_ag ? ` — ${rapport.lieu_ag}` : ''}
                </p>
              </div>

              <div className="rang">
                <Etiquette statut={rapport.statut} />
                {estAdmin && rapport.statut !== 'publie' && (
                  <Bouton variante="contour" taille="petit" onClick={() => publier(rapport)}>
                    Publier
                  </Bouton>
                )}
              </div>
            </div>

            {rapport.resume && <p className="silence" style={{ marginTop: 'var(--e-3)' }}>{rapport.resume}</p>}

            <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--e-3) 0 0' }} className="pile">
              {(rapport.documents ?? []).map((document) => (
                <li key={document.id} className="rang rang--entre" style={{ gap: 'var(--e-3)' }}>
                  <span className="silence" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    📄 {document.nom_fichier}
                  </span>
                  <Bouton variante="discret" taille="petit" onClick={() => telecharger(rapport, document)}>
                    Télécharger
                  </Bouton>
                </li>
              ))}
            </ul>
          </Carte>
        ))}
      </div>

      {depotOuvert && (
        <ModaleDepot
          ouverte
          surFermeture={() => setDepotOuvert(false)}
          surDepot={() => {
            setDepotOuvert(false);
            recharger();
          }}
        />
      )}
    </div>
  );
}

function ModaleDepot({ ouverte, surFermeture, surDepot }) {
  const exercices = useRequete(() => exerciceService.lister(), [], { actif: ouverte });
  const [fichiers, setFichiers] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const soumettre = async (valeurs) => {
    if (!fichiers.length) {
      setError('root', { message: 'Joignez au moins un fichier au rapport.' });
      return;
    }

    try {
      await rapportAgService.deposer(
        {
          exerciceId: valeurs.exerciceId,
          intitule: valeurs.intitule,
          dateAg: valeurs.dateAg,
          lieu: valeurs.lieu,
          type: valeurs.type,
          resume: valeurs.resume,
        },
        fichiers,
      );
      notifier.succes('Rapport déposé en brouillon. Publiez-le pour le rendre visible.');
      reset();
      setFichiers([]);
      surDepot?.();
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      large
      titre="Déposer un rapport d'Assemblée Générale"
      ouverte={ouverte}
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>
            Déposer en brouillon
          </Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <Champ label="Intitulé" placeholder="Procès-verbal de l'AG ordinaire" {...register('intitule', { required: true })} />

        <div className="grille-2">
          <Champ
            label="Exercice"
            type="select"
            options={(exercices.donnees ?? []).map((exercice) => ({
              valeur: exercice.id,
              libelle: exercice.annee,
            }))}
            {...register('exerciceId', { required: true })}
          />
          <Champ label="Type de document" type="select" options={TYPES} {...register('type', { required: true })} />
        </div>

        <div className="grille-2">
          <Champ label="Date de l'assemblée" type="date" {...register('dateAg', { required: true })} />
          <Champ label="Lieu" placeholder="Tchuelekouet I" {...register('lieu')} />
        </div>

        <Champ label="Résumé" type="textarea" placeholder="Points principaux et résolutions adoptées." {...register('resume')} />

        <div className="champ">
          <span className="champ__label">Pièces jointes</span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(evenement) => setFichiers(Array.from(evenement.target.files))}
          />
          <span className="champ__aide">
            PDF, Word ou images — 20 Mo par fichier. Les pièces deviennent publiques à la publication.
          </span>
        </div>
      </form>
    </Modale>
  );
}
