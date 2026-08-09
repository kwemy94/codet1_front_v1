import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { paiementService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import Modale from '@/components/ui/Modale';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { appliquerErreursApi, formaterMontant } from '@/utils/format';

/** Saisie d'un encaissement effectué hors ligne (espèces, virement). */
export default function PaiementManuel({ carte, surFermeture, surEnregistrement }) {
  const referentiels = useRequete(() => referentielService.tout(), [], { actif: Boolean(carte) });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (carte) reset({ montant: carte.solde, observation: '' });
  }, [carte, reset]);

  if (!carte) return null;

  const soumettre = async (valeurs) => {
    try {
      await paiementService.enregistrerManuel({
        carteId: carte.id,
        moyenPaiementId: valeurs.moyenPaiementId,
        montant: Number(valeurs.montant),
        observation: valeurs.observation,
      });
      notifier.succes(`Paiement de ${formaterMontant(valeurs.montant)} enregistré et ventilé.`);
      surEnregistrement?.();
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  const moyensHorsLigne = (referentiels.donnees?.moyens_paiement ?? []).filter(
    (moyen) => moyen.type !== 'mobile_money',
  );

  return (
    <Modale
      titre="Encaisser un paiement"
      ouverte={Boolean(carte)}
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>
            Enregistrer le paiement
          </Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <div className="carte carte--serree" style={{ background: 'var(--surface-douce)' }}>
          <div className="rang rang--entre">
            <span>
              <strong>{carte.membre?.nom_complet}</strong>
              <span className="tenu chiffre" style={{ display: 'block' }}>{carte.numero_carte}</span>
            </span>
            <span className="montant">Solde {formaterMontant(carte.solde)}</span>
          </div>
        </div>

        <Champ
          label="Montant encaissé"
          type="number"
          min="1"
          max={carte.solde}
          aide="Un paiement partiel est accepté : le solde restera dû."
          erreur={errors.montant?.message}
          {...register('montant', { required: 'Indiquez le montant encaissé.' })}
        />

        <Champ
          label="Moyen de paiement"
          type="select"
          options={moyensHorsLigne.map((moyen) => ({ valeur: moyen.id, libelle: moyen.libelle }))}
          {...register('moyenPaiementId', { required: true })}
        />

        <Champ
          label="Observation"
          type="textarea"
          placeholder="Reçu manuel n° 42, remis au trésorier…"
          {...register('observation')}
        />
      </form>
    </Modale>
  );
}
