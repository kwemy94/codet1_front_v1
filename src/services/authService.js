import httpClient, { extraire } from './httpClient';

export const authService = {
  /** Connexion par adresse e-mail ou numéro de téléphone. */
  async connexion({ identifiant, motDePasse }) {
    const reponse = await httpClient.post('/connexion', {
      identifiant,
      mot_de_passe: motDePasse,
    });
    return extraire(reponse); // { jeton, utilisateur }
  },

  async profil() {
    return extraire(await httpClient.get('/profil'));
  },

  async deconnexion() {
    return extraire(await httpClient.post('/deconnexion'));
  },

  async changerMotDePasse({ ancien, nouveau, confirmation }) {
    return extraire(
      await httpClient.post('/mot-de-passe', {
        ancien_mot_de_passe: ancien,
        nouveau_mot_de_passe: nouveau,
        nouveau_mot_de_passe_confirmation: confirmation,
      }),
    );
  },
};

export default authService;
