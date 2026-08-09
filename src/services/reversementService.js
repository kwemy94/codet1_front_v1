import httpClient, { extraire } from './httpClient';

/** Reversement annuel de 20 % au CODET I. */
export const reversementService = {
  async lister() {
    return extraire(await httpClient.get('/reversements'));
  },

  async consulter(exerciceId) {
    return extraire(await httpClient.get(`/exercices/${exerciceId}/reversement`));
  },

  /** Simulation sans écriture : utilisable à tout moment de l'année. */
  async simuler(exerciceId) {
    return extraire(await httpClient.get(`/exercices/${exerciceId}/reversement/simulation`));
  },

  async calculer(exerciceId) {
    return extraire(await httpClient.post(`/exercices/${exerciceId}/reversement/calculer`));
  },
};

export default reversementService;
