import { Link } from 'react-router-dom';
import { Carte } from '@/components/ui/Carte';
import { Vide } from '@/components/ui/Etats';

export default function NonTrouve() {
  return (
    <Carte>
      <Vide
        titre="Cette page n'existe pas"
        texte="Le lien est peut-être ancien ou mal recopié."
        action={<Link to="/" className="bouton bouton--principal">Revenir au tableau de bord</Link>}
      />
    </Carte>
  );
}
