import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { membreService, referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import Modale from '@/components/ui/Modale';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { appliquerErreursApi } from '@/utils/format';

const schema = yup.object({
  nom: yup.string().trim().required('Le nom est obligatoire.'),
  prenom: yup.string().trim().nullable(),
  sexe: yup.string().oneOf(['M', 'F'], 'Choisissez le sexe.').required(),
  telephone: yup.string().trim().required('Le téléphone est obligatoire.'),
  email: yup.string().email("L'adresse e-mail n'est pas valide.").nullable().transform((v) => v || null),
  categorie_membre_id: yup.string().required('La catégorie est obligatoire.'),
  date_naissance: yup.string().nullable(),
  profession: yup.string().nullable(),
  ville_id: yup.string().nullable(),
  quartier: yup.string().nullable(),
  adresse: yup.string().nullable(),
});

const VALEURS_INITIALES = {
  nom: '',
  prenom: '',
  sexe: 'M',
  date_naissance: '',
  profession: '',
  telephone: '',
  email: '',
  categorie_membre_id: '',
  ville_id: '',
  quartier: '',
  adresse: '',
};

/** Création d'un membre. Le matricule est attribué par le serveur. */
export default function FormulaireMembre({ ouvert, surFermeture, surEnregistrement, referentiels }) {
  const villes = useRequete(() => referentielService.villes(), [], { actif: ouvert });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: VALEURS_INITIALES,
  });

  // Le composant n'est monté qu'à l'ouverture : ce nettoyage est une sécurité
  // supplémentaire si la modale venait à être réutilisée sans démontage.
  useEffect(() => {
    if (ouvert) reset(VALEURS_INITIALES);
  }, [ouvert, reset]);

  const soumettre = async (valeurs) => {
    try {
      const membre = await membreService.creer(valeurs);
      notifier.succes(`${membre.nom_complet} est enregistré — matricule ${membre.matricule}.`);
      surEnregistrement?.(membre);
    } catch (erreur) {
      appliquerErreursApi(erreur.erreurs, setError);
      setError('root', { message: erreur.message });
    }
  };

  return (
    <Modale
      large
      titre="Nouveau membre"
      ouverte={ouvert}
      surFermeture={surFermeture}
      pied={
        <>
          <Bouton variante="contour" onClick={surFermeture}>Annuler</Bouton>
          <Bouton onClick={handleSubmit(soumettre)} chargement={isSubmitting}>
            Enregistrer le membre
          </Bouton>
        </>
      }
    >
      <form className="pile" onSubmit={handleSubmit(soumettre)} noValidate>
        {errors.root && <div className="message message--alerte">{errors.root.message}</div>}

        <p className="tenu" style={{ margin: 0 }}>
          Le matricule est attribué automatiquement au format COD26-000125.
        </p>

        <div className="grille-2">
          <Champ label="Nom" erreur={errors.nom?.message} {...register('nom')} />
          <Champ label="Prénom" erreur={errors.prenom?.message} {...register('prenom')} />
        </div>

        <div className="grille-2">
          <Champ
            label="Sexe"
            type="select"
            erreur={errors.sexe?.message}
            options={[
              { valeur: 'M', libelle: 'Masculin' },
              { valeur: 'F', libelle: 'Féminin' },
            ]}
            {...register('sexe')}
          />
          <Champ label="Date de naissance" type="date" {...register('date_naissance')} />
        </div>

        <Champ
          label="Catégorie"
          type="select"
          erreur={errors.categorie_membre_id?.message}
          aide="Elle détermine le montant de la carte annuelle."
          options={[
            { valeur: '', libelle: 'Choisir une catégorie' },
            ...(referentiels?.categories_membres ?? []).map((categorie) => ({
              valeur: categorie.id,
              libelle: categorie.libelle,
            })),
          ]}
          {...register('categorie_membre_id')}
        />

        <div className="grille-2">
          <Champ label="Téléphone" erreur={errors.telephone?.message} placeholder="+237 6 00 00 00 00" {...register('telephone')} />
          <Champ label="E-mail" type="email" erreur={errors.email?.message} {...register('email')} />
        </div>

        <div className="grille-2">
          <Champ label="Profession" {...register('profession')} />
          <Champ
            label="Ville"
            type="select"
            options={[
              { valeur: '', libelle: 'Choisir une ville' },
              ...(villes.donnees ?? []).map((ville) => ({ valeur: ville.id, libelle: ville.libelle })),
            ]}
            {...register('ville_id')}
          />
        </div>

        <div className="grille-2">
          <Champ label="Quartier" {...register('quartier')} />
          <Champ label="Adresse" {...register('adresse')} />
        </div>
      </form>
    </Modale>
  );
}
