import { useMemo, useState } from 'react';
import { journalService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useDebounce } from '@/hooks/useDebounce';
import { Carte } from '@/components/ui/Carte';
import Champ from '@/components/ui/Champ';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import { formaterDateHeure } from '@/utils/format';

export default function Journal() {
  const [typeAction, setTypeAction] = useState('');
  const typeRetarde = useDebounce(typeAction);

  const filtres = useMemo(() => ({ type_action: typeRetarde || undefined }), [typeRetarde]);
  const { donnees, chargement, erreur, recharger } = useRequete(
    () => journalService.lister(filtres),
    [filtres],
  );

  const actions = donnees?.data ?? [];

  return (
    <div className="pile">
      <Carte serree>
        <Champ
          placeholder="Filtrer par action : connexion, paiement_valide…"
          value={typeAction}
          onChange={(evenement) => setTypeAction(evenement.target.value)}
          aria-label="Filtrer les actions"
        />
      </Carte>

      <Carte className="carte--nue">
        {chargement && <div style={{ padding: 'var(--e-5)' }}><Chargement /></div>}
        {erreur && <div style={{ padding: 'var(--e-4)' }}><Erreur message={erreur.message} surReessai={recharger} /></div>}

        {!chargement && actions.length === 0 && (
          <Vide titre="Aucune action enregistrée" texte="Le journal se remplit dès la première opération." />
        )}

        {actions.length > 0 && (
          <div className="tableau-enveloppe">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Date et heure</th>
                  <th>Action</th>
                  <th>Objet</th>
                  <th>Auteur</th>
                  <th>Membre concerné</th>
                  <th>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.id}>
                    <td className="chiffre silence">{formaterDateHeure(action.date_heure)}</td>
                    <td>{action.type_action}</td>
                    <td className="silence">
                      {action.entite_concernee}
                      {action.identifiant_enregistrement ? ` #${action.identifiant_enregistrement}` : ''}
                    </td>
                    <td className="silence">{action.auteur?.nom_affichage ?? '—'}</td>
                    <td className="silence">
                      {action.membre ? `${action.membre.nom} ${action.membre.prenom ?? ''}` : '—'}
                    </td>
                    <td className="chiffre tenu">{action.adresse_ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </div>
  );
}
