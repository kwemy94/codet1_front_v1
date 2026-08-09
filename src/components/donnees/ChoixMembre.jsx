import { useState } from 'react';
import { membreService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useDebounce } from '@/hooks/useDebounce';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import './donnees.css';

/**
 * Recherche et sélection d'un membre.
 *
 * On ne demande jamais son identifiant technique : le secrétariat connaît le
 * matricule ou le nom, pas la clé primaire. Le composant renvoie l'identifiant
 * au formulaire une fois le membre choisi dans la liste.
 */
export default function ChoixMembre({ membre, surChoix, label = 'Membre', erreur }) {
  const [terme, setTerme] = useState('');
  const termeRetarde = useDebounce(terme);
  const rechercheActive = termeRetarde.trim().length >= 2;

  const { donnees, chargement } = useRequete(
    () => membreService.lister({ recherche: termeRetarde.trim(), par_page: 8, statut: 'actif' }),
    [termeRetarde],
    { actif: rechercheActive },
  );

  const resultats = donnees?.data ?? [];

  if (membre) {
    return (
      <div className="champ">
        <span className="champ__label">{label}</span>
        <div className="choix-membre__retenu">
          <span style={{ minWidth: 0 }}>
            <strong>{membre.nom_complet}</strong>
            <span className="tenu chiffre" style={{ display: 'block' }}>{membre.matricule}</span>
          </span>
          <Bouton variante="discret" taille="petit" onClick={() => { surChoix(null); setTerme(''); }}>
            Changer
          </Bouton>
        </div>
      </div>
    );
  }

  return (
    <div className="champ">
      <Champ
        label={label}
        placeholder="Matricule, nom ou téléphone…"
        value={terme}
        onChange={(evenement) => setTerme(evenement.target.value)}
        aide="Saisissez au moins deux caractères, puis choisissez dans la liste."
        erreur={erreur}
      />

      {rechercheActive && (
        <div className="choix-membre__liste">
          {chargement && <p className="tenu" style={{ padding: '8px 12px', margin: 0 }}>Recherche…</p>}

          {!chargement && resultats.length === 0 && (
            <p className="tenu" style={{ padding: '8px 12px', margin: 0 }}>
              Aucun membre actif ne correspond.
            </p>
          )}

          {resultats.map((resultat) => (
            <button
              key={resultat.id}
              type="button"
              className="choix-membre__option"
              onClick={() => surChoix(resultat)}
            >
              <span>{resultat.nom_complet}</span>
              <span className="tenu chiffre">{resultat.matricule}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
