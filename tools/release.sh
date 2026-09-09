#!/usr/bin/env bash
#
# release.sh — prépare une release du widget EveryParts.
#
#   ./tools/release.sh 1.2.3          minifie le widget et calcule le SRI
#   ./tools/release.sh verify 1.2.3   vérifie que GitHub sert bien le fichier attendu
#
# Une version déjà taguée est refusée par le script — voir assert_version_free.
#
# La livraison repose sur un dispositif à deux étages (loader `no-cache` +
# widget épinglé `immutable`), tous deux possédés par le hub de livraison
# (everyparts-api-hub) : l'étage 1 est engendré par le hub à chaque requête
# (`WidgetLoaderScript`), et l'étage 2 est un artefact importé UNE FOIS par le
# hub depuis `raw.githubusercontent.com` (`widget:engine:import`, dépôt public,
# sans authentification), puis hébergé et servi par le hub lui-même. `verify`
# ci-dessous interroge cette même URL, celle que `widget:engine:import` résout
# côté hub.
#
# ORDRE DES OPÉRATIONS (important) :
#   1. ./tools/release.sh 1.2.3
#   2. git add -A && git commit && git tag 1.2.3 && git push origin 1.2.3
#   3. ./tools/release.sh verify 1.2.3        ← le tag doit exister sur GitHub
#   4. côté hub : widget:engine:enable 1.2.3 (ou l'épingler sur un seul site
#      pour canari) — `verify` a déjà déclenché l'import lui-même
#
# `verify` notifie le hub une fois le tag confirmé — voir notify_hub.
# HUB_ENGINE_IMPORT_URL et HUB_ENGINE_IMPORT_SECRET viennent de .env.release, à
# la racine du dépôt (non versionné — voir .env.release.example), ou de
# l'environnement s'il est déjà exporté. Ni l'un ni l'autre : la commande
# d'import à lancer à la main s'affiche à la place, sans faire échouer le
# script — cette étape reste facultative pour qui n'a pas accès au hub depuis
# cette machine.

set -euo pipefail

REPO_SLUG="agence-ukoo/everyparts-search-widget"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/everyparts-widget.js"
MIN="$ROOT/everyparts-widget.min.js"

[[ -f "$ROOT/.env.release" ]] && source "$ROOT/.env.release"

die() { printf '\033[31merreur :\033[0m %s\n' "$1" >&2; exit 1; }
ok()  { printf '\033[32m✓\033[0m %s\n' "$1"; }

sri_of() { openssl dgst -sha384 -binary "$1" | openssl base64 -A; }

# Minifie en conservant la convention du dépôt : terser -c -m, sans newline final.
minify() {
  local in="$1" out="$2" tmp
  tmp="$(mktemp)"
  npx --no-install terser "$in" -c -m -o "$tmp" \
    || die "terser indisponible — installez-le (npm i -g terser) ou ajustez ce script."
  printf '%s' "$(cat "$tmp")" > "$out"
  rm -f "$tmp"
  node --check "$out" || die "le fichier minifié $out est invalide."
}

# La même URL que `widget:engine:import` résout côté hub : `raw.githubusercontent.com`,
# le segment de version étant littéralement le tag git demandé. Vérifier ICI, c'est
# vérifier exactement ce que le hub va effectivement télécharger.
widget_url() { echo "https://raw.githubusercontent.com/${REPO_SLUG}/${1}/everyparts-widget.min.js"; }

# Les tags du dépôt ne portent PAS de préfixe « v » (1.0.9, 1.1.0, 1.1.1…) : ce
# segment de version est un ref git littéral, aussi bien pour l'URL ci-dessus que
# pour `widget:engine:import` côté hub — préfixer casserait les deux.
remote_tags() { git ls-remote --tags origin 2>/dev/null | awk '{print $2}' | sed 's#refs/tags/##' | grep -v '\^{}'; }

# Garde-fou décisif : le hub sert l'artefact importé en `immutable`, et refuse de
# réimporter une version déjà connue. Republier un numéro déjà existant ne
# remplace donc rien — les boutiques qui l'ont déjà téléchargé continueraient de
# servir l'ancien contenu pour toujours, sans le moindre message d'erreur.
assert_version_free() {
  local version="$1" tags
  tags="$(remote_tags)" || true
  if [[ -z "$tags" ]]; then
    printf '\033[33m!\033[0m impossible de lire les tags distants (hors ligne ?) — vérifiez à la main que %s est inédit.\n' "$version"
    return 0
  fi
  if grep -qx "$version" <<<"$tags"; then
    die "le tag $version existe déjà sur origin.
  Une version importée est servie immutable par le hub : la republier ne diffuserait
  PAS ce build, les boutiques resteraient figées sur l'ancien contenu.
  Dernier tag publié : $(sort -V <<<"$tags" | tail -1) — prochain libre : $(next_version "$tags")"
  fi
}

next_version() {
  sort -V <<<"$1" | tail -1 | awk -F. '{printf "%d.%d.%d", $1, $2, $3 + 1}'
}

# Déclenche l'import de cette version côté hub, une fois le tag confirmé par
# `verify`. Le secret voyage dans un en-tête, jamais dans l'URL ni les logs
# curl par défaut. Un échec ici (hub injoignable, secret absent) est un
# avertissement : le tag est publié et vérifié, l'import reste possible à la
# main.
notify_hub() {
  local version="$1" http_code body
  if [[ -z "${HUB_ENGINE_IMPORT_URL:-}" ]]; then
    printf '\033[33m!\033[0m HUB_ENGINE_IMPORT_URL non défini — importer à la main :\n'
    printf '    widget:engine:import %s && widget:engine:enable %s\n' "$version" "$version"
    return 0
  fi

  # HUB_ENGINE_IMPORT_CACERT : uniquement en local
  local cacert_opt=()
  [[ -n "${HUB_ENGINE_IMPORT_CACERT:-}" ]] && cacert_opt=(--cacert "$HUB_ENGINE_IMPORT_CACERT")

  body="$(mktemp)"
  http_code="$(curl -sS --max-time 30 "${cacert_opt[@]}" -o "$body" -w '%{http_code}' -X POST "$HUB_ENGINE_IMPORT_URL" \
    -H "X-Widget-Webhook-Secret: ${HUB_ENGINE_IMPORT_SECRET:-}" \
    -H 'Content-Type: application/json' \
    -d "{\"version\":\"${version}\"}")" || http_code="000"

  if [[ "$http_code" == "200" ]]; then
    ok "hub notifié : $(cat "$body")"
  else
    printf '\033[33m!\033[0m notification du hub échouée (HTTP %s) : %s\n' "$http_code" "$(cat "$body")"
    printf '    importer à la main : widget:engine:import %s && widget:engine:enable %s\n' "$version" "$version"
  fi
  rm -f "$body"
}

cmd_build() {
  local version="$1"
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "version attendue au format X.Y.Z, sans préfixe « v » (reçu : « $version »)."
  [[ -f "$SRC" ]] || die "source introuvable : $SRC"

  assert_version_free "$version"
  node --check "$SRC" || die "la source $SRC ne compile pas."

  minify "$SRC" "$MIN"
  ok "widget minifié : $(basename "$MIN") ($(wc -c < "$MIN" | tr -d ' ') octets)"

  local sri url
  sri="sha384-$(sri_of "$MIN")"
  url="$(widget_url "$version")"

  printf '\n  URL widget : %s\n  SRI        : %s\n\n' "$url" "$sri"
  cat <<EOF
Étapes suivantes (tag SANS préfixe « v » — c'est la convention du dépôt et ce que
résout l'URL ci-dessus, tout comme widget:engine:import côté hub) :
  git add -A && git commit -m "release: $version"
  git tag $version && git push origin $version
  ./tools/release.sh verify $version
  puis, côté hub de livraison : widget:engine:enable $version
EOF
}

cmd_verify() {
  local version="$1" url expected actual tmp
  url="$(widget_url "$version")"
  tmp="$(mktemp)"

  # Le .min.js local est la source de vérité : c'est lui que le build vient de
  # produire, et c'est son contenu que le tag est censé publier.
  [[ -f "$MIN" ]] || die "widget minifié introuvable : $MIN — lancez d'abord le build."
  expected="sha384-$(sri_of "$MIN")"

  curl -fsSL --max-time 30 "$url" -o "$tmp" || die "GitHub ne sert pas encore $url (tag poussé ?)."
  actual="sha384-$(sri_of "$tmp")"

  if [[ "$actual" != "$expected" ]]; then
    rm -f "$tmp"
    die "SRI divergent — le fichier publié ne correspond pas au .min.js local.
    attendu : $expected
    publié  : $actual
  Le tag pointe probablement sur un commit antérieur au dernier build."
  fi
  ok "SRI conforme : $expected"

  # raw.githubusercontent.com renvoie max-age=300 : l'immutabilité vient du hub,
  # qui héberge sa propre copie et refuse de réimporter une version déjà connue
  # (assert_version_free ci-dessus) — pas de contrôle Cache-Control ici.
  cmp -s "$tmp" "$MIN" && ok "fichier publié identique au .min.js local" \
                       || printf '\033[33m!\033[0m publié et local diffèrent hors SRI (encodage ?)\n'
  rm -f "$tmp"

  notify_hub "$version"
}

case "${1:-}" in
  verify) [[ $# -eq 2 ]] || die "usage : $0 verify <version>"; cmd_verify "$2" ;;
  '')     die "usage : $0 <version>  |  $0 verify <version>" ;;
  *)      [[ $# -eq 1 ]] || die "usage : $0 <version>"; cmd_build "$1" ;;
esac
