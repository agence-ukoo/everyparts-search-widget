/**
 * everyparts-widget-loader.js — point d'entrée des boutiques (étage 1/2)
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ CONTRAINTE NON NÉGOCIABLE                                                 │
 * │ Ce fichier DOIT être servi avec :                                         │
 * │     Cache-Control: no-cache                                               │
 * │ (ou `max-age=0, must-revalidate`). Servi avec un max-age long — ou depuis  │
 * │ jsDelivr `@latest`, qui impose max-age=604800 — le loader devient lui-même │
 * │ obsolète dans les caches navigateurs et TOUT ce dispositif ne sert à rien. │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * POURQUOI CE FICHIER EXISTE
 * L'URL du snippet, chez les boutiques, ne change jamais. Une entrée déjà
 * stockée dans un cache navigateur est hors d'atteinte : ni un purge CDN, ni un
 * en-tête envoyé plus tard ne peuvent l'invalider. Seul compte ce qui a été
 * envoyé au moment du téléchargement. D'où deux étages :
 *
 *   1. CE loader, minuscule et `no-cache` : revalidé à chaque chargement de page
 *      (304 de ~150 octets), il porte la version courante du widget ;
 *   2. le widget lui-même, sur une URL ÉPINGLÉE et donc `immutable`
 *      (jsDelivr renvoie max-age=31536000 sur un tag) : téléchargé une fois,
 *      jamais revalidé, bande passante CDN gratuite conservée.
 *
 * Une nouvelle version est donc active au prochain chargement de page, au lieu
 * de 7 jours. Cela ramène surtout la fenêtre pendant laquelle d'anciens widgets
 * dialoguent avec l'API de 7 jours à un chargement de page.
 *
 * INTÉGRATION (inchangée pour les boutiques, hormis le src)
 * <script
 *   src="https://cdn.everyparts.io/widget/v1/loader.js"
 *   data-token="[TOKEN]"
 *   data-locale="fr-FR"
 *   data-position="bottom-right"
 *   data-api="https://everyparts-api-hub.jcloud.ik-server.com/api/v1"
 *   defer></script>
 *
 * EN-TÊTES SELON L'HÉBERGEMENT
 *   Cloudflare Pages / Netlify — fichier `_headers` :
 *     /widget/v1/loader.js
 *       Cache-Control: no-cache
 *   nginx :
 *     location = /widget/v1/loader.js { add_header Cache-Control "no-cache" always; }
 *   Apache (.htaccess) :
 *     <Files "loader.js">
 *       Header set Cache-Control "no-cache"
 *     </Files>
 *   Laravel (route sur l'API hub) :
 *     return response()->file($path, [
 *       'Content-Type'  => 'application/javascript; charset=utf-8',
 *       'Cache-Control' => 'no-cache',
 *     ]);
 *   Bunny / CloudFront : régler le TTL navigateur à 0 en respectant l'origine.
 *
 * Vérifier après déploiement :
 *   curl -sI https://…/loader.js | grep -i cache-control     → doit dire no-cache
 *
 * NE PAS ÉDITER les constantes ci-dessous à la main : elles sont régénérées par
 * `tools/release.sh <version>`, qui garantit que l'URL et l'empreinte SRI
 * correspondent au `.min.js` réellement publié.
 */
(function () {
  'use strict';

  /* @generated-begin — régénéré par tools/release.sh */
  var WIDGET_URL = 'https://cdn.jsdelivr.net/gh/agence-ukoo/everyparts-search-widget@1.2.4/everyparts-widget.min.js';
  var WIDGET_SRI = 'sha384-ao3T/jWZN69jpStEa62KTw3kGvyymtk1C3zDDVRCFBmoQyRZOavVb6vh5P2RFfez';
  /* @generated-end */

  // Snippet présent deux fois sur la page : on ne charge qu'une instance, mais on
  // le signale — un doublon silencieux se paierait en tickets support.
  if (window.__everypartsWidgetLoader) {
    console.warn('[EveryParts] Le snippet du widget est présent plusieurs fois sur cette page ; seule la première occurrence est chargée.');
    return;
  }
  window.__everypartsWidgetLoader = true;

  // Même résolution que le widget : currentScript, avec repli si le script a été
  // chargé en async et que currentScript est indisponible.
  var self = document.currentScript || (function () {
    var all = document.querySelectorAll('script[data-token]');
    return all[all.length - 1];
  })();

  if (!self) {
    console.error('[EveryParts] Loader : balise <script> introuvable, configuration illisible. Le widget ne sera pas chargé.');
    return;
  }

  var el = document.createElement('script');

  // Recopie des data-* sur la balise injectée : le widget lit sa configuration via
  // document.currentScript, qui désignera CETTE balise. C'est ce qui permet de ne
  // rien changer au widget lui-même.
  var attrs = self.attributes;
  for (var i = 0; i < attrs.length; i++) {
    if (attrs[i].name.indexOf('data-') === 0) {
      el.setAttribute(attrs[i].name, attrs[i].value);
    }
  }

  el.src = WIDGET_URL;
  el.async = true;

  // SRI : légitime ici précisément parce que l'URL est épinglée et immutable — son
  // contenu ne peut pas changer sous nos pieds. Protège les boutiques d'une
  // compromission du CDN. Vide → pas de contrôle (build de dev).
  if (WIDGET_SRI) {
    el.integrity = WIDGET_SRI;
    el.crossOrigin = 'anonymous';
  }

  // Règle du dépôt : échouer bruyamment, ne jamais faire semblant. Un widget
  // absent doit être diagnosticable depuis la console de la boutique.
  el.onerror = function () {
    console.error(
      '[EveryParts] Échec du chargement du widget depuis ' + WIDGET_URL +
      ' — causes possibles : CDN injoignable, CSP de la boutique bloquant cdn.jsdelivr.net, ' +
      'ou empreinte SRI ne correspondant plus au fichier publié.'
    );
  };

  (document.head || document.documentElement).appendChild(el);
})();
