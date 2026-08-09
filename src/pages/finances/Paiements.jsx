import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exerciceService, paiementService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { Carte } from '@/components/ui/Carte';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import Modale from '@/components/ui/Modale';
import Pagination from '@/components/ui/Pagination';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import RubanVentilation from '@/components/donnees/RubanVentilation';
import { formaterDateHeure, formaterMontant } from '@/utils/format';

export default function Paiements() {
  const [parametres, setParametres] = useSearchParams();
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);

  const statut = parametres.get('statut') ?? '';
  const membreId = parametres.get('membre_id') ?? '';
  const exerciceId = parametres.get('exercice_id') ?? '';

  const exercices = useRequete(() => exerciceService.lister(), []);

  const filtres = useMemo(
    () => ({
      statut: statut || undefined,
      membre_id: membreId || undefined,
      exercice_id: exerciceId || undefined,
      page,
    }),
    [statut, membreId, exerciceId, page],
  );

  const { donnees, chargement, erreur, recharger } = useRequete(
    () => paiementService.lister(filtres),
    [filtres],
  );

  const paiements = donnees?.data ?? [];

  const changerFiltre = (cle) => (evenement) => {
    const suivant = new URLSearchParams(parametres);
    if (evenement.target.value) suivant.set(cle, evenement.target.value);
    else suivant.delete(cle);
    setParametres(suivant);
    setPage(1);
  };

  return (
    <div className="pile">
      <Carte serree>
        <div className="rang" style={{ flexWrap: 'wrap' }}>
          <Champ
            type="select"
            value={statut}
            onChange={changerFiltre('statut')}
            aria-label="Statut du paiement"
            options={[
              { valeur: '', libelle: 'Tous les statuts' },
              { valeur: 'valide', libelle: 'Validés' },
              { valeur: 'initie', libelle: 'En attente' },
              { valeur: 'echoue', libelle: 'Échoués' },
            ]}
          />
          <Champ
            type="select"
            value={exerciceId}
            onChange={changerFiltre('exercice_id')}
            aria-label="Exercice"
            options={[
              { valeur: '', libelle: 'Tous les exercices' },
              ...(exercices.donnees ?? []).map((exercice) => ({
                valeur: exercice.id,
                libelle: `Exercice ${exercice.annee}`,
              })),
            ]}
          />
        </div>
      </Carte>

      <Carte className="carte--nue">
        {chargement && <div style={{ padding: 'var(--e-5)' }}><Chargement /></div>}
        {erreur && <div style={{ padding: 'var(--e-4)' }}><Erreur message={erreur.message} surReessai={recharger} /></div>}

        {!chargement && !erreur && paiements.length === 0 && (
          <Vide titre="Aucun paiement" texte="Les encaissements apparaîtront ici dès le premier règlement." />
        )}

        {!chargement && paiements.length > 0 && (
          <>
            <div className="tableau-enveloppe">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Membre</th>
                    <th>Objet</th>
                    <th>Moyen</th>
                    <th className="col-nombre">Montant</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.map((paiement) => (
                    <tr
                      key={paiement.id}
                      onClick={() => setDetail(paiement)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="chiffre">{paiement.reference}</td>
                      <td>{paiement.membre?.nom_complet ?? '—'}</td>
                      <td className="silence">
                        {paiement.objet === 'carte_annuelle' ? 'Carte annuelle' : 'Contribution'}
                      </td>
                      <td className="silence">{paiement.moyen_paiement}</td>
                      <td className="col-nombre montant">{formaterMontant(paiement.montant, { devise: false })}</td>
                      <td className="silence chiffre">{formaterDateHeure(paiement.date_paiement)}</td>
                      <td><Etiquette statut={paiement.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={donnees?.meta} surChangement={setPage} />
          </>
        )}
      </Carte>

      {detail && <DetailPaiement paiement={detail} surFermeture={() => setDetail(null)} />}
    </div>
  );
}

function DetailPaiement({ paiement, surFermeture }) {
  const { donnees, chargement } = useRequete(() => paiementService.consulter(paiement.id), [paiement.id]);
  const complet = donnees ?? paiement;

  const parts = Object.fromEntries(
    (complet.affectations ?? []).map((affectation) => [affectation.destination, affectation.montant]),
  );

  return (
    <Modale titre={`Paiement ${complet.reference}`} ouverte surFermeture={surFermeture}>
      <div className="pile">
        <div className="rang rang--entre">
          <span className="montant montant--fort">{formaterMontant(complet.montant)}</span>
          <Etiquette statut={complet.statut} />
        </div>

        {chargement && <Chargement lignes={3} />}

        <div className="grille-2">
          <div>
            <p className="tenu">Membre</p>
            <p>{complet.membre?.nom_complet ?? '—'}</p>
          </div>
          <div>
            <p className="tenu">Moyen de paiement</p>
            <p>{complet.moyen_paiement ?? '—'}</p>
          </div>
        </div>

        {complet.transaction && (
          <div className="message message--info">
            Transaction {complet.transaction.operateur} — {complet.transaction.statut}
            {complet.transaction.reference_operateur && (
              <span className="chiffre"> · {complet.transaction.reference_operateur}</span>
            )}
          </div>
        )}

        <div>
          <p className="surtitre">Ventilation</p>
          <RubanVentilation parts={parts} hauteur={10} />
        </div>

        {complet.recu && (
          <p className="tenu">
            Reçu <span className="chiffre">{complet.recu.numero}</span> émis le{' '}
            {formaterDateHeure(complet.recu.date_emission)}
          </p>
        )}
      </div>
    </Modale>
  );
}
