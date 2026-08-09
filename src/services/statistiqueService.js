import httpClient, { extraire } from './httpClient';

export const statistiqueService = {
  async tableauDeBord(exerciceId) {
    return extraire(
      await httpClient.get('/statistiques/tableau-de-bord', {
        params: exerciceId ? { exercice_id: exerciceId } : {},
      }),
    );
  },

  async evolutionRecettes() {
    return extraire(await httpClient.get('/statistiques/evolution-recettes'));
  },
};

export default statistiqueService;
