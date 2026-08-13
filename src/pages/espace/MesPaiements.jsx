import { useState } from 'react';
import { espaceMembreService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { Carte } from '@/components/ui/Carte';
import Etiquette from '@/components/ui/Etiquette';
import Pagination from '@/components/ui/Pagination';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import RubanVentilation from '@/components/donnees/RubanVentilation';
import { formaterDateHeure, formaterMontant } from '@/utils/format';

export default function MesPaiements() {
  const [page, setPage] = useState(1);
  const { donnees, chargement, erreur, recharger } = useRequete(
    () => espaceMembreService.mesPaiements(page),
    [page],
  );

  const paiements = donnees?.data ?? [];

  if (chargement && !donnees) return <Chargement lignes={5} />;
  if (erreur) return <Erreur message={erreur.message} surReessai={recharger} />;

  if (!paiements.length) {
    return (
      <Carte>
        <Vide
          titre="Aucun paiement enregistré"
          texte="Vos règlements et vos reçus apparaîtront ici, y compris ceux encaissés en espèces par le trésorier."
        />
      </Carte>
    );
  }

  return (
    <div className="pile">
      {paiements.map((paiement) => {
        const parts = Object.fromEntries(
          (paiement.affectations ?? []).map((affectation) => [affectation.destination, affectation.montant]),
        );

        return (
          <Carte key={paiement.id}>
            <div className="rang rang--entre" style={{ flexWrap: 'wrap', gap: 'var(--e-3)' }}>
              <div>
                <p className="surtitre chiffre">{paiement.reference}</p>
                <span className="montant montant--fort" style={{ fontSize: 'var(--t-lg)' }}>
                  {formaterMontant(paiement.montant)}
                </span>
                <p className="tenu" style={{ margin: 0 }}>
                  {formaterDateHeure(paiement.date_paiement)} · {paiement.moyen_paiement}
                </p>
              </div>

              <div className="rang">
                <Etiquette statut={paiement.statut} />
                {paiement.recu && <span className="tenu chiffre">Reçu {paiement.recu.numero}</span>}
              </div>
            </div>

            {Object.keys(parts).length > 0 && (
              <div style={{ marginTop: 'var(--e-4)' }}>
                <RubanVentilation parts={parts} hauteur={7} compact />
              </div>
            )}
          </Carte>
        );
      })}

      <Pagination meta={donnees?.meta} surChangement={setPage} />
    </div>
  );
}
