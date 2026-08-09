import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import CONFIG from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { appliquerErreursApi } from '@/utils/format';
import './connexion.css';

const schema = yup.object({
  identifiant: yup.string().trim().required('Entrez votre e-mail ou votre numéro de téléphone.'),
  motDePasse: yup.string().required('Entrez votre mot de passe.'),
});

export default function Connexion() {
  const navigation = useNavigate();
  const emplacement = useLocation();
  const connexion = useAuthStore((etat) => etat.connexion);
  const jeton = useAuthStore((etat) => etat.jeton);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  if (jeton) return <Navigate to="/" replace />;

  const soumettre = async (valeurs) => {
    try {
      const utilisateur = await connexion(valeurs);
      const destination = emplacement.state?.depuis
        ?? (utilisateur?.est_administrateur ? '/' : '/mon-espace');
      navigation(destination, { replace: true });
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  return (
    <div className="accueil">
      <section className="accueil__recit">
        <span className="accueil__sceau">CD</span>
        <h1 className="accueil__titre">
          Le registre du comité,
          <br />
          tenu à jour par tous.
        </h1>
        <p className="accueil__texte">
          Cotisations annuelles, contributions volontaires, reçus et rapports d'Assemblée
          Générale — au village, en ville ou depuis la diaspora.
        </p>

        <ul className="accueil__parts">
          <li><span style={{ background: 'var(--village)' }} />Développement du village</li>
          <li><span style={{ background: 'var(--groupement)' }} />Développement du groupement</li>
          <li><span style={{ background: 'var(--congres)' }} />Congrès annuel</li>
        </ul>
      </section>

      <section className="accueil__formulaire">
        <form className="carte pile" onSubmit={handleSubmit(soumettre)} noValidate>
          <div>
            <p className="surtitre">{CONFIG.NOM_COMITE}</p>
            <h2>Connexion</h2>
          </div>

          {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

          <Champ
            label="E-mail ou téléphone"
            placeholder="+237 6 00 00 00 00"
            autoComplete="username"
            erreur={errors.identifiant?.message}
            {...register('identifiant')}
          />

          <Champ
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            erreur={errors.motDePasse?.message}
            {...register('motDePasse')}
          />

          <Bouton type="submit" taille="large" chargement={isSubmitting}>
            Se connecter
          </Bouton>

          <p className="tenu" style={{ margin: 0 }}>
            Mot de passe oublié ? Le secrétariat du comité peut le réinitialiser.
          </p>
        </form>
      </section>
    </div>
  );
}
