# Télémétrie comportementale — module `Telemetry`

Un seul point d'entrée : `Telemetry.track(event, payload, sessionId?)`.
Aucun `fetch` de télémétrie ailleurs dans le widget. Le module vit dans
`everyparts-widget.js`, juste avant l'état de conversation.

`POST {apiBase}/events`

## Quel événement part sur quelle interaction

| Événement | Déclencheur dans le widget | Charge utile envoyée |
|---|---|---|
| `session_start` | **La première ouverture du panneau** — jamais au simple chargement de la page. Puis à chaque rotation de `session_id` : immédiatement pour « Nouvelle conversation »/« Modifier » (actions volontaires), au premier vrai message envoyé pour la rotation automatique de fin de recherche (`result_shown`) — voir *Rotation paresseuse* plus bas. Une conversation restaurée **reprend** la sienne, sans réémettre. | `url`, `referrer`, `locale` |
| `session_end` | Symétrique de `session_start` : émis au même moment, pour la session qui vient de se terminer — **sauf si la session courante n'a encore reçu aucun message**, auquel cas rien ne part (voir plus bas). Et au montage avec `reason: "session_expired"`, quand `loadState()` écarte un état expiré par le TTL de 30 min — seule clôture constatable sans ouverture du widget, la session ayant réellement existé. **Pas** au départ de la page : la conversation est persistée et reprend au rechargement. | `duration_ms`, `message_count`, `reason` *(un de `new_conversation`, `model_reset`, `result_shown`, `session_expired`)* |
| `widget_open` | `toggleWindow(true)` — chaque ouverture du panneau | `url` *(requis)*, `page_title`, `referrer` |
| `widget_close` | `toggleWindow(false)`, et sur `pagehide` si le panneau était ouvert. **Pas** sur un changement d'onglet. | `open_ms`, `url` |
| `product_click` | Clic sur une carte produit | `product_ref` *(requis)*, `position`, `page`, `query`, `interpreted`, `model_confirmed`, `result_count` (= `pagination.total`), `price`, `currency`, `name`, `brand`, `url` |
| `samples_click` | Clic sur une suggestion « Essayez » de l'accueil | `sample` *(requis)*, `position`, `sample_count` |
| `review_submit` | Clic sur un pouce (haut ou bas). **Repart une seconde fois**, avec `with_comment: true`, quand le motif d'un avis négatif est réellement soumis (canné ou texte libre) — le premier envoi ne le sait pas encore. Jamais le libellé ni le texte du motif. | `rating` *(requis)*, `with_comment` |
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

### Rotation paresseuse (`rotateSession` / `appendUserMessage`)

`sessionId` ne tourne **pas** dès qu'un résultat est affiché — c'est le seul
cas différé. `rotateSession('result_shown')` se contente de mémoriser le motif
de la **prochaine** rotation (`pendingRotationReason`) sans rien changer
d'autre. Rien, entre l'affichage d'un résultat et le message suivant, n'a
besoin du nouvel identifiant : un `product_click` ou un `review_submit`
déclenché sur ces résultats capture son propre `session_id` à sa création
(`list.sessionId`, `reviewSessionId`) et reste donc, à raison, rattaché à la
session encore en cours. Le seul consommateur du `sessionId` courant est
`callSearch()`, au moment de composer le **prochain** `/search` (le serveur
tient l'état conversationnel par `session_id`, CDC §8) — c'est pourquoi cette
rotation-là n'a besoin d'exister qu'à cet instant, pas avant :

```
résultat affiché → rotateSession('result_shown') note juste le motif
  ↳ clic sur un produit / avis laissé → toujours sous l'ancienne session (cohérent)
  ↳ … puis un nouveau message est envoyé → SEULEMENT LÀ : sessionId tourne,
    session_end(ancienne) + session_start(nouvelle) partent
```

`appendUserMessage()` est l'endroit qui concrétise cette rotation en attente,
juste avant de compter le message qui la déclenche : si la session en cours a
reçu **au moins un message** (`telemetryMessages > 0`), elle se clôt avec le
motif mémorisé et une nouvelle s'ouvre ; sinon (jamais utilisée), rien ne se
passe et `sessionId` ne change même pas — pas de session vide en rafale sur
des clics répétés sans jamais écrire.

**« Nouvelle conversation » et « Modifier » restent immédiats**, sans
attendre le prochain message — ce sont des actions volontaires de
l'utilisateur, pas une rotation automatique dont l'à-propos est encore
incertain. `rotateSession(reason)` avec un `reason` autre que `result_shown`
efface d'abord tout `pendingRotationReason` en attente (il n'a plus lieu
d'être, qu'une rotation immédiate se déclenche ci-dessous ou non — session
déjà vide), puis clôt/rouvre tout de suite si la session en cours a servi.
Sans cet effacement, un `result_shown` resté en attente survivrait, muet,
jusqu'au message suivant, et déciderait alors à tort si CE message doit
rouvrir une session déjà refermée par l'action explicite entre-temps.

Le `session_id` d'un `product_click`/`review_submit` est capturé **à
l'empilement**, pas au vidage : le widget en renouvelle un à chaque recherche
aboutie, et un événement doit rester rattaché à la recherche qui l'a produit.
Le `session_id` de tête du lot sert de défaut ; une entrée d'une autre session
(le `session_start` d'une rotation, dont l'id diffère du `session_end` qui le
précède dans le même lot) porte le sien.

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

La rotation de session se lit directement dans le journal, mais **décalée par
rapport au moment où elle a été demandée uniquement pour un résultat affiché**
(`result_shown`) : `event.session_end` suivi d'un `event.session_start`
portant un identifiant différent n'apparaissent alors qu'au prochain message
envoyé. Entre les deux, un `product_click` ou un `review_submit` peut très
bien apparaître, encore rattaché à l'ancienne session : c'est le comportement
voulu (voir *Rotation paresseuse* plus haut), pas un événement mal ordonné.
« Nouvelle conversation » et « Modifier », eux, restent immédiats dans le
journal. `session_end` porte **toujours** un `reason` (`new_conversation` |
`model_reset` | `result_shown` | `session_expired`) — le champ est marqué
requis dans le schéma local, donc un appelant qui l'omettrait verrait
l'événement abandonné plutôt que parti incomplet.

## Coût

Le comptage est **par requête**, pas par événement : un lot de 20 coûte un crédit,
comme un envoi unitaire. Le groupage est donc réellement moins cher pour la
boutique — d'où le debounce plutôt qu'un envoi immédiat, sauf pour
`product_click` qui est vidé tout de suite (en keepalive, sans attendre la
réponse, pour ne pas retarder l'ouverture du lien).

## Tests

`tests/telemetry.test.html` — 63 assertions : groupage, `age_ms` calculé au
vidage, forme du corps, sessions vides non créées en rafale, rotation
paresseuse de bout en bout (résultat affiché → `sessionId` inchangé →
« Nouvelle conversation » pendant l'attente déclenche la rotation tout de
suite avec le motif le plus récent, pas le `result_shown` en attente → aucune
rotation fantôme au message suivant), `product_click` toujours rattaché à la
session courante tant qu'elle n'a pas tourné,
`review_submit` reparti avec `with_comment` au moment où le motif d'un avis
négatif est soumis (canné ou texte libre) sans jamais transporter son libellé
ni son texte, 4xx non réessayé, 429 qui fait taire le module, absence de
données personnelles, et le fait qu'une panne de télémétrie ne casse ni la
recherche ni la navigation.
