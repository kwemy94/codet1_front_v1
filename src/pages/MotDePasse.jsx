import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { appliquerErreursApi } from '@/utils/format';

export default function MotDePasse() {
  const navigation = useNavigate();
  const changer = useAuthStore((etat) => etat.changerMotDePasse);
  const utilisateur = useAuthStore((etat) => etat.utilisateur);
  const premiereFois = Boolean(utilisateur?.doit_changer_mot_de_passe);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const soumettre = async (valeurs) => {
    if (valeurs.nouveau !== valeurs.confirmation) {
      setError('confirmation', { message: 'Les deux saisies ne correspondent pas.' });
      return;
    }

    try {
      const compte = await changer(valeurs);
      notifier.succes('Mot de passe modifié.');
      navigation(compte?.est_administrateur ? '/' : '/mon-espace', { replace: true });
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <Carte titre={premiereFois ? 'Choisissez votre mot de passe' : 'Changer mon mot de passe'}>
        {premiereFois && (
          <p className="silence">
            Vous vous êtes connecté avec le mot de passe provisoire remis par le
            secrétariat. Choisissez maintenant le vôtre : lui seul vous permettra
            d'accéder à votre espace.
          </p>
        )}

        <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
          {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

          <Champ
            label={premiereFois ? 'Mot de passe provisoire' : 'Mot de passe actuel'}
            type="password"
            autoComplete="current-password"
            erreur={errors.ancien?.message}
            {...register('ancien', { required: 'Entrez votre mot de passe actuel.' })}
          />

          <Champ
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            aide="8 caractères au minimum."
            erreur={errors.nouveau?.message}
            {...register('nouveau', {
              required: 'Choisissez un mot de passe.',
              minLength: { value: 8, message: '8 caractères au minimum.' },
            })}
          />

          <Champ
            label="Confirmez le nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            erreur={errors.confirmation?.message}
            {...register('confirmation', { required: 'Ressaisissez le mot de passe.' })}
          />

          <Bouton type="submit" taille="large" chargement={isSubmitting} disabled={!watch('nouveau')}>
            Enregistrer le mot de passe
          </Bouton>
        </form>
      </Carte>
    </div>
  );
}
