import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { messageService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useAuthStore } from '@/store/authStore';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import Modale from '@/components/ui/Modale';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import { formaterDateHeure } from '@/utils/format';

export default function Messages() {
  const estAdmin = useAuthStore((etat) => etat.estAdministrateur());
  const [redactionOuverte, setRedactionOuverte] = useState(false);
  const [reponseA, setReponseA] = useState(null);

  const { donnees, chargement, erreur, recharger } = useRequete(() => messageService.lister(), []);
  const messages = donnees?.data ?? [];

  return (
    <div className="pile">
      {!estAdmin && (
        <div className="rang rang--fin">
          <Bouton onClick={() => setRedactionOuverte(true)}>Écrire au comité</Bouton>
        </div>
      )}

      {chargement && <Chargement lignes={4} />}
      {erreur && <Erreur message={erreur.message} surReessai={recharger} />}

      {!chargement && messages.length === 0 && (
        <Carte>
          <Vide
            titre={estAdmin ? 'Aucun message reçu' : "Vous n'avez pas encore écrit au comité"}
            texte={
              estAdmin
                ? 'Les demandes des membres arriveront ici.'
                : 'Une question sur votre cotisation, un changement de coordonnées ? Écrivez au secrétariat.'
            }
            action={!estAdmin && <Bouton onClick={() => setRedactionOuverte(true)}>Écrire au comité</Bouton>}
          />
        </Carte>
      )}

      {messages.map((message) => (
        <Carte key={message.id}>
          <div className="rang rang--entre rang--haut">
            <div>
              <p className="surtitre">
                {message.membre?.nom_complet ?? 'Membre'} · {formaterDateHeure(message.date_envoi)}
              </p>
              <h3>{message.objet}</h3>
            </div>
            <Etiquette statut={message.statut} />
          </div>

          <p className="silence" style={{ marginTop: 'var(--e-3)', whiteSpace: 'pre-wrap' }}>{message.contenu}</p>

          <PiecesJointes message={message} pieces={message.pieces_jointes} />

          {(message.reponses ?? []).map((reponse) => (
            <div
              key={reponse.id}
              className="carte carte--serree"
              style={{ background: 'var(--primaire-voile)', border: 'none', marginTop: 'var(--e-3)' }}
            >
              <p className="surtitre">Réponse du comité · {formaterDateHeure(reponse.date_envoi)}</p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reponse.contenu}</p>

              <PiecesJointes message={reponse} pieces={reponse.pieces_jointes} />
            </div>
          ))}

          {estAdmin && message.statut !== 'traite' && (
            <div className="rang rang--fin" style={{ marginTop: 'var(--e-3)' }}>
              <Bouton variante="contour" taille="petit" onClick={() => setReponseA(message)}>
                Répondre
              </Bouton>
            </div>
          )}
        </Carte>
      ))}

      {redactionOuverte && (
        <ModaleRedaction
          ouverte
          surFermeture={() => setRedactionOuverte(false)}
          surEnvoi={() => {
            setRedactionOuverte(false);
            recharger();
          }}
        />
      )}

      <ModaleReponse
        message={reponseA}
        surFermeture={() => setReponseA(null)}
        surEnvoi={() => {
          setReponseA(null);
          recharger();
        }}
      />
    </div>
  );
}

/** Convertit une taille en octets en une mention lisible. */
function taillePieceJointe(octets) {
  const valeur = Number(octets ?? 0);
  if (!valeur) return '';
  if (valeur < 1024) return `${valeur} o`;
  if (valeur < 1024 * 1024) return `${Math.round(valeur / 1024)} Ko`;
  return `${(valeur / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

const GLYPHES = {
  pdf: 'PDF',
  doc: 'DOC', docx: 'DOC',
  jpg: 'IMG', jpeg: 'IMG', png: 'IMG',
};

/**
 * Pièces jointes d'un message. Le fichier est récupéré en binaire pour que la
 * requête porte le jeton d'authentification : un lien direct ne le ferait pas,
 * et le serveur refuserait l'accès.
 */
function PiecesJointes({ message, pieces }) {
  const [enCours, setEnCours] = useState(null);

  if (!pieces?.length) return null;

  const telecharger = async (piece) => {
    setEnCours(piece.id);
    try {
      await messageService.telechargerPieceJointe(message.id, piece.id, piece.nom_fichier);
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="pieces">
      <p className="surtitre">
        {pieces.length} pièce{pieces.length > 1 ? 's' : ''} jointe{pieces.length > 1 ? 's' : ''}
      </p>

      <ul className="pieces__liste">
        {pieces.map((piece) => {
          const extension = (piece.nom_fichier ?? '').split('.').pop()?.toLowerCase();

          return (
            <li key={piece.id}>
              <button
                type="button"
                className="piece"
                onClick={() => telecharger(piece)}
                disabled={enCours === piece.id}
              >
                <span className="piece__type">{GLYPHES[extension] ?? 'FIC'}</span>
                <span className="piece__nom">
                  {piece.nom_fichier}
                  <span className="tenu">{taillePieceJointe(piece.taille)}</span>
                </span>
                <span className="piece__action">
                  {enCours === piece.id ? <span className="rotation" /> : '↓'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ModaleRedaction({ ouverte, surFermeture, surEnvoi }) {
  const [fichiers, setFichiers] = useState([]);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  const soumettre = async (valeurs) => {
    try {
      await messageService.envoyer(valeurs, fichiers);
      notifier.succes('Message envoyé au comité.');
      reset();
      setFichiers([]);
      surEnvoi?.();
    } catch (erreur) {
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      titre="Écrire au comité"
      ouverte={ouverte}
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>Envoyer</Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <Champ label="Objet" {...register('objet', { required: true })} />
        <Champ label="Message" type="textarea" {...register('contenu', { required: true })} />

        <div className="champ">
          <span className="champ__label">Pièces jointes</span>
          <input type="file" multiple onChange={(e) => setFichiers(Array.from(e.target.files))} />
          <span className="champ__aide">5 fichiers au plus, 10 Mo chacun.</span>
        </div>
      </form>
    </Modale>
  );
}

function ModaleReponse({ message, surFermeture, surEnvoi }) {
  const [fichiers, setFichiers] = useState([]);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  if (!message) return null;

  const soumettre = async ({ contenu }) => {
    try {
      await messageService.repondre(message.id, contenu, fichiers);
      notifier.succes('Réponse envoyée.');
      reset();
      setFichiers([]);
      surEnvoi?.();
    } catch (erreur) {
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      titre={`Répondre — ${message.objet}`}
      ouverte={Boolean(message)}
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>Envoyer la réponse</Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}
        <Champ label="Réponse" type="textarea" {...register('contenu', { required: true })} />

        <div className="champ">
          <span className="champ__label">Pièces jointes</span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(evenement) => setFichiers(Array.from(evenement.target.files))}
          />
          <span className="champ__aide">5 fichiers au plus, 10 Mo chacun.</span>
        </div>
      </form>
    </Modale>
  );
}
