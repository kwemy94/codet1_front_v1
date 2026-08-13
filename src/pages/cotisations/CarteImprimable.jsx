import { useParams, useNavigate } from 'react-router-dom';
import { carteService } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { useRequete } from '@/hooks/useRequete';
import Bouton from '@/components/ui/Bouton';
import { Chargement, Erreur } from '@/components/ui/Etats';
import { formaterMontant } from '@/utils/format';
import './carte-imprimable.css';

/**
 * Carte unique de développement, recto-verso, au format carte d'identité
 * (85,6 × 54 mm). Le gabarit reproduit la carte physique du groupement : ses
 * couleurs et sa mise en page sont donc celles du document officiel, et non
 * celles de l'application — c'est un titre, pas un écran.
 */
export default function CarteImprimable() {
  const { id } = useParams();
  const navigation = useNavigate();
  const estAdmin = useAuthStore((etat) => etat.estAdministrateur());

  const { donnees, chargement, erreur, recharger } = useRequete(
    () => carteService.donneesImpression(id),
    [id],
  );

  if (chargement && !donnees) return <Chargement lignes={5} />;

  if (erreur) {
    return (
      <div className="pile" style={{ maxWidth: 560 }}>
        <Erreur message={erreur.message} surReessai={recharger} />
        <Bouton variante="contour" onClick={() => navigation(-1)}>Retour</Bouton>
      </div>
    );
  }

  if (!donnees) return null;

  const { carte, membre, mentions } = donnees;
  const civilite = membre.sexe === 'F' ? 'FEMMES' : 'HOMMES';

  return (
    <div className="impression">
      <div className="impression__barre">
        <Bouton variante="contour" onClick={() => navigation(-1)}>Retour</Bouton>
        <Bouton onClick={() => window.print()}>Imprimer la carte</Bouton>
        <p className="tenu impression__conseil">
          Imprimez sur papier épais, puis découpez suivant le cadre. Le recto et le
          verso sortent sur deux pages : utilisez l'impression recto-verso de votre
          imprimante, ou collez les deux faces dos à dos.
        </p>
      </div>

      {estAdmin && (
        <div className="message message--info impression__avertissement">
          Les deux emblèmes sont des reconstitutions provisoires, redessinées d'après
          une photographie de la carte physique. Avant une impression en série,
          remplacez <code>public/logos/</code> par les fichiers officiels de la
          chefferie et du comité supérieur.
        </div>
      )}

      <div className="impression__planche">
        {/* ------------------------------------------------------------ RECTO */}
        <article className="carte-cud carte-cud--recto">
          <header className="cud__entete">
            <img
              className="cud__embleme cud__embleme--gauche"
              src={`${import.meta.env.BASE_URL}logos/chefferie-bangang.svg`}
              alt="Chefferie supérieure de Bangang"
              onError={(evenement) => { evenement.currentTarget.style.visibility = 'hidden'; }}
            />

            <div className="cud__identite">
              <h1 className="cud__sigle">{mentions.sigle}</h1>
              <p className="cud__comite">{mentions.comite}</p>
              <p className="cud__mention">Récépissé {mentions.recepisse}</p>
              <p className="cud__mention">
                Président Tél. : {mentions.tel_president} / Trésorier : {mentions.tel_tresorier}
              </p>
              <p className="cud__mention">
                E-mail : {mentions.email} &nbsp;·&nbsp; Site web : {mentions.site}
              </p>
            </div>

            <div className="cud__annee">
              <img
                className="cud__embleme cud__embleme--droite"
                src={`${import.meta.env.BASE_URL}logos/cosudegbang.svg`}
                alt={mentions.sigle}
                onError={(evenement) => { evenement.currentTarget.style.visibility = 'hidden'; }}
              />
              <span className="cud__slogan">{mentions.slogan}</span>
              <strong>{carte.exercice}</strong>
            </div>
          </header>

          <h2 className="cud__bandeau">CARTE UNIQUE DE DEVELOPPEMENT</h2>

          <div className="cud__corps">
            <span className="cud__onglet">{civilite}</span>

            <dl className="cud__champs">
              <div className="cud__ligne">
                <dt>{mentions.sigle} (montant)</dt>
                <dd className="cud__montant">{formaterMontant(carte.montant_groupement, { devise: false })} Fcfa</dd>
              </div>
              <div className="cud__ligne">
                <dt>Nom(s)</dt>
                <dd className="cud__manuscrit">{membre.nom}</dd>
              </div>
              <div className="cud__ligne">
                <dt>Prénom(s)</dt>
                <dd className="cud__manuscrit">{membre.prenom ?? ''}</dd>
              </div>
              <div className="cud__ligne">
                <dt>Tél.</dt>
                <dd className="cud__manuscrit">{membre.telephone}</dd>
              </div>
              <div className="cud__ligne">
                <dt>Résidence : (Région)</dt>
                <dd className="cud__manuscrit">
                  {membre.region ?? ''} <span className="cud__sous-champ">(Ville)</span> {membre.ville ?? ''}
                </dd>
              </div>
            </dl>
          </div>

          <footer className="cud__signatures">
            <span>
              Le Commissaire aux Comptes
              <strong>{mentions.commissaire}</strong>
            </span>
            <span>
              Le Président
              <strong>{mentions.president}</strong>
            </span>
          </footer>
        </article>

        {/* ------------------------------------------------------------ VERSO */}
        <article className="carte-cud carte-cud--verso">
          <h1 className="cud__groupement">Groupement {mentions.groupement}</h1>

          <p className="cud__numero">
            N° <span>{carte.numero}</span>
          </p>

          <div className="cud__village">
            <span>VILLAGE D'ORIGINE :</span>
            <strong className="cud__manuscrit">{mentions.village}</strong>
          </div>

          <dl className="cud__champs cud__champs--verso">
            <div className="cud__ligne">
              <dt>Montant</dt>
              <dd className="cud__manuscrit">{formaterMontant(carte.montant_total, { devise: false })} F</dd>
            </div>
            <div className="cud__ligne">
              <dt>Nom(s)</dt>
              <dd className="cud__manuscrit">{membre.nom}</dd>
            </div>
            <div className="cud__ligne">
              <dt>Prénom(s)</dt>
              <dd className="cud__manuscrit">{membre.prenom ?? ''}</dd>
            </div>
            <div className="cud__ligne">
              <dt>Tél.</dt>
              <dd className="cud__manuscrit">{membre.telephone}</dd>
            </div>
            <div className="cud__ligne">
              <dt>Résidence : (Région)</dt>
              <dd className="cud__manuscrit">
                {membre.region ?? ''} <span className="cud__sous-champ">(Ville)</span> {membre.ville ?? ''}
              </dd>
            </div>
          </dl>

          <footer className="cud__signature-verso">
            <span>Signature</span>
            <span>Comité de Développement</span>
          </footer>

          <p className="cud__matricule">{membre.matricule}</p>
        </article>
      </div>
    </div>
  );
}
