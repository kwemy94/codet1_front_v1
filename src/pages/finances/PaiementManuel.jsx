import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { paiementService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import Modale from '@/components/ui/Modale';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { appliquerErreursApi, formaterMontant } from '@/utils/format';

/**
 * Saisie d'un encaissement effectué hors ligne (espèces, virement).
 *
 * Le même écran règle une carte annuelle ou une contribution financière : côté
 * serveur, un paiement porte l'un ou l'autre, jamais les deux. Passez donc soit
 * `carte`, soit `contribution`.
 */
export default function PaiementManuel({ carte, contribution, surFermeture, surEnregistrement }) {
  const objet = useMemo(() => {
    if (carte) {
      return {
        genre: 'carte',
        titre: carte.membre?.nom_complet ?? 'Carte annuelle',
        reference: carte.numero_carte,
        solde: carte.solde,
        charge: { carteId: carte.id },
        aide: 'Un paiement partiel est accepté : le solde restera dû.',
      };
    }

    if (contribution) {
      const regle = Number(contribution.montant_regle ?? 0);

      return {
        genre: 'contribution',
        titre:
          contribution.membre?.nom_complet
          ?? contribution.donateur?.denomination
          ?? 'Contribution',
        reference: contribution.reference,
        solde: Number(contribution.solde ?? contribution.montant - regle),
        charge: { contributionId: contribution.id },
        aide: "La contribution passe au statut « encaissée » dès que la totalité est entrée en caisse.",
      };
    }

    return null;
  }, [carte, contribution]);

  const referentiels = useRequete(() => referentielService.tout(), [], { actif: Boolean(objet) });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (objet) reset({ montant: objet.solde, observation: '' });
  }, [objet, reset]);

  if (!objet) return null;

  const soumettre = async (valeurs) => {
    try {
      await paiementService.enregistrerManuel({
        ...objet.charge,
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
      titre={objet.genre === 'carte' ? 'Encaisser une carte' : 'Encaisser une contribution'}
      ouverte
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
            <span style={{ minWidth: 0 }}>
              <strong>{objet.titre}</strong>
              <span className="tenu chiffre" style={{ display: 'block' }}>{objet.reference}</span>
            </span>
            <span className="montant">Reste {formaterMontant(objet.solde)}</span>
          </div>
        </div>

        <Champ
          label="Montant encaissé"
          type="number"
          min="1"
          max={objet.solde}
          aide={objet.aide}
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
