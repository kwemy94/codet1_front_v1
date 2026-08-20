import { useState } from 'react';
import Bouton from '@/components/ui/Bouton';
import { formaterMontant } from '@/utils/format';
import './donnees.css';

/**
 * Rapport d'une opération en lot.
 *
 * Les échecs sont montrés d'emblée avec leur motif : c'est la seule
 * information dont le secrétariat a besoin pour reprendre la main. Les
 * réussites, elles, se replient — leur détail n'appelle aucune action.
 */
export default function RapportLot({ rapport, libelleReussite = 'traitée(s)' }) {
  const [detailOuvert, setDetailOuvert] = useState(false);

  if (!rapport) return null;

  const { reussites = [], echecs = [], montant_encaisse: encaisse } = rapport;

  return (
    <div className="pile" style={{ gap: 'var(--e-3)' }}>
      <div className="rapport-lot">
        <span className="rapport-lot__compte rapport-lot__compte--ok">
          {reussites.length}
          <span>{libelleReussite}</span>
        </span>

        {echecs.length > 0 && (
          <span className="rapport-lot__compte rapport-lot__compte--ko">
            {echecs.length}
            <span>en échec</span>
          </span>
        )}

        {encaisse > 0 && (
          <span className="rapport-lot__compte">
            <span className="montant">{formaterMontant(encaisse, { devise: false })}</span>
            <span>encaissés</span>
          </span>
        )}
      </div>

      {echecs.length > 0 && (
        <div className="message message--alerte" style={{ display: 'block' }}>
          <strong>Lignes non traitées</strong>
          <ul className="rapport-lot__liste">
            {echecs.map((echec, index) => (
              <li key={echec.membre_id ?? echec.carte_id ?? index}>
                <span>{echec.nom_complet ?? echec.numero_carte}</span>
                <span className="tenu">{echec.motif}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reussites.length > 0 && (
        <>
          <Bouton variante="discret" taille="petit" onClick={() => setDetailOuvert((o) => !o)}>
            {detailOuvert ? 'Masquer le détail' : 'Voir le détail des opérations réussies'}
          </Bouton>

          {detailOuvert && (
            <ul className="rapport-lot__liste rapport-lot__liste--ok">
              {reussites.map((reussite, index) => (
                <li key={reussite.carte_id ?? reussite.paiement_id ?? index}>
                  <span>{reussite.nom_complet ?? reussite.numero_carte}</span>
                  <span className="tenu chiffre">
                    {reussite.numero_carte ?? reussite.reference}
                    {reussite.montant ? ` · ${formaterMontant(reussite.montant, { devise: false })}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
