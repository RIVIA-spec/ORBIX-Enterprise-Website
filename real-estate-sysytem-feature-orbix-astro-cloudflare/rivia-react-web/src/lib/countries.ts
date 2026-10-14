export type CountryOption = {
  name: string;
  code: string;
  phoneCode: string;
  flag: string;
  currency: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { name: 'سوريا', code: 'SY', phoneCode: '+963', flag: '🇸🇾', currency: 'SYP' },
  { name: 'لبنان', code: 'LB', phoneCode: '+961', flag: '🇱🇧', currency: 'LBP' },
  { name: 'تركيا', code: 'TR', phoneCode: '+90', flag: '🇹🇷', currency: 'TRY' },
  { name: 'الأردن', code: 'JO', phoneCode: '+962', flag: '🇯🇴', currency: 'JOD' },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

export function getCountryByCode(code?: string | null) {
  return COUNTRY_OPTIONS.find((country) => country.code === code);
}

export function getCountryByName(name?: string | null) {
  return COUNTRY_OPTIONS.find((country) => country.name === name);
}

export function getCountryByPhoneCode(phoneCode?: string | null) {
  return COUNTRY_OPTIONS.find((country) => country.phoneCode === phoneCode);
}
