import httpClient, { extraire } from './httpClient';

export const exerciceService = {
  async lister() {
    return extraire(await httpClient.get('/exercices'));
  },

  async courant() {
    return extraire(await httpClient.get('/exercices/courant'));
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/exercices/${id}`));
  },

  async ouvrir({ annee, dateDebut, dateFin }) {
    return extraire(
      await httpClient.post('/exercices', {
        annee,
        date_debut: dateDebut,
        date_fin: dateFin,
      }),
    );
  },

  /** Clôture l'exercice et fige le reversement annuel. Action irréversible. */
  async cloturer(id) {
    return extraire(await httpClient.post(`/exercices/${id}/cloturer`));
  },
};

export default exerciceService;
