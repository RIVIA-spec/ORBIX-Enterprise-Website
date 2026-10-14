import { useMemo, useState } from 'react';
import { COUNTRY_OPTIONS } from '../../lib/countries';
import { countryFlag, countryName, useTranslation } from '../../lib/i18n';

type CountryDialCodePickerProps = {
  value: string;
  onChange: (phoneCode: string) => void;
  label?: string;
};

export function CountryDialCodePicker({ value, onChange, label }: CountryDialCodePickerProps) {
  const { t, language, direction } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = COUNTRY_OPTIONS.find((country) => country.phoneCode === value) || COUNTRY_OPTIONS[0];

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((country) =>
      [countryName(country.code, language), country.code, country.phoneCode].some((item) => item.toLowerCase().includes(query)),
    );
  }, [language, search]);

  const chooseCountry = (phoneCode: string) => {
    onChange(phoneCode);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="country-dial-picker" dir={direction} lang={language}>
      <span className="field-label">{label || t('countryDial.label')}</span>
      <button type="button" className="country-dial-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span>{countryFlag(selected.code)}</span>
        <strong>{countryName(selected.code, language)}</strong>
        <bdi>{selected.phoneCode}</bdi>
        <span aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="country-dial-backdrop" onClick={() => setOpen(false)}>
          <section
            className="country-dial-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t('countryDial.choose')}
            onClick={(event) => event.stopPropagation()}
            dir={direction}
            lang={language}
          >
            <header>
              <h2>{t('countryDial.choose')}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close')}>
                ×
              </button>
            </header>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('common.searchCountry')}
              autoFocus
              dir={direction}
              lang={language}
            />
            <div className="country-dial-list">
              {filteredCountries.map((country) => (
                <button key={country.code} type="button" className={country.phoneCode === value ? 'is-selected' : ''} onClick={() => chooseCountry(country.phoneCode)}>
                  <span>{countryFlag(country.code)}</span>
                  <strong>{countryName(country.code, language)}</strong>
                  <small>{country.code}</small>
                  <bdi>{country.phoneCode}</bdi>
                </button>
              ))}
              {filteredCountries.length === 0 && <p>{t('common.noCountries')}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
