// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Site 100 % statique. Rien ne s'exécute sur le serveur (CDC v2 §9.1).
// Aucun code en ligne : les en-têtes de sécurité sont posés par nginx (CDC v3 §4.1).
export default defineConfig({
  site: 'https://studio.madigitalagency.net',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  i18n: { defaultLocale: 'fr', locales: ['fr', 'en'], routing: { prefixDefaultLocale: false } },
  integrations: [sitemap({ i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en' } } })],
});
