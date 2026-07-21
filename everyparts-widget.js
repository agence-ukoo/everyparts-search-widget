/**
 * everyparts-widget.js — Widget de recherche EveryParts (MVP)
 * Shadow DOM, Vanilla JS, fichier unique. Mobile-first.
 *
 * Intégration :
 * <script
 *   src="https://cdn.jsdelivr.net/gh/agence-ukoo/everyparts-search-widget@1.0.0/everyparts-widget.min.js"
 *   data-token="[TOKEN]"
 *   data-locale="fr-FR"
 *   data-position="bottom-right"
 *   data-api="https://everyparts-api-hub.jcloud.ik-server.com/api/v1"
 *   defer></script>
 */
(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────
  const SCRIPT_EL = document.currentScript || (function () {
    const scripts = document.querySelectorAll('script[data-token]');
    return scripts[scripts.length - 1];
  })();

  // ── Traductions (i18n) — clés par locale BCP 47 ────────────────────────────
  const I18N = {
    'fr-FR': {
      placeholder:     'Rechercher une pièce compatible…',
      send:            'Envoyer',
      welcome:         'Bonjour ! Je suis PartsMind, l\'assistant de recherche EveryParts. Décrivez-moi votre moto et la pièce que vous cherchez (ex : bougie pour Honda CBR 600 de 96).',
      typing:          'En train de répondre…',
      error_token:     'Configuration invalide : token absent.',
      error_net:       'Impossible de joindre l\'API. Vérifiez votre connexion.',
      error_unknown:   'Erreur inconnue.',
      error_unexpected:'Réponse inattendue du serveur.',
      compat_label:    'Compatible',
      compat_tip:      'Confirmée par {n} sources',
      suggestions:     'Suggestions :',
      close:           'Fermer le chat',
      open:            'Ouvrir l\'assistant EveryParts',
      new_conversation:'Nouvelle conversation',
      aria_dialog:     'EveryParts – Assistant de recherche',
      aria_conversation: 'Conversation',
      filter_placeholder: 'Filtrer les options…',
      filter_no_match: 'Aucune option ne correspond.',
      options_count:   '{n} options',
      view_product:    'Voir le produit',
      ref_label:       'Réf.',
      products_filter_placeholder: 'Filtrer par nom, marque, réf…',
      products_no_match: 'Aucun produit ne correspond.',
      products_count:  '{n} / {total} produits',
      products_load_more: 'Voir plus de produits',
      products_expired: 'Cette liste a expiré — relancez votre recherche pour voir la suite.',
      after_result:    'Souhaitez-vous affiner le résultat ou faire une autre recherche ?',
      refine_dont_know:'Je ne sais pas',
      sort_label:      'Trier les produits',
      sort_relevance:  'Pertinence',
      sort_price_asc:  'Prix croissant',
      sort_price_desc: 'Prix décroissant',
      sort_name_asc:   'Nom A–Z',
      sort_name_desc:  'Nom Z–A',
      review_question: 'Êtes-vous satisfait de ces résultats ?',
      review_yes:      'Oui, satisfait',
      review_no:       'Non, pas satisfait',
    },
    'en-US': {
      placeholder:     'Search for a compatible part…',
      send:            'Send',
      welcome:         'Hi! I\'m PartsMind, the EveryParts search assistant. Tell me about your bike and the part you\'re looking for (e.g., spark plug for a \'96 Honda CBR 600).',
      typing:          'Typing…',
      error_token:     'Invalid configuration: missing token.',
      error_net:       'Unable to reach the API. Please check your connection.',
      error_unknown:   'Unknown error.',
      error_unexpected:'Unexpected server response.',
      compat_label:    'Compatible',
      compat_tip:      'Confirmed by {n} sources',
      suggestions:     'Suggestions:',
      close:           'Close chat',
      open:            'Open the EveryParts assistant',
      new_conversation:'New conversation',
      aria_dialog:     'EveryParts – Search assistant',
      aria_conversation: 'Conversation',
      filter_placeholder: 'Filter options…',
      filter_no_match: 'No matching option.',
      options_count:   '{n} options',
      view_product:    'View product',
      ref_label:       'Ref.',
      products_filter_placeholder: 'Filter by name, brand, ref…',
      products_no_match: 'No matching product.',
      products_count:  '{n} / {total} products',
      products_load_more: 'Show more products',
      products_expired: 'This list has expired — run the search again to see more.',
      after_result:    'Would you like to refine the results or perform another search?',
      refine_dont_know:'I don\'t know',
      sort_label:      'Sort products',
      sort_relevance:  'Relevance',
      sort_price_asc:  'Price: low to high',
      sort_price_desc: 'Price: high to low',
      sort_name_asc:   'Name A–Z',
      sort_name_desc:  'Name Z–A',
      review_question: 'Are you satisfied with these results?',
      review_yes:      'Yes, satisfied',
      review_no:       'No, not satisfied',
    },
    'en-GB': {
      placeholder:     'Search for a compatible part…',
      send:            'Send',
      welcome:         'Hello! I\'m PartsMind, the EveryParts search assistant. Tell me about your bike and the part you\'re looking for (e.g. spark plug for a 1996 Honda CBR 600).',
      typing:          'Typing…',
      error_token:     'Invalid configuration: missing token.',
      error_net:       'Unable to reach the API. Please check your connection.',
      error_unknown:   'Unknown error.',
      error_unexpected:'Unexpected server response.',
      compat_label:    'Compatible',
      compat_tip:      'Confirmed by {n} sources',
      suggestions:     'Suggestions:',
      close:           'Close chat',
      open:            'Open the EveryParts assistant',
      new_conversation:'New conversation',
      aria_dialog:     'EveryParts – Search assistant',
      aria_conversation: 'Conversation',
      filter_placeholder: 'Filter options…',
      filter_no_match: 'No matching option.',
      options_count:   '{n} options',
      view_product:    'View product',
      ref_label:       'Ref.',
      products_filter_placeholder: 'Filter by name, brand, ref…',
      products_no_match: 'No matching product.',
      products_count:  '{n} / {total} products',
      products_load_more: 'Show more products',
      products_expired: 'This list has expired — run the search again to see more.',
      after_result:    'Would you like to refine the results or perform another search?',
      refine_dont_know:'I don\'t know',
      sort_label:      'Sort products',
      sort_relevance:  'Relevance',
      sort_price_asc:  'Price: low to high',
      sort_price_desc: 'Price: high to low',
      sort_name_asc:   'Name A–Z',
      sort_name_desc:  'Name Z–A',
      review_question: 'Are you satisfied with these results?',
      review_yes:      'Yes, satisfied',
      review_no:       'No, not satisfied',
    },
  };

  const DEFAULT_LOCALE = 'fr-FR';

  /**
   * Fait correspondre une locale brute à une locale supportée (ou null).
   * "fr-FR" → "fr-FR" ; "fr" / "fr-CA" → "fr-FR" ; "en" → "en-US" ; inconnu → null.
   */
  function matchLocale(raw) {
    if (!raw) return null;
    const norm = String(raw).trim().replace('_', '-');
    // Correspondance exacte (insensible à la casse)
    const exact = Object.keys(I18N).find(k => k.toLowerCase() === norm.toLowerCase());
    if (exact) return exact;
    // Correspondance par langue
    const lang = norm.split('-')[0].toLowerCase();
    if (lang === 'en') return 'en-US';
    return Object.keys(I18N).find(k => k.toLowerCase().startsWith(lang + '-')) || null;
  }

  /**
   * Résout la locale : attribut data-locale, sinon locale(s) du navigateur,
   * sinon fr-FR.
   */
  function resolveLocale(raw) {
    const fromAttr = matchLocale(raw);
    if (fromAttr) return fromAttr;
    const browserLocales = (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language]).filter(Boolean);
    for (const candidate of browserLocales) {
      const m = matchLocale(candidate);
      if (m) return m;
    }
    return DEFAULT_LOCALE;
  }

  const CONFIG = {
    token:    SCRIPT_EL?.getAttribute('data-token') || '',
    // data-locale remplace data-lang (rétro-compatibilité conservée en repli).
    locale:   resolveLocale(SCRIPT_EL?.getAttribute('data-locale') || SCRIPT_EL?.getAttribute('data-lang')),
    position: SCRIPT_EL?.getAttribute('data-position') || 'bottom-right',
    apiBase:  SCRIPT_EL?.getAttribute('data-api') || 'http://localhost:8000/api/v1',
  };

  function t(key, vars = {}) {
    const dict = I18N[CONFIG.locale] || I18N[DEFAULT_LOCALE];
    let str = dict[key] || I18N[DEFAULT_LOCALE][key] || key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  }

  // ── Formatage prix selon la locale ─────────────────────────────────────────
  const priceFormatter = (function () {
    try {
      return new Intl.NumberFormat(CONFIG.locale, {
        style: 'currency',
        currency: 'EUR',
      });
    } catch (e) {
      return null;
    }
  })();

  function formatPrice(value) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return String(value ?? '');
    return priceFormatter ? priceFormatter.format(num) : `${num.toFixed(2)} €`;
  }

  // Normalisation pour le filtre d'options (insensible aux accents/casse)
  function normStr(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // ── Icotype SVG placeholder ────────────────────────────────────────────────
  const ICOTYPE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 271 281" width="32" height="32" aria-hidden="true">
    <path d="M 126 17.5 C 106.9 28.1, 60.8 53.1, 40 65.5 C 19.2 77.9, 34.5 69.5, 31.5 74 C 28.5 78.5, 27.6 61.6, 26.5 86 C 25.4 110.4, 25.4 160.6, 26.5 185 C 27.6 209.4, 27.4 191.8, 31.5 197 C 35.6 202.2, 24.2 196.1, 45 208.5 C 65.8 220.9, 104.2 243.8, 126 253.5 C 147.8 263.2, 122.7 262.6, 144 252.5 C 165.3 242.4, 202.9 219.9, 223 207.5 C 243.1 195.1, 231.7 202.1, 235.5 196 C 239.3 189.9, 239.4 187.9, 240.5 180 L 240.5 160 L 223 157.5 C 215.4 157.4, 215.7 154.4, 206 159.5 C 196.3 164.6, 188.7 174.3, 179 180.5 C 169.3 186.7, 174.1 186.2, 162 187.5 C 149.9 188.8, 135.7 188.0, 124 186.5 C 112.3 185.0, 114.0 183.5, 109 180.5 C 104.0 177.5, 103.3 175.6, 101.5 173 L 101 168.5 L 146 159.5 C 157.8 155.2, 152.8 156.8, 154.5 149 C 156.2 141.2, 154.8 132.1, 153.5 124 C 152.2 115.9, 150.8 115.8, 148.5 112 C 146.2 108.2, 146.4 107.9, 143 106.5 C 139.6 105.1, 144.2 104.0, 133 105.5 C 121.8 107.0, 101.7 111.7, 92 113.5 L 89 113.5 L 87.5 110 C 87.6 107.5, 87.2 105.6, 89.5 102 C 91.8 98.4, 89.1 99.5, 98 93.5 C 106.9 87.5, 119.9 79.6, 130 74.5 C 140.1 69.4, 137.6 71.2, 144 70.5 C 150.4 69.8, 153.1 70.0, 159 71.5 C 164.9 73.0, 164.2 72.2, 171 77.5 C 177.8 82.8, 182.1 89.1, 190 95.5 C 197.9 101.9, 197.8 103.4, 207 106.5 C 216.2 109.6, 224.6 109.2, 232 109.5 L 240.5 108 L 238.5 81 C 236.0 72.1, 249.8 81.3, 229 67.5 C 208.2 53.8, 166.4 29.5, 144 18.5 C 121.6 7.5, 131.0 17.7, 127 17.5 C 123.0 17.3, 145.1 6.9, 126 17.5 Z" fill="white"/>
  </svg>`;

  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 208" width="140" height="27" style="enable-background:new 0 0 1080 208;" xml:space="preserve" aria-hidden="true">
    <style type="text/css">.st0{fill:#FFFFFF;}</style>
    <g>
      <path class="st0" d="M752.18,79.73c-3.5-7.08-8.42-12.67-14.76-16.75c-6.34-4.08-13.78-6.12-22.33-6.12c-8.49,0-15.63,2.07-21.42,6.2c-0.54,0.39-1.06,0.8-1.57,1.21v-4.93h-19.85v129.02h22.66v-42.82c5.8,3.73,12.91,5.6,21.34,5.6c8.22,0,15.41-2.07,21.59-6.2c6.17-4.14,10.99-9.76,14.43-16.87c3.45-7.11,5.17-15.13,5.17-24.07C757.43,94.9,755.68,86.81,752.18,79.73z M731.38,117.69c-1.49,4.11-3.78,7.37-6.86,9.8c-3.09,2.43-7.06,3.64-11.91,3.64c-5.02,0-9.03-1.13-12.03-3.39c-3.01-2.26-5.17-5.43-6.49-9.51c-1.32-4.08-1.98-8.82-1.98-14.23c0-5.4,0.66-10.14,1.98-14.23c1.32-4.08,3.43-7.25,6.33-9.51c2.89-2.26,6.69-3.39,11.37-3.39c5.02,0,9.14,1.23,12.36,3.68c3.23,2.45,5.61,5.74,7.15,9.84c1.54,4.11,2.32,8.64,2.32,13.6C733.61,109.02,732.86,113.58,731.38,117.69z"/>
      <path class="st0" d="M846.93,82.99c-0.33-3.31-1.38-6.62-3.14-9.92c-3.14-5.96-7.77-10.14-13.89-12.57c-6.12-2.43-13.12-3.64-21.01-3.64c-10.75,0-19.24,2.32-25.47,6.95c-6.23,4.63-10.48,10.64-12.74,18.03l20.35,6.45c1.43-4.08,3.94-6.92,7.53-8.52c3.58-1.6,7.03-2.4,10.34-2.4c5.95,0,10.2,1.24,12.74,3.72c1.99,1.95,3.19,4.77,3.62,8.44c-3.8,0.57-7.41,1.11-10.81,1.61c-5.79,0.86-10.97,1.75-15.55,2.69c-4.58,0.94-8.52,2.01-11.83,3.23c-4.8,1.77-8.62,3.96-11.45,6.58c-2.84,2.62-4.89,5.64-6.16,9.06c-1.27,3.42-1.9,7.2-1.9,11.33c0,4.96,1.14,9.5,3.43,13.6c2.29,4.11,5.65,7.39,10.09,9.84c4.44,2.45,9.86,3.68,16.25,3.68c7.72,0,14.1-1.34,19.15-4.01c3.98-2.11,7.74-5.27,11.29-9.46v10.99h19.68V94.08C847.43,90,847.26,86.3,846.93,82.99z M822.78,121.53c-0.61,1.27-1.75,2.84-3.43,4.71c-1.68,1.88-3.94,3.54-6.78,5c-2.84,1.46-6.33,2.19-10.46,2.19c-2.59,0-4.83-0.39-6.7-1.16c-1.88-0.77-3.32-1.89-4.34-3.35c-1.02-1.46-1.53-3.21-1.53-5.25c0-1.49,0.32-2.84,0.95-4.05c0.63-1.21,1.63-2.33,2.98-3.35c1.35-1.02,3.13-1.97,5.33-2.85c1.93-0.72,4.16-1.38,6.7-1.98c2.54-0.61,5.87-1.28,10.01-2.03c2.66-0.48,5.84-1.03,9.55-1.66c-0.05,1.57-0.13,3.33-0.24,5.3C824.62,116.28,823.94,119.11,822.78,121.53z"/>
      <path class="st0" d="M907.8,59.13c-2.7,0.19-5.32,0.66-7.86,1.41c-2.54,0.74-4.88,1.78-7.03,3.1c-2.81,1.65-5.18,3.75-7.11,6.29c-0.92,1.2-1.74,2.47-2.48,3.8V59.34h-19.85v89.32h22.66v-45.65c0-3.42,0.47-6.49,1.41-9.22c0.94-2.73,2.32-5.1,4.14-7.11c1.82-2.01,4.05-3.62,6.7-4.84c2.65-1.27,5.61-2.03,8.89-2.27c3.28-0.25,6.16,0.01,8.64,0.79V59.34C913.2,59.01,910.5,58.94,907.8,59.13z"/>
      <path class="st0" d="M987.55,76.71V59.34h-25.8V34.53h-22.5v24.81h-15.22v17.37h15.22v34.08c0,5.35,0.05,10.13,0.17,14.35c0.11,4.22,1.27,8.37,3.47,12.45c2.43,4.36,5.97,7.51,10.63,9.47c4.66,1.96,9.95,3,15.88,3.14c5.93,0.14,11.98-0.37,18.15-1.53v-18.69c-5.29,0.72-10.12,0.94-14.47,0.66c-4.36-0.28-7.53-1.98-9.51-5.13c-1.05-1.65-1.61-3.87-1.7-6.66c-0.08-2.78-0.12-5.91-0.12-9.39V76.71H987.55z"/>
      <path class="st0" d="M1072.19,109.83c-1.88-3.28-4.87-6.09-8.97-8.44c-4.11-2.34-9.55-4.4-16.33-6.16c-6.95-1.76-12.12-3.2-15.51-4.3c-3.39-1.1-5.62-2.18-6.7-3.23c-1.08-1.05-1.61-2.34-1.61-3.89c0-2.59,1.25-4.58,3.76-5.95c2.51-1.38,5.83-1.93,9.97-1.65c4.25,0.33,7.61,1.46,10.09,3.39c2.48,1.93,3.91,4.55,4.3,7.86l22.99-4.14c-0.77-5.4-2.83-10.09-6.16-14.06c-3.34-3.97-7.71-7.03-13.11-9.18c-5.4-2.15-11.61-3.23-18.61-3.23c-7.22,0-13.49,1.15-18.82,3.43c-5.32,2.29-9.44,5.54-12.36,9.76c-2.92,4.22-4.38,9.19-4.38,14.93c0,4.58,0.96,8.48,2.89,11.7c1.93,3.23,5.07,6,9.43,8.31c4.36,2.32,10.17,4.41,17.45,6.29c6.45,1.71,11.21,3.09,14.27,4.14c3.06,1.05,5.03,2.11,5.91,3.18c0.88,1.08,1.32,2.5,1.32,4.26c0,2.81-1.1,5-3.31,6.57c-2.21,1.57-5.35,2.36-9.43,2.36c-4.96,0-9.06-1.18-12.28-3.56c-3.23-2.37-5.31-5.65-6.24-9.84l-22.99,3.47c1.49,9.32,5.69,16.53,12.61,21.63c6.92,5.1,16,7.65,27.25,7.65c11.69,0,20.84-2.62,27.46-7.86c6.62-5.24,9.93-12.43,9.93-21.59C1075,117.07,1074.06,113.11,1072.19,109.83z"/>
      <path class="st0" d="M315.1,110.28c0.93-10.81-0.18-20.19-3.31-28.19c-3.15-8-8-14.2-14.56-18.61s-14.52-6.62-23.91-6.62c-8.82,0-16.62,2.01-23.4,5.99c-6.78,4-12.11,9.61-15.97,16.84c-3.86,7.21-5.79,15.7-5.79,25.47c0,8.94,1.97,16.86,5.91,23.77c3.96,6.93,9.4,12.35,16.39,16.29c6.97,3.96,15.03,5.93,24.19,5.93c8.59,0,16.51-2.28,23.77-6.78c7.25-4.53,12.55-10.87,15.93-19.03l-22.51-6.44c-1.65,3.64-4.04,6.42-7.19,8.35c-3.13,1.93-6.91,2.88-11.33,2.88c-6.99,0-12.31-2.28-15.9-6.8c-2.64-3.33-4.31-7.68-5.02-13.04H315.1z M252.99,93.58c0.87-4.14,2.36-7.54,4.43-10.22c3.6-4.65,9.24-6.99,16.9-6.99c6.56,0,11.29,1.99,14.2,5.99c1.89,2.64,3.17,6.38,3.82,11.21H252.99z"/>
      <polygon class="st0" points="381.46,59.34 360.29,121.2 339.11,59.34 316.62,59.34 349.04,148.66 371.53,148.66 403.95,59.34"/>
      <path class="st0" d="M481.24,110.29h10.83c0.94-10.81-0.17-20.21-3.31-28.2c-3.14-7.99-8-14.2-14.56-18.61c-6.56-4.41-14.53-6.62-23.9-6.62c-8.82,0-16.62,2-23.41,6c-6.78,4-12.1,9.61-15.96,16.83c-3.86,7.22-5.79,15.71-5.79,25.47c0,8.93,1.97,16.86,5.91,23.78c3.94,6.92,9.4,12.35,16.38,16.29c6.97,3.94,15.04,5.91,24.19,5.91c8.6,0,16.53-2.26,23.78-6.78c7.25-4.52,12.56-10.86,15.92-19.02l-22.5-6.45c-1.65,3.64-4.05,6.42-7.2,8.35c-3.14,1.93-6.92,2.89-11.33,2.89c-7,0-12.31-2.27-15.92-6.82c-2.64-3.33-4.31-7.68-5.02-13.03h40.46H481.24z M451.3,76.38c6.56,0,11.29,2,14.18,6c1.9,2.63,3.18,6.37,3.83,11.21h-39.36c0.88-4.13,2.36-7.54,4.43-10.21C438,78.71,443.64,76.38,451.3,76.38z"/>
      <path class="st0" d="M551.11,59.13c-2.7,0.19-5.32,0.66-7.86,1.41c-2.54,0.74-4.88,1.78-7.03,3.1c-2.81,1.65-5.18,3.75-7.11,6.29c-0.92,1.2-1.74,2.47-2.48,3.8V59.34h-19.85v89.32h22.66v-45.65c0-3.42,0.47-6.49,1.41-9.22c0.94-2.73,2.32-5.1,4.14-7.11c1.82-2.01,4.05-3.62,6.7-4.84c2.65-1.27,5.61-2.03,8.89-2.27c3.28-0.25,6.16,0.01,8.64,0.79V59.34C556.52,59.01,553.81,58.94,551.11,59.13z"/>
      <polygon class="st0" points="634.17,59.34 610.84,120.12 587.36,59.34 564.04,59.34 600.07,147.96 585.38,188.36 606.22,188.36 656.67,59.34"/>
      <path class="st0" d="M170.24,122.95c0,0-10.12-1.02-19.05,7.2c-8.93,8.23-20.59,19.47-38.53,18.73c0,0-36.86,3.25-43.88-15.96l36.24-7.27c0,0,15.47-2.49,10.49-27.18C110.53,73.79,98.9,78.01,98.9,78.01l-39.87,6.96c0,0-2.85-6.63,3.65-12.87c6.51-6.24,31.73-24.22,47.85-23.56c16.12,0.66,18.55,5.75,27.34,13.66c8.79,7.92,18.76,18.19,32.02,18.73c5.89,0.24,13.1,0.54,19.29,0.79l0-15.01c0-9.82-5.24-18.9-13.75-23.81L110.84,5.61c-8.51-4.91-18.99-4.91-27.49,0l-64.6,37.28C10.24,47.81,5,56.89,5,66.71l0.01,74.58c0,9.82,5.24,18.9,13.75,23.81l64.58,37.28c8.51,4.91,18.99,4.91,27.49,0l64.6-37.28c8.51-4.91,13.75-13.99,13.75-23.82l0-17.56L170.24,122.95z"/>
    </g>
  </svg>`;

  // ── CSS du Shadow DOM (mobile-first : plein écran < 641px) ─────────────────
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@800&display=swap');

    :host { all: initial; display: block; }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root, :host {
      --ep-primary:   #00BE82;
      --ep-dark:      #064C4C;
      --ep-body:      #5B5A59;
      --ep-green:     #3CD179;
      --ep-blue:      #0154F9;
      --ep-red:       #FF4869;
      --ep-orange:    #FF7848;
      --ep-yellow:    #FACD22;
      --ep-white:     #FFFFFF;
      --ep-grey-100:  #F5F2EB;
      --ep-grey-200:  #E2E0DC;
      --ep-grey-300:  #CCCAC6;
      --ep-grey-400:  #999895;
      --ep-grey-500:  #7F7E7C;
      --ep-grey-600:  #5B5A59;
      --ep-grey-700:  #474747;
      --ep-grey-800:  #2D2D2C;
      --ep-grey-900:  #1E1E1D;
      --ep-font-title: 'Manrope', system-ui, sans-serif;
      --ep-font-body:  'Inter', system-ui, sans-serif;
      --ep-radius:    12px;
      --ep-shadow:    0 8px 32px rgba(6,76,76,.18);
    }

    /* ── Bouton flottant ── */
    #ep-fab {
      position: fixed;
      z-index: 2147483646;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--ep-dark);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(6,76,76,.35);
      transition: transform .2s ease, box-shadow .2s ease;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    #ep-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(6,76,76,.45); }
    #ep-fab:focus-visible { outline: 3px solid var(--ep-primary); outline-offset: 3px; }
    #ep-fab svg { display: block; }

    .ep-pos-bottom-right { bottom: calc(20px + env(safe-area-inset-bottom, 0px)); right: calc(16px + env(safe-area-inset-right, 0px)); }
    .ep-pos-bottom-left  { bottom: calc(20px + env(safe-area-inset-bottom, 0px)); left: calc(16px + env(safe-area-inset-left, 0px)); }
    .ep-pos-top-right    { top: calc(20px + env(safe-area-inset-top, 0px)); right: calc(16px + env(safe-area-inset-right, 0px)); }
    .ep-pos-top-left     { top: calc(20px + env(safe-area-inset-top, 0px)); left: calc(16px + env(safe-area-inset-left, 0px)); }

    /* ── Fenêtre de chat — mobile-first : plein écran ──
       Étirée par les 4 ancres (top/right/bottom/left), sans hauteur
       explicite : garantit que la fenêtre colle au bas réel du viewport
       (100dvh/100% sont peu fiables selon les barres d'outils mobiles). */
    #ep-window {
      position: fixed;
      z-index: 2147483647;
      top: 0; right: 0; bottom: 0; left: 0;
      width: auto;
      height: auto;
      background: var(--ep-grey-100);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: var(--ep-font-body);
      font-size: 15px;
      color: var(--ep-body);
      transition: opacity .25s ease, transform .25s ease;
    }
    #ep-window.ep-hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(24px);
    }

    /* ── Header ── */
    #ep-header {
      background: var(--ep-dark);
      padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #ep-header-logo { display: flex; align-items: center; gap: 8px; }
    #ep-header-actions { display: flex; align-items: center; gap: 2px; margin-right: -6px; }
    .ep-header-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ep-white);
      opacity: .8;
      padding: 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;
    }
    .ep-header-btn:hover { opacity: 1; background: rgba(255,255,255,.1); }
    .ep-header-btn:focus-visible { outline: 2px solid var(--ep-primary); }

    /* ── Zone messages ── */
    #ep-messages {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    #ep-messages::-webkit-scrollbar { width: 4px; }
    #ep-messages::-webkit-scrollbar-track { background: transparent; }
    #ep-messages::-webkit-scrollbar-thumb { background: var(--ep-grey-300); border-radius: 4px; }

    /* ── Bulles ── */
    .ep-msg {
      display: flex;
      max-width: 88%;
      animation: ep-appear .18s ease-out;
    }
    @keyframes ep-appear {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ep-msg-user { align-self: flex-end; }
    .ep-msg-assistant { align-self: flex-start; }
    .ep-msg-wide { max-width: 100%; width: 100%; }

    .ep-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      line-height: 1.5;
      word-break: break-word;
    }
    .ep-msg-user .ep-bubble {
      background: var(--ep-primary);
      color: var(--ep-white);
      border-bottom-right-radius: 4px;
    }
    .ep-msg-assistant .ep-bubble {
      background: var(--ep-white);
      color: var(--ep-body);
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    .ep-msg-error .ep-bubble {
      background: #fff0f3;
      color: var(--ep-red);
      border: 1px solid #ffd0da;
    }

    /* ── Indicateur de frappe ── */
    #ep-typing {
      display: none;
      align-items: center;
      gap: 6px;
      margin: 0 16px 8px;
      padding: 8px 14px;
      background: var(--ep-white);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      color: var(--ep-grey-500);
      font-size: 13px;
      font-style: italic;
      align-self: flex-start;
      flex-shrink: 0;
    }
    #ep-typing.ep-visible { display: flex; }
    .ep-dot { width: 6px; height: 6px; background: var(--ep-grey-400); border-radius: 50%; animation: ep-bounce .9s infinite; }
    .ep-dot:nth-child(2) { animation-delay: .15s; }
    .ep-dot:nth-child(3) { animation-delay: .3s; }
    @keyframes ep-bounce {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-5px); }
    }

    /* ── Cartes produit ── */
    .ep-products { width: 100%; }
    .ep-products-toolbar {
      display: flex;
      gap: 6px;
      align-items: center;
      /* Reste collée en haut du chat pendant le scroll de la liste */
      position: sticky;
      top: 0;
      z-index: 2;
      background: var(--ep-grey-100);
      padding: 8px 0;
      margin-bottom: 4px;
      transition: box-shadow .15s ease;
    }
    .ep-products-toolbar.ep-stuck {
      box-shadow: 0 6px 12px -6px rgba(6,76,76,.25);
    }
    .ep-products-filter {
      flex: 1;
      min-width: 0;
      border: 1.5px solid var(--ep-grey-200);
      border-radius: 10px;
      padding: 10px 12px;
      font-family: var(--ep-font-body);
      font-size: 16px;
      color: var(--ep-grey-800);
      background: var(--ep-white);
      outline: none;
      transition: border-color .15s;
    }
    .ep-products-filter:focus { border-color: var(--ep-primary); }
    .ep-products-filter::placeholder { color: var(--ep-grey-400); }
    .ep-products-sort {
      flex-shrink: 0;
      max-width: 46%;
      border: 1.5px solid var(--ep-grey-200);
      border-radius: 10px;
      padding: 10px 8px;
      min-height: 44px;
      font-family: var(--ep-font-body);
      font-size: 14px;
      color: var(--ep-grey-700);
      background: var(--ep-white);
      outline: none;
      cursor: pointer;
      transition: border-color .15s;
    }
    .ep-products-sort:focus { border-color: var(--ep-primary); }
    .ep-products-count {
      font-size: 11px;
      color: var(--ep-grey-400);
      margin-bottom: 6px;
    }
    .ep-products-empty {
      font-size: 13px;
      color: var(--ep-grey-500);
      font-style: italic;
      padding: 8px 2px;
    }
    .ep-load-more {
      width: 100%;
      margin-top: 10px;
      border: 1.5px solid var(--ep-grey-200);
      border-radius: 12px;
      padding: 12px 14px;
      min-height: 44px;
      font-family: var(--ep-font-body);
      font-size: 14px;
      font-weight: 600;
      color: var(--ep-primary);
      background: var(--ep-white);
      cursor: pointer;
      transition: border-color .15s ease, box-shadow .15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .ep-load-more:hover:not(:disabled) {
      border-color: var(--ep-primary);
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .ep-load-more:disabled { opacity: .6; cursor: wait; }
    .ep-products-expired {
      margin-top: 10px;
      font-size: 13px;
      color: var(--ep-grey-500);
      font-style: italic;
      text-align: center;
    }
    .ep-cards { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .ep-card {
      background: var(--ep-white);
      border: 1px solid var(--ep-grey-200);
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      display: flex;
      gap: 12px;
      padding: 12px 14px;
      align-items: center;
      width: 100%;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .ep-card:hover, .ep-card:focus-visible {
      border-color: var(--ep-primary);
      box-shadow: 0 4px 14px rgba(0,190,130,.18);
      transform: translateY(-1px);
    }
    .ep-card:focus-visible { outline: 2px solid var(--ep-primary); outline-offset: 2px; }
    .ep-card-img {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
      background: var(--ep-grey-100);
    }
    .ep-card-body { flex: 1; min-width: 0; }
    .ep-card-topline {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 2px;
    }
    .ep-card-brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .4px;
      text-transform: uppercase;
      color: var(--ep-grey-500);
    }
    .ep-card-ref {
      font-size: 11px;
      color: var(--ep-grey-400);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ep-card-name {
      font-weight: 600;
      color: var(--ep-grey-800);
      font-size: 14px;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .ep-card-bottomline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ep-card-price {
      font-family: var(--ep-font-title);
      font-weight: 800;
      color: var(--ep-dark);
      font-size: 16px;
      white-space: nowrap;
    }
    .ep-card-arrow {
      flex-shrink: 0;
      color: var(--ep-grey-300);
      transition: color .15s ease, transform .15s ease;
    }
    .ep-card:hover .ep-card-arrow { color: var(--ep-primary); transform: translateX(2px); }
    .ep-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--ep-green);
      color: var(--ep-dark);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      cursor: default;
      white-space: nowrap;
    }
    .ep-badge::before { content: '✓'; font-size: 10px; }

    /* ── Options de clarification ── */
    .ep-clari { width: 100%; }
    .ep-clari-opts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ep-clari-btn {
      background: var(--ep-white);
      border: 1.5px solid var(--ep-primary);
      color: var(--ep-dark);
      border-radius: 22px;
      padding: 10px 16px;
      min-height: 44px;
      font-size: 14px;
      font-family: var(--ep-font-body);
      font-weight: 600;
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s, opacity .15s;
      -webkit-tap-highlight-color: transparent;
      text-align: center;
    }
    .ep-clari-btn:hover:not(:disabled) { background: var(--ep-primary); color: var(--ep-white); }
    .ep-clari-btn:focus-visible { outline: 2px solid var(--ep-primary); outline-offset: 2px; }
    .ep-clari-btn:disabled { cursor: default; opacity: .45; }
    .ep-clari-btn.ep-selected {
      background: var(--ep-primary);
      border-color: var(--ep-primary);
      color: var(--ep-white);
      opacity: 1;
    }

    /* Liste verticale + filtre (nombreuses options) */
    .ep-clari-filter {
      width: 100%;
      border: 1.5px solid var(--ep-grey-200);
      border-radius: 10px;
      padding: 10px 12px;
      font-family: var(--ep-font-body);
      font-size: 16px;
      color: var(--ep-grey-800);
      background: var(--ep-white);
      outline: none;
      margin-bottom: 8px;
      transition: border-color .15s;
    }
    .ep-clari-filter:focus { border-color: var(--ep-primary); }
    .ep-clari-filter::placeholder { color: var(--ep-grey-400); }
    .ep-clari-count {
      font-size: 11px;
      color: var(--ep-grey-400);
      margin-bottom: 6px;
    }
    .ep-clari-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 246px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      padding-right: 2px;
    }
    .ep-clari-list::-webkit-scrollbar { width: 4px; }
    .ep-clari-list::-webkit-scrollbar-thumb { background: var(--ep-grey-300); border-radius: 4px; }
    .ep-clari-list .ep-clari-btn {
      width: 100%;
      text-align: left;
      border-radius: 10px;
      border-color: var(--ep-grey-200);
      flex-shrink: 0;
    }
    .ep-clari-list .ep-clari-btn:hover:not(:disabled) {
      border-color: var(--ep-primary);
      background: var(--ep-white);
      color: var(--ep-dark);
    }
    .ep-clari-list .ep-clari-btn.ep-selected {
      background: var(--ep-primary);
      border-color: var(--ep-primary);
      color: var(--ep-white);
    }
    .ep-clari-empty {
      font-size: 13px;
      color: var(--ep-grey-500);
      font-style: italic;
      padding: 8px 2px;
    }

    /* ── Avis sur les résultats (pouces) ── */
    .ep-review-btns {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    .ep-review-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1.5px solid var(--ep-grey-200);
      background: var(--ep-white);
      color: var(--ep-grey-500);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: border-color .15s, color .15s, background .15s, opacity .15s;
      -webkit-tap-highlight-color: transparent;
    }
    .ep-review-btn svg { display: block; }
    .ep-review-btn:focus-visible { outline: 2px solid var(--ep-primary); outline-offset: 2px; }
    .ep-review-up:hover:not(:disabled)   { border-color: var(--ep-primary); color: var(--ep-primary); }
    .ep-review-down:hover:not(:disabled) { border-color: var(--ep-red); color: var(--ep-red); }
    .ep-review-btn:disabled { cursor: default; opacity: .4; }
    .ep-review-btn.ep-selected { opacity: 1; }
    .ep-review-up.ep-selected   { background: var(--ep-primary); border-color: var(--ep-primary); color: var(--ep-white); }
    .ep-review-down.ep-selected { background: var(--ep-red); border-color: var(--ep-red); color: var(--ep-white); }

    /* ── Suggestions (no_results) ── */
    .ep-suggestions { margin-top: 8px; }
    .ep-suggestions p { font-size: 12px; color: var(--ep-grey-500); margin-bottom: 4px; }
    .ep-suggestions ul { padding-left: 16px; }
    .ep-suggestions li { font-size: 12px; color: var(--ep-grey-600); margin-bottom: 2px; }

    /* ── Zone de saisie ── */
    #ep-input-area {
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
      background: var(--ep-white);
      border-top: 1px solid var(--ep-grey-200);
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      align-items: center;
    }
    #ep-input {
      flex: 1;
      min-width: 0;
      border: 1.5px solid var(--ep-grey-200);
      border-radius: 24px;
      padding: 11px 16px;
      font-family: var(--ep-font-body);
      font-size: 16px; /* ≥16px : empêche le zoom auto iOS */
      color: var(--ep-grey-800);
      background: var(--ep-grey-100);
      outline: none;
      resize: none;
      transition: border-color .15s;
    }
    #ep-input:focus { border-color: var(--ep-primary); background: var(--ep-white); }
    #ep-input::placeholder { color: var(--ep-grey-400); }

    #ep-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--ep-primary);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .15s;
      -webkit-tap-highlight-color: transparent;
    }
    #ep-send-btn:hover { background: var(--ep-dark); }
    #ep-send-btn:focus-visible { outline: 2px solid var(--ep-dark); outline-offset: 2px; }
    #ep-send-btn:disabled { background: var(--ep-grey-300); cursor: not-allowed; }
    #ep-send-btn svg { display: block; }

    /* Masquer le FAB quand la fenêtre est ouverte (mobile plein écran) */
    #ep-fab.ep-window-open { display: none; }

    /* ── Desktop / tablette : fenêtre flottante ── */
    @media (min-width: 641px) {
      #ep-window {
        top: auto; right: auto; bottom: auto; left: auto;
        width: 400px;
        max-width: calc(100vw - 32px);
        height: 600px;
        max-height: calc(100vh - 110px);
        max-height: calc(100dvh - 110px);
        border-radius: var(--ep-radius);
        box-shadow: var(--ep-shadow);
        font-size: 14px;
      }
      #ep-window.ep-hidden { transform: translateY(12px); }
      #ep-window.ep-pos-bottom-right { bottom: 96px; right: 24px; top: auto; left: auto; }
      #ep-window.ep-pos-bottom-left  { bottom: 96px; left: 24px; top: auto; right: auto; }
      #ep-window.ep-pos-top-right    { top: 96px; right: 24px; bottom: auto; left: auto; }
      #ep-window.ep-pos-top-left     { top: 96px; left: 24px; bottom: auto; right: auto; }
      #ep-header { padding: 14px 16px; }
      #ep-fab.ep-window-open { display: flex; }
      #ep-input { font-size: 14px; }
      .ep-clari-filter { font-size: 13px; }
      .ep-products-filter { font-size: 13px; padding: 8px 12px; }
      .ep-products-sort { font-size: 13px; padding: 8px 6px; min-height: 36px; }
      .ep-clari-btn { min-height: 38px; padding: 8px 14px; font-size: 13px; }
      .ep-clari-list { max-height: 220px; }
      .ep-review-btn { width: 38px; height: 38px; }
    }

    @media (prefers-reduced-motion: reduce) {
      #ep-window, .ep-msg, .ep-card, .ep-card-arrow { transition: none; animation: none; }
      .ep-dot { animation: none; }
    }
  `;

  // ── Etat de la conversation ────────────────────────────────────────────────
  let sessionId = generateUUID();
  let conversationContext = { previous_clarifications: [] };
  let isLoading = false;
  let lastClarificationField = null;
  // Affinage en cours (CDC §6.6) : questions posées en chaîne, réponses
  // accumulées localement, un seul appel API à la fin de la chaîne.
  let pendingRefinement = null;
  // Liste de produits paginée courante (« Voir plus ») : entrées affichées,
  // bloc pagination reçu, bouton et barre d'outils. Une seule liste
  // paginable à la fois — le bouton d'une liste précédente est retiré.
  let activeList = null;

  // ── Persistance de session (survit à la navigation) ─────────────────────────
  // Historique ordonné de la conversation, maintenue à jour au fil
  // des échanges, et "rejouée" au reload.
  let transcript = [];
  // État passé à true pendant le reload de la conversation pour empêcher la journalisation + interactivité
  // La partie restaurée de la conversation doit rester inerte.
  let isRestoring = false;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Conversation conservée 30 min après la dernière activité : survit à la
  // navigation (y compris nouvel onglet, cf. cartes produit en target=_blank),
  // mais une conversation périmée ne « ressuscite » pas silencieusement.
  const SESSION_TTL_MS = 30 * 60 * 1000;
  const STORAGE_KEY = `everyparts-chat:${CONFIG.token}`;

  function storageGet() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function loadState() {
    const raw = storageGet();
    if (!raw) return null;
    let saved;
    try {
      saved = JSON.parse(raw);
    } catch (e) {
      clearState();
      return null;
    }
    // Payload d'une autre version, d'un autre token, ou périmé → on repart à neuf.
    if (!saved || saved.v !== STORAGE_SCHEMA_VERSION || saved.token !== CONFIG.token
        || !Array.isArray(saved.transcript)
        || (Date.now() - (saved.lastActive || 0)) > SESSION_TTL_MS) {
      clearState();
      return null;
    }
    return saved;
  }

  function saveState() {
    if (isRestoring) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 1,
        token: CONFIG.token,
        sessionId,
        conversationContext,
        transcript,
        lastActive: Date.now(),
      }));
    } catch (e) {
      /* no-op : dégradation en mémoire de page */
    }
  }

  function clearState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* no-op */
    }
  }

  // Seuil au-delà duquel les options passent en liste verticale filtrable
  const CLARI_CHIPS_MAX = 6;
  // Seuil au-delà duquel le champ de filtre est affiché
  const CLARI_FILTER_MIN = 8;
  // Seuil au-delà duquel la barre tri + filtre produits est affichée
  const PRODUCTS_TOOLBAR_MIN = 5;
  // Version du schema JSON de stockage de l'historique de conversation
  // Tout changement au sein de ce schéma doit induire une incrémentation de ce numéro de version afin d'invalider
  // les caches utilisateurs lors du déploiement
  const STORAGE_SCHEMA_VERSION = 1;

  // ── Montage du widget ──────────────────────────────────────────────────────
  function mount() {
    // Conteneur hôte
    const host = document.createElement('div');
    host.id = 'everyparts-widget-host';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Styles
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    shadow.appendChild(styleEl);

    // Bouton flottant
    const fab = document.createElement('button');
    fab.id = 'ep-fab';
    fab.className = `ep-pos-${CONFIG.position}`;
    fab.setAttribute('aria-label', t('open'));
    fab.title = t('open');
    fab.innerHTML = ICOTYPE_SVG;
    shadow.appendChild(fab);

    // Fenêtre de chat
    const win = document.createElement('div');
    win.id = 'ep-window';
    win.className = `ep-pos-${CONFIG.position} ep-hidden`;
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'false');
    win.setAttribute('aria-label', t('aria_dialog'));
    win.innerHTML = buildWindowHTML();
    shadow.appendChild(win);

    // Références DOM
    const messagesEl = win.querySelector('#ep-messages');
    const typingEl   = win.querySelector('#ep-typing');
    const inputEl    = win.querySelector('#ep-input');
    const sendBtn    = win.querySelector('#ep-send-btn');
    const closeBtn   = win.querySelector('#ep-close-btn');
    const resetBtn   = win.querySelector('#ep-reset-btn');

    // ── Événements ────────────────────────────────────────────────────────
    let isOpen = false;

    fab.addEventListener('click', () => toggleWindow(!isOpen));
    closeBtn.addEventListener('click', () => toggleWindow(false));
    resetBtn.addEventListener('click', newConversation);

    // Fermeture à Échap
    shadow.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) toggleWindow(false);
    });

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    // Restaure la conversation persistée (navigation, nouvel onglet, retour) :
    // l'historique est rejoué dans la fenêtre (fermée) ; la conversation restaurée apparaît à
    // la réouverture. Aucun effet si rien n'est sauvegardé ou si le TTL a expiré.
    restoreConversation();

    function isMobile() {
      return window.matchMedia('(max-width: 640px)').matches;
    }

    function toggleWindow(open) {
      isOpen = open;
      win.classList.toggle('ep-hidden', !open);
      fab.classList.toggle('ep-window-open', open);
      fab.setAttribute('aria-label', open ? t('close') : t('open'));
      fab.title = open ? t('close') : t('open');
      if (open) {
        inputEl.focus();
        if (messagesEl.children.length === 0) {
          appendAssistantMessage(t('welcome'));
        }
      } else {
        fab.focus();
      }
    }

    // Repart de zéro : vide l'affichage et l'état, purge le stockage, ré-affiche
    // l'accueil. Permet à l'utilisateur de contourner la persistance de sa conversation
    // s'il souhaite recommencer
    function newConversation() {
      transcript = [];
      conversationContext = { previous_clarifications: [] };
      lastClarificationField = null;
      pendingRefinement = null;
      activeList = null;
      sessionId = generateUUID();
      clearState();
      messagesEl.innerHTML = '';
      appendAssistantMessage(t('welcome')); // sauvegarde la nouvelle session et démarre la nouvelle journalisation
      inputEl.focus();
    }

    // Reload la conversation persistée. Sans effet si aucune sauvegarde,
    // si token différent, ou si le TTL a expiré (cf. loadState).
    function restoreConversation() {
      const saved = loadState();
      if (!saved || !saved.transcript.length) return;

      sessionId = saved.sessionId || sessionId;
      conversationContext = saved.conversationContext || { previous_clarifications: [] };
      transcript = saved.transcript;

      isRestoring = true;
      try {
        const lastIndex = transcript.length - 1;
        transcript.forEach((entry, i) => replayEntry(entry, i === lastIndex));
      } finally {
        isRestoring = false;
      }
      scrollBottom();
    }

    // Ré-affiche une entrée de l'historique de conversation. Figée dans son état
    // final (boutons désactivés), SAUF si c'est le tout DERNIER message ET qu'il
    // est resté sans réponse (aucune option choisie / aucun avis donné) : dans ce
    // cas seulement, l'interactivité est restaurée pour que l'utilisateur puisse
    // répondre — geler une question à laquelle il n'a jamais répondu n'aurait pas
    // de sens et le bloquerait sans raison.
    function replayEntry(entry, isLast) {
      switch (entry.t) {
        case 'user':
          appendUserMessage(entry.text);
          break;
        case 'assistant':
          appendAssistantMessage(entry.text);
          break;
        case 'products':
          renderProductList(entry.products || [], entry.pagination || null);
          // Re-connecte la liste de produits dynamique à son entrée restaurée depuis l'historique
          // pour que « Voir plus » continue de fonctionner.
          if (activeList) activeList.logEntry = entry;
          break;
        case 'options': {
          const answered = typeof entry.selectedIndex === 'number' && entry.selectedIndex >= 0;
          if (isLast && !answered) {
            resumeOptionsLive(entry);
          } else {
            appendOptionsGroup(entry.options || [], () => {}, {
              restoreSelectedIndex: answered ? entry.selectedIndex : -1,
            });
          }
          break;
        }
        case 'review': {
          const answered = entry.rating != null;
          if (isLast && !answered) {
            renderReviewPrompt(undefined, entry);
          } else {
            renderReviewPrompt(answered ? entry.rating : null);
          }
          break;
        }
        case 'no_results':
          appendAssistantMessageEl(buildNoResults(entry.message, entry.suggestions));
          break;
      }
    }

    // Reconnecte un groupe d'options resté sans réponse à son comportement réel
    // (clarification ou question d'affinage), en réutilisant l'entrée déjà
    // persistée plutôt que d'en journaliser une nouvelle.
    function resumeOptionsLive(entry) {
      if (entry.kind === 'refinement' && entry.refinementSnapshot) {
        const snap = entry.refinementSnapshot;
        pendingRefinement = {
          data: snap.data,
          questions: snap.data.refinement.questions,
          answers: snap.answers.slice(),
          freezeCurrent: null,
        };
        const p = pendingRefinement;
        const group = appendOptionsGroup(entry.options || [], (value, label) => {
          appendUserMessage(label);
          recordRefinementAnswer(value);
        }, { reuseEntry: entry });
        p.freezeCurrent = group ? group.freeze : null;
      } else {
        lastClarificationField = entry.field != null ? entry.field : lastClarificationField;
        appendOptionsGroup(entry.options || [], value => {
          conversationContext.previous_clarifications.push({
            field:  lastClarificationField,
            answer: value,
          });
          appendUserMessage(value);
          callSearch(value);
        }, { reuseEntry: entry });
      }
    }

    function sendMessage() {
      const query = inputEl.value.trim();
      if (!query || isLoading) return;
      inputEl.value = '';
      appendUserMessage(query);
      // Affinage en cours : le texte saisi vaut réponse à la question
      // courante — rien ne part à l'API avant la fin de la chaîne.
      if (pendingRefinement) {
        if (pendingRefinement.freezeCurrent) pendingRefinement.freezeCurrent();
        recordRefinementAnswer(query);
        return;
      }
      callSearch(query);
    }

    // ── Appel API ──────────────────────────────────────────────────────────
    async function callSearch(query, extraBody) {
      if (isLoading) return;
      isLoading = true;
      sendBtn.disabled = true;
      showTyping(true);

      const body = {
        query,
        session_id: sessionId,
        context:    conversationContext,
      };
      if (extraBody) Object.assign(body, extraBody);

      try {
        const resp = await fetch(`${CONFIG.apiBase}/search`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${CONFIG.token}`,
          },
          body: JSON.stringify(body),
        });

        const data = await resp.json();
        showTyping(false);
        renderResponse(data);
      } catch (err) {
        showTyping(false);
        appendErrorMessage(t('error_net'));
      } finally {
        isLoading = false;
        sendBtn.disabled = false;
        if (!isMobile()) inputEl.focus();
      }
    }

    // ── Rendu des réponses ─────────────────────────────────────────────────
    function renderResponse(data) {
      switch (data.type) {
        case 'results':
          renderResults(data);
          break;
        case 'clarification':
          renderClarification(data);
          break;
        case 'no_results':
          renderNoResults(data);
          break;
        case 'error':
          appendErrorMessage(data.error?.message || t('error_unknown'));
          break;
        default:
          appendErrorMessage(t('error_unexpected'));
      }
    }

    function renderResults(data) {
      const products = data.results || [];

      // Affinage serveur (CDC §6.6) : trop de produits → les questions sont
      // posées en chaîne AVANT d'afficher la liste ; celle-ci reste en main
      // pour le cas « tout je-ne-sais-pas » (aucun nouvel appel API).
      if (products.length > 0 && data.refinement?.questions?.length) {
        startRefinement(data);
        return;
      }

      appendAssistantMessage(data.message);

      if (products.length > 0) {
        renderProductList(products, data.pagination || null);
      }

      // Reset clarification context après résultats
      conversationContext = { previous_clarifications: [] };
      lastClarificationField = null;

      // Avis de satisfaction AVANT le message after_result :
      // le vote (pouce haut/bas) envoie POST /review puis affiche after_result.
      if (products.length > 0) {
        renderReviewPrompt();
      } else {
        appendAssistantMessage(t('after_result'));
      }
    }

    /**
     * Avis utilisateur : pouce haut / pouce bas.
     * Au clic : POST /review { type, rating, session_id } (best-effort),
     * puis affichage du message after_result.
     */
    // restoreRating : passé (non-undefined) lors d'un rejeu figé — 'up'/'down'/null.
    // reuseEntry : entrée déjà persistée à réutiliser (rejeu live du DERNIER
    // message resté sans avis) plutôt que d'en journaliser une nouvelle.
    function renderReviewPrompt(restoreRating, reuseEntry) {
      const THUMB_UP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
      const THUMB_DOWN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;

      const isReplay = restoreRating !== undefined;

      let logEntry = reuseEntry || null;
      if (!logEntry && !isRestoring) {
        logEntry = { t: 'review', rating: null };
        transcript.push(logEntry);
        saveState();
      }

      const content = document.createElement('div');

      const txt = document.createElement('div');
      txt.textContent = t('review_question');
      content.appendChild(txt);

      const btns = document.createElement('div');
      btns.className = 'ep-review-btns';
      btns.setAttribute('role', 'group');
      btns.setAttribute('aria-label', t('review_question'));

      const makeBtn = (rating, label, svg) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `ep-review-btn ep-review-${rating}`;
        btn.setAttribute('aria-label', label);
        btn.title = label;
        btn.innerHTML = svg;
        btn.addEventListener('click', () => {
          btns.querySelectorAll('.ep-review-btn').forEach(b => { b.disabled = true; });
          btn.classList.add('ep-selected');
          if (logEntry) { logEntry.rating = rating; saveState(); }
          sendReview(rating);
          appendAssistantMessage(t('after_result'));
        });
        return btn;
      };

      const upBtn = makeBtn('up', t('review_yes'), THUMB_UP_SVG);
      const downBtn = makeBtn('down', t('review_no'), THUMB_DOWN_SVG);
      btns.appendChild(upBtn);
      btns.appendChild(downBtn);
      content.appendChild(btns);

      // Rejeu figé (toujours avec une note déjà donnée — un rejeu resté sans avis
      // n'arrive ici que s'il n'est PAS le dernier message ; cf. replayEntry) :
      // désactivé, avis passé marqué. Le cas "dernier message sans avis" passe
      // par reuseEntry ci-dessus et reste pleinement interactif.
      if (isReplay) {
        upBtn.disabled = true;
        downBtn.disabled = true;
        if (restoreRating === 'up') upBtn.classList.add('ep-selected');
        else if (restoreRating === 'down') downBtn.classList.add('ep-selected');
      }

      appendAssistantMessageEl(content);
    }

    // Envoi de l'avis — silencieux en cas d'échec (ne bloque pas l'UX)
    async function sendReview(rating) {
      try {
        await fetch(`${CONFIG.apiBase}/review`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${CONFIG.token}`,
          },
          body: JSON.stringify({
            type:       'review',
            rating,
            session_id: sessionId,
          }),
        });
      } catch (err) {
        /* no-op : l'avis est best-effort */
      }
    }

    function renderProductList(products, pagination) {
      // Une seule liste paginable à la fois : le bouton « Voir plus » d'une
      // liste précédente ajouterait les produits de la NOUVELLE recherche à
      // l'ancienne liste — on le retire.
      if (activeList && activeList.loadMoreBtn) {
        activeList.loadMoreBtn.remove();
      }

      const container = document.createElement('div');
      container.className = 'ep-products';

      const cards = document.createElement('div');
      cards.className = 'ep-cards';

      // Chaque entrée garde le produit + son élément pour tri/filtre
      const entries = products.map((product, index) => ({
        product,
        index,
        el: buildProductCard(product),
      }));
      entries.forEach(e => cards.appendChild(e.el));

      activeList = { entries, cardsEl: cards, containerEl: container, pagination, toolbar: null, loadMoreBtn: null, logEntry: null };

      // Historique : la liste de produits accumulés + pointeur courant sont persistés
      // pour être rechargés à la restauration. La même référence est conservée sur
      // activeList afin que « Voir plus » l'enrichisse (cf. fetchNextPage).
      if (!isRestoring) {
        const logEntry = { t: 'products', products: products.slice(), pagination };
        transcript.push(logEntry);
        activeList.logEntry = logEntry;
        saveState();
      }

      // Barre tri + filtre unifié au-delà du seuil — décidé sur le TOTAL de
      // la recherche : la première page seule ne dépasse jamais le seuil.
      if ((pagination ? pagination.total : products.length) > PRODUCTS_TOOLBAR_MIN) {
        const toolbar = buildProductsToolbar(entries, cards, container,
          () => activeList && activeList.containerEl === container && activeList.pagination
            ? activeList.pagination.total
            : entries.length);
        activeList.toolbar = toolbar;
        container.appendChild(toolbar.frag);
      }

      container.appendChild(cards);

      // Pagination serveur : bouton « Voir plus » sous les cartes.
      if (pagination && pagination.has_more) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ep-load-more';
        btn.textContent = t('products_load_more');
        btn.addEventListener('click', fetchNextPage);
        container.appendChild(btn);
        activeList.loadMoreBtn = btn;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'ep-msg ep-msg-assistant ep-msg-wide';
      wrapper.appendChild(container);
      messagesEl.appendChild(wrapper);
      scrollBottom();
    }

    // ── Pagination « Voir plus » ───────────────────────────────────────────
    // La page suivante est demandée à l'API ({session_id, pagination.page}) :
    // le serveur la sert de l'état mémorisé de la recherche, sans nouvel
    // appel LLM. La réponse est traitée ici même (pas via renderResponse) :
    // les cartes s'ajoutent à la liste courante, pas dans une nouvelle bulle.
    async function fetchNextPage() {
      const list = activeList;
      if (!list || !list.loadMoreBtn || list.loadMoreBtn.disabled) return;

      const btn = list.loadMoreBtn;
      btn.disabled = true;

      try {
        const resp = await fetch(`${CONFIG.apiBase}/search`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${CONFIG.token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            pagination: { page: list.pagination.page + 1 },
          }),
        });

        const data = await resp.json();

        // État serveur expiré (TTL) : plus de suite possible — le bouton
        // cède la place à une note, le client relance une recherche.
        if (data.type === 'error' && data.error?.code === 'pagination_expired') {
          const note = document.createElement('div');
          note.className = 'ep-products-expired';
          note.textContent = t('products_expired');
          btn.replaceWith(note);
          list.loadMoreBtn = null;
          return;
        }

        if (data.type !== 'results') {
          btn.disabled = false;
          appendErrorMessage(data.error?.message || t('error_unexpected'));
          return;
        }

        const startIndex = list.entries.length;
        const added = (data.results || []).map((product, i) => ({
          product,
          index: startIndex + i,
          el: buildProductCard(product),
        }));
        added.forEach(e => list.cardsEl.appendChild(e.el));
        list.entries.push(...added);

        list.pagination = data.pagination
          || { ...list.pagination, page: list.pagination.page + 1, has_more: false };

        // Historique : on garde à jour l'entrée persistée dans l'historique pour que la
        // restauration reparte du même contexte de pagination.
        if (list.logEntry) {
          list.logEntry.products.push(...added.map(e => e.product));
          list.logEntry.pagination = list.pagination;
          saveState();
        }

        // Les nouvelles cartes rejoignent le filtre, le tri et le compteur.
        if (list.toolbar) {
          list.toolbar.enrich(added);
          list.toolbar.apply(false);
        }

        if (list.pagination.has_more) {
          btn.disabled = false;
        } else {
          btn.remove();
          list.loadMoreBtn = null;
        }
      } catch (err) {
        btn.disabled = false;
        appendErrorMessage(t('error_net'));
      }
    }

    // ── Affinage des résultats (CDC §6.6) ──────────────────────────────────
    // Le serveur joint `refinement.questions` quand la liste est trop longue.
    // Chaque question est posée à son tour, toujours avec l'option « Je ne
    // sais pas » (critère facultatif). À la fin de la chaîne :
    //   - au moins une réponse → un seul nouvel appel API avec les réponses ;
    //   - que des « je ne sais pas » → la liste initiale, déjà reçue, est
    //     affichée sans appel réseau.
    function startRefinement(data) {
      pendingRefinement = {
        data,
        questions: data.refinement.questions,
        answers: [],
        freezeCurrent: null,
      };
      appendAssistantMessage(data.refinement.message || data.message);
      askRefinementQuestion();
    }

    function askRefinementQuestion() {
      const p = pendingRefinement;
      const question = p.questions[p.answers.length];
      appendAssistantMessage(question.question);

      const options = (question.options || []).map(o => ({ label: o, value: o }));
      options.push({ label: t('refine_dont_know'), value: null });

      // Snapshot persisté : permet de reconstruire pendingRefinement si cette
      // question reste sans réponse et doit être restaurée live (cf. resumeOptionsLive).
      const logExtra = {
        kind: 'refinement',
        refinementSnapshot: { data: p.data, answers: p.answers.slice() },
      };

      const group = appendOptionsGroup(options, (value, label) => {
        appendUserMessage(label);
        recordRefinementAnswer(value);
      }, { logExtra });
      p.freezeCurrent = group ? group.freeze : null;
    }

    function recordRefinementAnswer(value) {
      const p = pendingRefinement;
      p.answers.push({
        criterion: p.questions[p.answers.length].criterion,
        answer: value,
      });
      if (p.answers.length < p.questions.length) {
        askRefinementQuestion();
        return;
      }
      finishRefinement();
    }

    function finishRefinement() {
      const p = pendingRefinement;
      pendingRefinement = null;

      const answered = p.answers.filter(a => a.answer !== null);
      if (answered.length === 0) {
        renderResults({ ...p.data, refinement: null });
        return;
      }

      callSearch(
        answered.map(a => a.answer).join(', '),
        { refinement: { answers: p.answers } }
      );
    }

    /**
     * Barre d'outils produits : filtre texte unifié (nom + marque + réf)
     * et tri (pertinence, prix, nom) via <select> natif (ergonomique mobile).
     *
     * Renvoie { frag, apply, enrich } : `enrich` indexe de nouvelles entrées
     * (pages « Voir plus ») et `apply` rejoue filtre + tri + compteur —
     * `entries` est le tableau PARTAGÉ avec renderProductList, il s'allonge
     * au fil des pages. `getTotal` fournit le total affiché ({n} / {total}),
     * celui de la recherche complète quand la liste est paginée.
     */
    function buildProductsToolbar(entries, cardsEl, containerEl, getTotal) {
      const frag = document.createDocumentFragment();

      // Sentinelle : détecte quand la barre devient collée (ombre portée)
      const sentinel = document.createElement('div');
      sentinel.style.cssText = 'height:1px;margin-bottom:-1px;';
      frag.appendChild(sentinel);

      const toolbar = document.createElement('div');
      toolbar.className = 'ep-products-toolbar';

      const filter = document.createElement('input');
      filter.type = 'text';
      filter.className = 'ep-products-filter';
      filter.placeholder = t('products_filter_placeholder');
      filter.setAttribute('aria-label', t('products_filter_placeholder'));

      const sort = document.createElement('select');
      sort.className = 'ep-products-sort';
      sort.setAttribute('aria-label', t('sort_label'));
      [
        ['relevance',  t('sort_relevance')],
        ['price_asc',  t('sort_price_asc')],
        ['price_desc', t('sort_price_desc')],
        ['name_asc',   t('sort_name_asc')],
        ['name_desc',  t('sort_name_desc')],
      ].forEach(([value, label]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        sort.appendChild(opt);
      });

      toolbar.appendChild(filter);
      toolbar.appendChild(sort);
      frag.appendChild(toolbar);

      const count = document.createElement('div');
      count.className = 'ep-products-count';
      frag.appendChild(count);

      const empty = document.createElement('div');
      empty.className = 'ep-products-empty';
      empty.textContent = t('products_no_match');
      empty.style.display = 'none';
      containerEl.appendChild(empty);

      // Index de recherche unifié : nom + marque + réf (sans accents)
      function enrich(list) {
        list.forEach(e => {
          e.haystack = normStr([e.product.name, e.product.brand, e.product.product_ref]
            .filter(Boolean).join(' '));
          e.priceNum = typeof e.product.price === 'number'
            ? e.product.price
            : parseFloat(e.product.price) || 0;
        });
      }
      enrich(entries);

      const collator = new Intl.Collator(CONFIG.locale, { numeric: true, sensitivity: 'base' });

      if (typeof IntersectionObserver === 'function') {
        new IntersectionObserver(
          ([entry]) => toolbar.classList.toggle('ep-stuck', !entry.isIntersecting),
          { root: messagesEl, threshold: 0 }
        ).observe(sentinel);
      }

      // Remonte en douceur en haut de la liste de produits
      function scrollToListTop() {
        const mRect = messagesEl.getBoundingClientRect();
        const cRect = containerEl.getBoundingClientRect();
        const target = Math.max(0, messagesEl.scrollTop + (cRect.top - mRect.top) - 8);
        if (typeof messagesEl.scrollTo === 'function') {
          messagesEl.scrollTo({ top: target, behavior: 'smooth' });
        } else {
          messagesEl.scrollTop = target;
        }
      }

      function apply(fromUser) {
        // Filtre
        const q = normStr(filter.value.trim());
        let visible = 0;
        entries.forEach(e => {
          e.match = !q || e.haystack.includes(q);
          if (e.match) visible++;
        });

        // Tri
        const sorted = [...entries];
        switch (sort.value) {
          case 'price_asc':  sorted.sort((a, b) => a.priceNum - b.priceNum); break;
          case 'price_desc': sorted.sort((a, b) => b.priceNum - a.priceNum); break;
          case 'name_asc':   sorted.sort((a, b) => collator.compare(a.product.name || '', b.product.name || '')); break;
          case 'name_desc':  sorted.sort((a, b) => collator.compare(b.product.name || '', a.product.name || '')); break;
          default:           sorted.sort((a, b) => a.index - b.index);
        }

        sorted.forEach(e => {
          e.el.style.display = e.match ? '' : 'none';
          cardsEl.appendChild(e.el); // ré-ordonne
        });

        count.textContent = t('products_count', {
          n: visible,
          total: getTotal ? getTotal() : entries.length,
        });
        empty.style.display = visible === 0 ? '' : 'none';

        if (fromUser) scrollToListTop();
      }

      filter.addEventListener('input', () => apply(true));
      sort.addEventListener('change', () => apply(true));
      apply(false);

      return { frag, apply, enrich };
    }

    /**
     * Carte produit — s'appuie sur le payload API réel :
     * { product_ref, name, brand, price, url, compatibility: { compatible, n_sources, label } }
     * `image_url` est optionnel (absent du payload actuel).
     */
    function buildProductCard(product) {
      const card = document.createElement('a');
      card.className = 'ep-card';
      card.href = product.url || '#';
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.setAttribute('aria-label', `${product.name || ''} – ${t('view_product')}`);

      const n = product.compatibility?.n_sources || 0;
      const tip = n > 1 ? t('compat_tip', { n }) : (product.compatibility?.label || t('compat_label'));
      const badgeLabel = product.compatibility?.label || t('compat_label');

      const imgHtml = product.image_url
        ? `<img class="ep-card-img" src="${escHtml(product.image_url)}" alt="" loading="lazy" onerror="this.remove()">`
        : '';

      card.innerHTML = `
        ${imgHtml}
        <div class="ep-card-body">
          <div class="ep-card-topline">
            <span class="ep-card-brand">${escHtml(product.brand || '')}</span>
            <span class="ep-card-ref">${t('ref_label')} ${escHtml(product.product_ref || '')}</span>
          </div>
          <div class="ep-card-name">${escHtml(product.name || '')}</div>
          <div class="ep-card-bottomline">
            <span class="ep-card-price">${escHtml(formatPrice(product.price))}</span>
            <span class="ep-badge" title="${escHtml(tip)}">${escHtml(badgeLabel)}</span>
          </div>
        </div>
        <svg class="ep-card-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      return card;
    }

    /**
     * Clarification : question + options servies par l'API, re-soumises
     * comme un message utilisateur.
     */
    function renderClarification(data) {
      appendAssistantMessage(data.message);

      lastClarificationField = data.clarification?.field || null;

      const options = (data.clarification?.options || [])
        .map(option => ({ label: option, value: option }));

      appendOptionsGroup(options, value => {
        // Enregistrer la clarification dans le contexte
        conversationContext.previous_clarifications.push({
          field:  lastClarificationField,
          answer: value,
        });
        // Re-soumettre comme si l'utilisateur avait tapé l'option
        appendUserMessage(value);
        callSearch(value);
      }, { logExtra: { kind: 'clarification', field: lastClarificationField } });
    }

    /**
     * Groupe d'options cliquables (clarifications, questions d'affinage) :
     * - ≤ CLARI_CHIPS_MAX options → puces horizontales (comportement historique)
     * - au-delà → liste verticale scrollable ; champ de filtre à partir de CLARI_FILTER_MIN
     *
     * options : [{ label, value }] ; au clic le groupe est gelé puis
     * onSelect(value, label) est appelé. Retourne { freeze } pour geler le
     * groupe de l'extérieur (réponse saisie au clavier pendant un affinage).
     *
     * config.restoreSelectedIndex : lors du reload, fige le groupe sur l'option
     * choisie (index dans `options`, ou -1 si la question n'avait pas reçu de
     * réponse). Omis (undefined) → le groupe reste pleinement interactif.
     * config.reuseEntry : entrée déjà persistée à réutiliser (rejeu live du
     * DERNIER message resté sans réponse) plutôt que d'en journaliser une nouvelle.
     * config.logExtra : champs additionnels fusionnés dans l'entrée créée (kind,
     * field, refinementSnapshot…) pour permettre sa reconnexion lors d'un reload.
     */
    function appendOptionsGroup(options, onSelect, config) {
      if (options.length === 0) return null;
      config = config || {};
      const restoreSelectedIndex = config.restoreSelectedIndex;

      // Historique : le groupe d'options est persisté ; `selectedIndex` est renseigné
      // au clic pour rejouer la sélection figée à la restauration.
      let logEntry = config.reuseEntry || null;
      if (!logEntry && !isRestoring) {
        logEntry = {
          t: 'options',
          options: options.map(o => ({ label: o.label, value: o.value })),
          selectedIndex: -1,
          ...(config.logExtra || {}),
        };
        transcript.push(logEntry);
        saveState();
      }

      const isList = options.length > CLARI_CHIPS_MAX;
      const hasFilter = options.length >= CLARI_FILTER_MIN;

      const container = document.createElement('div');
      container.className = 'ep-clari';

      let filterInput = null;
      let emptyNote = null;

      if (isList && hasFilter) {
        filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = 'ep-clari-filter';
        filterInput.placeholder = t('filter_placeholder');
        filterInput.setAttribute('aria-label', t('filter_placeholder'));
        container.appendChild(filterInput);

        const count = document.createElement('div');
        count.className = 'ep-clari-count';
        count.textContent = t('options_count', { n: options.length });
        container.appendChild(count);
      }

      const opts = document.createElement('div');
      opts.className = isList ? 'ep-clari-list' : 'ep-clari-opts';
      opts.setAttribute('role', 'group');

      let frozen = false;

      // Marquer la sélection éventuelle, geler le groupe
      function freeze(selectedBtn) {
        if (frozen) return;
        frozen = true;
        buttons.forEach(b => {
          b.disabled = true;
          if (b !== selectedBtn) b.style.display = isList ? 'none' : '';
        });
        if (selectedBtn) selectedBtn.classList.add('ep-selected');
        if (filterInput) filterInput.remove();
        if (emptyNote) emptyNote.remove();
        const countEl = container.querySelector('.ep-clari-count');
        if (countEl) countEl.remove();
      }

      const buttons = options.map((option, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ep-clari-btn';
        btn.textContent = option.label;
        btn.addEventListener('click', () => {
          if (isLoading || frozen) return;
          freeze(btn);
          if (logEntry) { logEntry.selectedIndex = i; saveState(); }
          onSelect(option.value, option.label);
        });
        opts.appendChild(btn);
        return btn;
      });

      container.appendChild(opts);

      if (filterInput) {
        emptyNote = document.createElement('div');
        emptyNote.className = 'ep-clari-empty';
        emptyNote.textContent = t('filter_no_match');
        emptyNote.style.display = 'none';
        container.appendChild(emptyNote);

        filterInput.addEventListener('input', () => {
          const q = normStr(filterInput.value.trim());
          let visible = 0;
          buttons.forEach(b => {
            const match = !q || normStr(b.textContent).includes(q);
            b.style.display = match ? '' : 'none';
            if (match) visible++;
          });
          emptyNote.style.display = visible === 0 ? '' : 'none';
        });
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'ep-msg ep-msg-assistant ep-msg-wide';
      wrapper.appendChild(container);
      messagesEl.appendChild(wrapper);
      scrollBottom();

      if (typeof restoreSelectedIndex === 'number') {
        freeze(restoreSelectedIndex >= 0 ? buttons[restoreSelectedIndex] : null);
      }

      return { freeze: () => freeze(null) };
    }

    // Construit la bulle « aucun résultat » (message + suggestions éventuelles).
    function buildNoResults(message, suggestions) {
      const container = document.createElement('div');

      const msgDiv = document.createElement('div');
      msgDiv.textContent = message;
      container.appendChild(msgDiv);

      if (suggestions && suggestions.length > 0) {
        const sugg = document.createElement('div');
        sugg.className = 'ep-suggestions';
        sugg.innerHTML = `<p>${escHtml(t('suggestions'))}</p><ul>${
          suggestions.map(s => `<li>${escHtml(s)}</li>`).join('')
        }</ul>`;
        container.appendChild(sugg);
      }
      return container;
    }

    function renderNoResults(data) {
      appendAssistantMessageEl(buildNoResults(data.message, data.suggestions));

      if (!isRestoring) {
        transcript.push({
          t: 'no_results',
          message: data.message,
          suggestions: data.suggestions || [],
        });
        conversationContext = { previous_clarifications: [] };
        saveState();
      }
    }

    // ── Helpers DOM ────────────────────────────────────────────────────────
    function appendUserMessage(text) {
      const div = document.createElement('div');
      div.className = 'ep-msg ep-msg-user';
      const bubble = document.createElement('div');
      bubble.className = 'ep-bubble';
      bubble.textContent = text;
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      scrollBottom();
      if (!isRestoring) { transcript.push({ t: 'user', text }); saveState(); }
    }

    function appendAssistantMessage(text) {
      const div = document.createElement('div');
      div.className = 'ep-msg ep-msg-assistant';
      const bubble = document.createElement('div');
      bubble.className = 'ep-bubble';
      bubble.textContent = text;
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      scrollBottom();
      if (!isRestoring) { transcript.push({ t: 'assistant', text }); saveState(); }
    }

    function appendAssistantMessageEl(el) {
      const div = document.createElement('div');
      div.className = 'ep-msg ep-msg-assistant';
      const bubble = document.createElement('div');
      bubble.className = 'ep-bubble';
      bubble.appendChild(el);
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      scrollBottom();
    }

    function appendErrorMessage(text) {
      const div = document.createElement('div');
      div.className = 'ep-msg ep-msg-assistant ep-msg-error';
      const bubble = document.createElement('div');
      bubble.className = 'ep-bubble';
      bubble.textContent = text;
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      scrollBottom();
    }

    function showTyping(visible) {
      typingEl.classList.toggle('ep-visible', visible);
      if (visible) scrollBottom();
    }

    function scrollBottom() {
      requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }
  }

  // ── HTML interne de la fenêtre ─────────────────────────────────────────────
  function buildWindowHTML() {
    return `
      <div id="ep-header">
        <div id="ep-header-logo">
          ${LOGO_SVG}
        </div>
        <div id="ep-header-actions">
          <button id="ep-reset-btn" class="ep-header-btn" aria-label="${t('new_conversation')}" title="${t('new_conversation')}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              <circle cx="18" cy="18" r="6.5" fill="var(--ep-primary)"></circle>
              <path d="M18 15.5v5M15.5 18h5" stroke="var(--ep-dark)" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>
          <button id="ep-close-btn" class="ep-header-btn" aria-label="${t('close')}" title="${t('close')}">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 1L17 17M1 17L17 1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="ep-messages" role="log" aria-live="polite" aria-label="${t('aria_conversation')}"></div>
      <div id="ep-typing" aria-live="polite" aria-label="${t('typing')}">
        <span class="ep-dot"></span>
        <span class="ep-dot"></span>
        <span class="ep-dot"></span>
        <span>${t('typing')}</span>
      </div>
      <div id="ep-input-area">
        <input
          id="ep-input"
          type="text"
          placeholder="${t('placeholder')}"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          enterkeyhint="send"
          aria-label="${t('placeholder')}"
          maxlength="300"
        />
        <button id="ep-send-btn" aria-label="${t('send')}" title="${t('send')}">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M16 2L1 9L7 11M16 2L9 17L11 11M16 2L7 11M7 11L11 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  // ── Utilitaire XSS ────────────────────────────────────────────────────────
  function escHtml(str) {
    if (typeof str !== 'string') str = String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  if (!CONFIG.token) {
    console.error('[EveryParts Widget] data-token manquant sur la balise <script>.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
