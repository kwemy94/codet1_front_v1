import { useState } from 'react';
import { membreService } from '@/services';
import { notifier } from '@/store/notificationStore';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Modale from '@/components/ui/Modale';

/**
 * Changement de statut d'un membre.
 *
 * Un membre n'est jamais supprimé : ses cotisations et ses dons restent aux
 * comptes du comité. La suspension est réversible et toujours motivée ; le
 * décès est un constat distinct, qui ne se lève pas.
 */
export default function StatutMembre({ membre, surChangement }) {
  const [action, setAction] = useState(null); // 'suspendre' | 'reactiver' | 'deces'
  const [motif, setMotif] = useState('');
  const [dateDeces, setDateDeces] = useState('');
  const [enCours, setEnCours] = useState(false);

  const fermer = () => {
    setAction(null);
    setMotif('');
    setDateDeces('');
  };

  const executer = async () => {
    setEnCours(true);
    try {
      if (action === 'suspendre') {
        await membreService.suspendre(membre.id, motif);
        notifier.succes(`${membre.nom_complet} est suspendu.`);
      } else if (action === 'reactiver') {
        await membreService.reactiver(membre.id, motif || null);
        notifier.succes(`${membre.nom_complet} est réactivé.`);
      } else {
        await membreService.declarerDecede(membre.id, dateDeces || null);
        notifier.succes('Statut enregistré.');
      }
      fermer();
      surChangement?.();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  if (membre.statut === 'decede') {
    return null;
  }

  const textes = {
    suspendre: {
      titre: 'Suspendre ce membre',
      explication:
        "Le membre sort des listes actives, son accès est fermé et il ne reçoit plus "
        + "d'appel à cotisation. Ses cotisations et ses dons passés restent aux comptes "
        + "du comité. Cette décision est réversible à tout moment.",
      action: 'Suspendre',
    },
    reactiver: {
      titre: 'Réactiver ce membre',
      explication:
        "Le membre retrouve sa place dans les listes et son accès à l'espace personnel. "
        + 'Il pourra de nouveau se voir émettre une carte.',
      action: 'Réactiver',
    },
    deces: {
      titre: 'Enregistrer le décès',
      explication:
        "Le membre est retiré des appels à cotisation et des envois. Sa fiche et son "
        + "historique sont conservés. Ce statut ne se lève pas : en cas d'erreur, il "
        + 'faudra corriger la fiche du membre.',
      action: 'Enregistrer',
    },
  }[action] ?? {};

  return (
    <>
      <div className="rang" style={{ gap: 'var(--e-1)' }}>
        {membre.statut === 'actif' ? (
          <Bouton variante="discret" taille="petit" onClick={() => setAction('suspendre')}>
            Suspendre
          </Bouton>
        ) : (
          <Bouton variante="contour" taille="petit" onClick={() => setAction('reactiver')}>
            Réactiver
          </Bouton>
        )}

        <Bouton variante="discret" taille="petit" onClick={() => setAction('deces')}>
          Décès
        </Bouton>
      </div>

      <Modale
        titre={textes.titre}
        ouverte={Boolean(action)}
        surFermeture={fermer}
        pied={
          <>
            <Bouton variante="contour" onClick={fermer}>Annuler</Bouton>
            <Bouton
              variante={action === 'suspendre' ? 'danger' : 'principal'}
              onClick={executer}
              chargement={enCours}
              disabled={action === 'suspendre' && motif.trim().length < 3}
            >
              {textes.action}
            </Bouton>
          </>
        }
      >
        <div className="pile">
          <div className="carte carte--serree" style={{ background: 'var(--surface-douce)' }}>
            <strong>{membre.nom_complet}</strong>
            <span className="tenu chiffre" style={{ display: 'block' }}>{membre.matricule}</span>
          </div>

          <p className="silence" style={{ margin: 0 }}>{textes.explication}</p>

          {membre.motif_statut && action === 'reactiver' && (
            <div className="message message--info">
              Suspendu le {membre.date_changement_statut} — motif : {membre.motif_statut}
            </div>
          )}

          {action === 'suspendre' && (
            <Champ
              label="Motif de la suspension"
              type="textarea"
              placeholder="Départ du groupement, demande du membre, décision du bureau du 12 mars…"
              aide="Obligatoire : six mois plus tard, personne ne se souviendra de la raison."
              value={motif}
              onChange={(evenement) => setMotif(evenement.target.value)}
            />
          )}

          {action === 'reactiver' && (
            <Champ
              label="Observation (facultatif)"
              placeholder="Retour au village, régularisation…"
              value={motif}
              onChange={(evenement) => setMotif(evenement.target.value)}
            />
          )}

          {action === 'deces' && (
            <Champ
              label="Date du décès (facultatif)"
              type="date"
              value={dateDeces}
              onChange={(evenement) => setDateDeces(evenement.target.value)}
            />
          )}
        </div>
      </Modale>
    </>
  );
}
