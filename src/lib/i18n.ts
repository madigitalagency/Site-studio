import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

export type Lang = 'fr' | 'en';
export const langs: Lang[] = ['fr', 'en'];
const dict = { fr, en } as const;

/** Textes d'interface de la langue demandée. */
export function ui(lang: Lang) {
  return dict[lang];
}

/** Préfixe d'adresse : rien en français, `/en` en anglais. */
export function prefix(lang: Lang) {
  return lang === 'fr' ? '' : '/en';
}

/** Adresse d'une page dans une langue. `path` commence et finit par `/`. */
export function href(lang: Lang, path: string) {
  return `${prefix(lang)}${path}`;
}

/** Les chemins équivalents FR/EN d'une même page (CDC v2 §4.3). */
const routes: Record<string, { fr: string; en: string }> = {
  films: { fr: '/films/', en: '/films/' },
  series: { fr: '/series/', en: '/series/' },
  univers: { fr: '/univers/', en: '/univers/' },
  formats: { fr: '/formats/', en: '/formats/' },
  roger: { fr: '/roger/', en: '/roger/' },
  coulisses: { fr: '/coulisses/', en: '/behind-the-scenes/' },
  methode: { fr: '/methode/', en: '/method/' },
  lexique: { fr: '/lexique/', en: '/glossary/' },
  carnet: { fr: '/carnet/', en: '/notebook/' },
  prestations: { fr: '/prestations/', en: '/services/' },
  apropos: { fr: '/a-propos/', en: '/about/' },
  contact: { fr: '/contact/', en: '/contact/' },
  mentions: { fr: '/mentions-legales/', en: '/legal/' },
  confidentialite: { fr: '/confidentialite/', en: '/privacy/' },
};

export function route(lang: Lang, key: keyof typeof routes, rest = '') {
  return `${prefix(lang)}${routes[key][lang]}${rest}`;
}

/** Texte bilingue : la version demandée, sinon le français. */
export function t(lang: Lang, value: { fr: string; en?: string } | undefined, fallback = ''): string {
  if (!value) return fallback;
  return (lang === 'en' && value.en) || value.fr || fallback;
}

export function tl(lang: Lang, value: { fr: string[]; en?: string[] } | undefined): string[] {
  if (!value) return [];
  return (lang === 'en' && value.en) || value.fr || [];
}

/** « 25 s », « 1 min 07 ». */
export function duree(lang: Lang, s: number) {
  const r = Math.round(s);
  if (r < 60) return `${r} s`;
  const m = Math.floor(r / 60);
  const sec = r % 60;
  return `${m} min${sec ? ' ' + String(sec).padStart(2, '0') : ''}`;
}

export function dateLongue(lang: Lang, iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** S1 · E02 */
export function numero(saison?: number, episode?: number) {
  if (!saison || !episode) return '';
  return `S${saison} · E${String(episode).padStart(2, '0')}`;
}
