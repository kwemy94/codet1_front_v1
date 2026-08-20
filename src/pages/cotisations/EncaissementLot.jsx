import { useState } from 'react';
import { paiementService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Modale from '@/components/ui/Modale';
import RapportLot from '@/components/donnees/RapportLot';
import { formaterMontant } from '@/utils/format';

/**
 * Encaissement de plusieurs cartes en une opération.
 *
 * Deux modes, qui correspondent à deux situations réelles : régler chaque
 * carte de son solde — le trésorier revient du village avec les espèces — ou
 * appliquer une même somme à toutes, plafonnée au solde, lors d'une collecte
 * uniforme au congrès.
 */
export default function EncaissementLot({ cartes, surFermeture, surEncaissement }) {
  const [moyenPaiementId, setMoyenPaiementId] = useState('');
  const [mode, setMode] = useState('solde');
  const [montant, setMontant] = useState('');
  const [observation, setObservation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [rapport, setRapport] = useState(null);

  const referentiels = useRequete(() => referentielService.tout(), []);

  const moyensHorsLigne = (referentiels.donnees?.moyens_paiement ?? []).filter(
    (moyen) => moyen.type !== 'mobile_money',
  );

  const totalSoldes = cartes.reduce((somme, carte) => somme + Number(carte.solde ?? 0), 0);
  const estimation = mode === 'solde'
    ? totalSoldes
    : cartes.reduce((somme, carte) => somme + Math.min(Number(montant) || 0, Number(carte.solde ?? 0)), 0);

  const encaisser = async () => {
    setEnCours(true);
    try {
      const resultat = await paiementService.encaisserEnLot({
        carteIds: cartes.map((carte) => carte.id),
        moyenPaiementId,
        mode,
        montant: Number(montant),
        observation,
      });
      setRapport(resultat);
      surEncaissement?.();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  const pret = moyenPaiementId && (mode === 'solde' || Number(montant) > 0);

  return (
    <Modale
      large
      titre={rapport ? "Résultat de l'encaissement" : `Encaisser ${cartes.length} carte(s)`}
      ouverte
      surFermeture={surFermeture}
      pied={
        rapport ? (
          <Bouton onClick={surFermeture}>Terminer</Bouton>
        ) : (
          <>
            <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
            <Bouton onClick={encaisser} chargement={enCours} disabled={!pret}>
              Encaisser {formaterMontant(estimation)}
            </Bouton>
          </>
        )
      }
    >
      {rapport ? (
        <RapportLot rapport={rapport} libelleReussite="encaissement(s)" />
      ) : (
        <div className="pile">
          <div className="carte carte--serree" style={{ background: 'var(--surface-douce)' }}>
            <div className="rang rang--entre">
              <span>{cartes.length} carte(s) retenue(s)</span>
              <span className="montant">Reste dû {formaterMontant(totalSoldes)}</span>
            </div>
          </div>

          <div className="onglets">
            <button
              type="button"
              className={`onglet ${mode === 'solde' ? 'onglet--actif' : ''}`}
              onClick={() => setMode('solde')}
            >
              Solder chaque carte
            </button>
            <button
              type="button"
              className={`onglet ${mode === 'montant' ? 'onglet--actif' : ''}`}
              onClick={() => setMode('montant')}
            >
              Même montant pour toutes
            </button>
          </div>

          {mode === 'montant' && (
            <Champ
              label="Montant par carte"
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              aide="Plafonné au solde de chaque carte : aucune ne sera trop-perçue."
            />
          )}

          <Champ
            label="Moyen de paiement"
            type="select"
            value={moyenPaiementId}
            onChange={(e) => setMoyenPaiementId(e.target.value)}
            options={[
              { valeur: '', libelle: 'Choisir un moyen' },
              ...moyensHorsLigne.map((moyen) => ({ valeur: moyen.id, libelle: moyen.libelle })),
            ]}
          />

          <Champ
            label="Observation"
            placeholder="Collecte du congrès du 28 décembre, remise au trésorier…"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            aide="Reportée sur chaque paiement du lot."
          />

          <div className="message message--info">
            Chaque carte est ventilée séparément selon son propre tarif. Une carte déjà
            soldée sera signalée sans interrompre les autres.
          </div>
        </div>
      )}
    </Modale>
  );
}
