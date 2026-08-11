# Télémétrie comportementale — module `Telemetry`

Un seul point d'entrée : `Telemetry.track(event, payload, sessionId?)`.
Aucun `fetch` de télémétrie ailleurs dans le widget. Le module vit dans
`everyparts-widget.js`, juste avant l'état de conversation.

`POST {apiBase}/events`

## Quel événement part sur quelle interaction

| Événement | Déclencheur dans le widget | Charge utile envoyée |
|---|---|---|
| `session_start` | **La première ouverture du panneau** — jamais au simple chargement de la page. Puis à chaque rotation de `session_id` via `rotateSession()` : fin de recherche (`result_shown`), « Nouvelle conversation » (`new_conversation`), « Modifier » la moto (`model_reset`). Une conversation restaurée **reprend** la sienne, sans réémettre. | `url`, `referrer`, `locale` |
| `session_end` | Le `session_id` est remplacé par `rotateSession()` — **sauf si la session courante n'a encore reçu aucun message** (voir plus bas) — et au montage avec `reason: "session_expired"`, quand `loadState()` écarte un état expiré par le TTL de 30 min — seule clôture constatable, émise même si le visiteur n'ouvre pas le widget puisque la session a réellement existé. **Pas** au départ de la page : la conversation est persistée et reprend au rechargement. | `duration_ms`, `message_count`, `reason` *(un de `new_conversation`, `model_reset`, `result_shown`, `session_expired`)* |
| `widget_open` | `toggleWindow(true)` — chaque ouverture du panneau | `url` *(requis)*, `page_title`, `referrer` |
| `widget_close` | `toggleWindow(false)`, et sur `pagehide` si le panneau était ouvert. **Pas** sur un changement d'onglet. | `open_ms`, `url` |
| `product_click` | Clic sur une carte produit | `product_ref` *(requis)*, `position`, `page`, `query`, `interpreted`, `model_confirmed`, `result_count` (= `pagination.total`), `price`, `currency`, `name`, `brand`, `url` |
| `samples_click` | Clic sur une suggestion « Essayez » de l'accueil | `sample` *(requis)*, `position`, `sample_count` |
| `review_submit` | Clic sur un pouce (haut ou bas). **Repart une seconde fois**, sans `has_comment`, avec `with_comment: true`, quand le motif d'un avis négatif est réellement soumis (canné ou texte libre) — le premier envoi ne le sait pas encore. Jamais le libellé ni le texte du motif. | `rating` *(requis)*, `has_comment`, `with_comment` |
| `parts_request_open` | Ouverture de la fiche de demande de pièce | `query`, `reason` |
| `parts_request_close` | Fermeture **sans** avoir soumis | `filled` |
| `parts_request_submit` | 201 de `/parts-request` | `has_message`, `consent` |

## Ce qui ne part jamais

Aucune donnée personnelle ne transite par `/events` : ni adresse e-mail, ni
téléphone, ni texte de message, ni texte de commentaire. Ces données ont leurs
propres endpoints (`/parts-request`, `/review`) et seraient de toute façon
écartées ici. Un test le vérifie sur l'intégralité des corps émis.

## File et envoi

- Les événements sont empilés en mémoire avec un horodatage `performance.now()`.
- Vidage sur : **20 entrées**, un **debounce d'inactivité de 5 s**, `pagehide`, ou
  `visibilitychange`→`hidden`.
- Ces deux derniers ont des rôles **distincts**, et les confondre produisait quatre
  faux événements (onglet changé, rafraîchissement compté double, session terminée
  alors qu'elle survit) :
  - `visibilitychange`→`hidden` **vide seulement la file**. Changer d'onglet n'est ni
    une fermeture du panneau ni une fin de session — mais c'est la dernière occasion
    fiable d'expédier ce qui attend, sur mobile où l'onglet peut ne jamais être
    « déchargé ».
  - `pagehide` ferme le panneau s'il était ouvert, une seule fois : un
    rafraîchissement déclenche les deux événements, et `pagehide` peut se répéter.
- `age_ms` est calculé **au vidage**, jamais à l'empilement, et jamais depuis
  `Date.now()` : une horloge client décalée placerait l'événement dans le futur
  ou hors de la fenêtre de rétention.
- Découpe automatique si un lot dépasse 20 entrées ou 10 000 octets.
- `fetch(..., { keepalive: true })` et **non** `navigator.sendBeacon`, qui ne sait
  pas poser l'en-tête `Authorization` et ne peut donc pas s'authentifier.

Une session ne s'ouvre qu'à la **première ouverture du panneau**. Un visiteur qui
se rend sur le site sans jamais toucher au widget n'émet donc rien du tout —
sinon chaque page vue compterait comme une session et faussait les statistiques.
Sur un `session_end` « session_expired », `duration_ms` est **omis** : l'instant
de début n'a jamais été persisté, et l'inventer serait faux. `message_count` est
recompté depuis l'historique écarté.

**`rotateSession(reason)`** est le seul point qui remplace `session_id` (hors
expiration TTL) : il ne le fait que si la session courante a reçu **au moins un
message** (`telemetryMessages > 0`). Cliquer 10 fois de suite sur « Nouvelle
conversation », ou sur « Modifier » juste après une rotation post-recherche, sans
jamais écrire entre-temps, ne crée donc PAS 10 sessions vides — la session en
cours, n'ayant servi à rien, garde simplement son `session_id` et aucun
`session_end`/`session_start` ne part. L'effet visuel de rafraîchissement (fil
vidé, accueil réaffiché, moto réinitialisée…) tourne dans tous les cas : seule la
télémétrie de rotation est court-circuitée.

Le `session_id` est capturé **à l'empilement**, pas au vidage : le widget en
renouvelle un à chaque recherche aboutie, et un événement doit rester rattaché à
la recherche qui l'a produit. Le `session_id` de tête du lot sert de défaut ; une
entrée d'une autre session porte le sien.

## Comportement en cas d'erreur

| Réponse | Réaction |
|---|---|
| `201` | Rien en production. |
| `4xx` | **Jamais de réessai.** Les entrées sont perdues, elles échoueraient identiquement. |
| `429` / `5xx` | La file est vidée et le module **se tait pour toute la visite**. La télémétrie ne doit jamais marteler l'endpoint qui sert aussi les recherches. |
| `429 event_quota_exceeded` | Idem, plus un drapeau en `sessionStorage` pour que les autres pages de l'onglet ne réessaient pas. Rien n'est montré au visiteur, et la **recherche n'est pas affectée** — elle a son propre quota. |
| Panne réseau | Silence complet. |

La validation est faite **localement avant d'empiler** : un lot est tout-ou-rien
côté serveur, une entrée invalide rejetterait l'ensemble, et une requête refusée
coûte quand même un crédit de quota. Les clés inconnues sont écartées (pour que
`meta.ignored` reste vide) et un événement dont un champ **requis** est invalide
est purement abandonné.

## Mise au point — `data-debug`

`data-debug="true"` sur la balise script fait journaliser **tout** le cycle en
console, préfixé `[PartsMind]` — la console d'une boutique est partagée avec son
thème et ses autres scripts, il faut reconnaître d'un coup d'œil ce qui vient du
widget. Sans l'attribut, **rien n'est écrit** : un test le vérifie.

Les traces sont en anglais, comme le reste du code. Ce qui est tracé :

| Trace | Quand |
|---|---|
| `event.<name> {payload} · session <id> · queue <n>` | chaque événement empilé |
| `event.widget_close {payload} · subject <path> · session <id> · queue <n>` | idem, pour `widget_close` — le chemin d'URL (pas l'URL complète, noyée dans le payload) sort en tête pour repérer la page d'un coup d'œil |
| `event.<name> dropped at validation: {brut}` | type inconnu, champ requis invalide, payload > 4 000 octets |
| `event.<name> ignored, no session` / `ignored, telemetry disabled` | émission impossible |
| `flushing N event(s) in M request(s): …` | à chaque vidage |
| `201 · stored (n)` | succès |
| `fields dropped by server: […]` | `meta.ignored` non vide — **le** signal qui attrape une faute de frappe dans un nom de champ |
| `rejected <status> <code> {meta}` | 4xx, avec `meta.field` / `meta.index` |
| `telemetry disabled for this visit` | 429 ou 5xx |
| `network failure, events lost` | `fetch` en échec |

La rotation de session se lit directement dans le journal : un `event.session_end`
suivi d'un `event.session_start` portant un identifiant différent. `session_end`
porte **toujours** un `reason` (`close` | `timeout` | `navigation`) — le champ est
marqué requis dans le schéma local, donc un appelant qui l'omettrait verrait
l'événement abandonné plutôt que parti incomplet. Une rotation implicite (comme
celle qui suit chaque retour de résultats produits, avant la recherche suivante)
compte comme `close` au même titre qu'une rotation explicite (« Nouvelle
conversation », « Modifier »).

## Coût

Le comptage est **par requête**, pas par événement : un lot de 20 coûte un crédit,
comme un envoi unitaire. Le groupage est donc réellement moins cher pour la
boutique — d'où le debounce plutôt qu'un envoi immédiat, sauf pour
`product_click` qui est vidé tout de suite (en keepalive, sans attendre la
réponse, pour ne pas retarder l'ouverture du lien).

## Tests

`tests/telemetry.test.html` — 48 assertions : groupage, `age_ms` calculé au
vidage, forme du corps, `reason` toujours présent sur `session_end` (y compris
après un retour de résultats), `review_submit` reparti avec `with_comment` au
moment où le motif d'un avis négatif est soumis (canné ou texte libre) sans
jamais transporter son libellé ni son texte, 4xx non réessayé, 429 qui fait
taire le module, absence de données personnelles, et le fait qu'une panne de
télémétrie ne casse ni la recherche ni la navigation.
