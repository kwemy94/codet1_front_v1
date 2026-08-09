import { forwardRef } from 'react';
import './ui.css';

/** Champ de saisie compatible avec React Hook Form (via `ref`). */
export const Champ = forwardRef(function Champ(
  { label, erreur, aide, type = 'text', options, className = '', ...reste },
  ref,
) {
  const classes = `champ ${erreur ? 'champ--invalide' : ''} ${className}`;

  return (
    <label className={classes}>
      {label && <span className="champ__label">{label}</span>}

      {type === 'textarea' && <textarea ref={ref} {...reste} />}

      {type === 'select' && (
        <select ref={ref} {...reste}>
          {options?.map((option) => (
            <option key={option.valeur} value={option.valeur}>
              {option.libelle}
            </option>
          ))}
        </select>
      )}

      {type !== 'textarea' && type !== 'select' && <input ref={ref} type={type} {...reste} />}

      {erreur ? (
        <span className="champ__erreur">{erreur}</span>
      ) : (
        aide && <span className="champ__aide">{aide}</span>
      )}
    </label>
  );
});

export default Champ;
