import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { paiementService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import Modale from '@/components/ui/Modale';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { appliquerErreursApi, formaterMontant } from '@/utils/format';

/**
 * Paiement mobile money. Après l'initiation, l'écran interroge le statut toutes
 * les 4 secondes : l'opérateur confirme de façon asynchrone, le membre valide
 * la transaction sur son téléphone.
 */
export default function PayerEnLigne({ carte, surFermeture, surSucces }) {
  const [paiement, setPaiement] = useState(null);
  const [statut, setStatut] = useState(null);
  const minuteur = useRef(null);

  const referentiels = useRequete(() => referentielService.tout(), [], { actif: Boolean(carte) });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (carte) {
      reset({ montant: carte.solde, moyenPaiement: 'ORANGE_MONEY' });
      setPaiement(null);
      setStatut(null);
    }
  }, [carte, reset]);

  useEffect(() => {
    if (!paiement) return undefined;

    minuteur.current = setInterval(async () => {
      try {
        const etat = await paiementService.statut(paiement.id);
        setStatut(etat.statut);

        if (etat.statut === 'valide') {
          clearInterval(minuteur.current);
          notifier.succes('Paiement confirmé. Votre reçu est disponible dans vos paiements.');
          surSucces?.();
        }

        if (etat.statut === 'echoue') {
          clearInterval(minuteur.current);
        }
      } catch {
        // une interrogation ratée n'interrompt pas le suivi
      }
    }, 4000);

    return () => clearInterval(minuteur.current);
  }, [paiement, surSucces]);

  if (!carte) return null;

  const soumettre = async (valeurs) => {
    try {
      const resultat = await paiementService.initier({
        carteId: carte.id,
        montant: Number(valeurs.montant),
        moyenPaiement: valeurs.moyenPaiement,
        numeroTelephone: valeurs.numeroTelephone,
      });
      setPaiement(resultat);
      setStatut('initie');
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  const moyensEnLigne = (referentiels.donnees?.moyens_paiement ?? []).filter(
    (moyen) => moyen.type === 'mobile_money',
  );

  return (
    <Modale
      titre="Payer ma cotisation"
      ouverte={Boolean(carte)}
      surFermeture={surFermeture}
      pied={
        !paiement && (
          <>
            <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
            <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>
              Envoyer la demande
            </Bouton>
          </>
        )
      }
    >
      {paiement ? (
        <div className="pile" style={{ textAlign: 'center', padding: 'var(--e-4) 0' }}>
          {statut === 'echoue' ? (
            <>
              <p className="vide__titre">Le paiement n'a pas abouti</p>
              <p className="tenu">
                Aucun montant n'a été débité. Vérifiez votre solde puis relancez la demande.
              </p>
              <Bouton variante="contour" onClick={() => setPaiement(null)}>Réessayer</Bouton>
            </>
          ) : (
            <>
              <span className="rotation" style={{ margin: '0 auto', width: 22, height: 22, color: 'var(--primaire)' }} />
              <p className="vide__titre">Validez sur votre téléphone</p>
              <p className="tenu">
                Une demande de {formaterMontant(paiement.montant)} vient d'être envoyée au{' '}
                {paiement.transaction?.operateur === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Orange Money'}.
                Composez votre code secret pour confirmer. Cette page se met à jour automatiquement.
              </p>
              <p className="chiffre tenu">Référence {paiement.reference}</p>
            </>
          )}
        </div>
      ) : (
        <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
          {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

          <div className="carte carte--serree" style={{ background: 'var(--surface-douce)' }}>
            <div className="rang rang--entre">
              <span className="silence">Reste à régler</span>
              <span className="montant">{formaterMontant(carte.solde)}</span>
            </div>
          </div>

          <Champ
            label="Montant à payer"
            type="number"
            min="100"
            max={carte.solde}
            aide="Vous pouvez payer en plusieurs fois : le solde restera visible ici."
            erreur={errors.montant?.message}
            {...register('montant', { required: 'Indiquez le montant.' })}
          />

          <Champ
            label="Opérateur"
            type="select"
            options={moyensEnLigne.map((moyen) => ({ valeur: moyen.code, libelle: moyen.libelle }))}
            {...register('moyenPaiement', { required: true })}
          />

          <Champ
            label="Numéro à débiter"
            placeholder="+237 6 90 00 00 00"
            erreur={errors.numeroTelephone?.message}
            {...register('numeroTelephone', { required: 'Indiquez le numéro à débiter.' })}
          />
        </form>
      )}
    </Modale>
  );
}
