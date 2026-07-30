#!/usr/bin/env bash
#
# release.sh — prépare une release du widget EveryParts.
#
#   ./tools/release.sh 1.1.0          minifie le widget, calcule le SRI, régénère le loader
#   ./tools/release.sh verify 1.1.0   vérifie que jsDelivr sert bien le fichier attendu
#
# Le dispositif à deux étages (loader `no-cache` + widget épinglé `immutable`) n'est
# correct que si l'URL et l'empreinte SRI du loader correspondent EXACTEMENT au
# `.min.js` publié. Fait à la main, ça dérive — d'où ce script.
#
# ORDRE DES OPÉRATIONS (important) :
#   1. ./tools/release.sh 1.1.0
#   2. git add -A && git commit && git tag v1.1.0 && git push --tags
#   3. ./tools/release.sh verify 1.1.0        ← le tag doit exister sur jsDelivr
#   4. déployer everyparts-widget-loader.min.js sur l'host, en Cache-Control: no-cache
#
# L'étape 4 vient en dernier : le loader référence un tag qui doit déjà être publié.

set -euo pipefail

REPO_SLUG="agence-ukoo/everyparts-search-widget"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/everyparts-widget.js"
MIN="$ROOT/everyparts-widget.min.js"
LOADER="$ROOT/everyparts-widget-loader.js"
LOADER_MIN="$ROOT/everyparts-widget-loader.min.js"

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

widget_url() { echo "https://cdn.jsdelivr.net/gh/${REPO_SLUG}@${1}/everyparts-widget.min.js"; }

# Les tags du dépôt ne portent PAS de préfixe « v » (1.0.9, 1.1.0, 1.1.1…) et
# l'URL jsDelivr @X.Y.Z résout sur le tag du même nom : préfixer casserait tout.
remote_tags() { git ls-remote --tags origin 2>/dev/null | awk '{print $2}' | sed 's#refs/tags/##' | grep -v '\^{}'; }

# Garde-fou décisif : une URL épinglée est `immutable`. Republier un numéro déjà
# existant ne remplace rien — le CDN et les navigateurs continueront de servir
# l'ancien contenu pour toujours, sans le moindre message d'erreur.
assert_version_free() {
  local version="$1" tags
  tags="$(remote_tags)" || true
  if [[ -z "$tags" ]]; then
    printf '\033[33m!\033[0m impossible de lire les tags distants (hors ligne ?) — vérifiez à la main que %s est inédit.\n' "$version"
    return 0
  fi
  if grep -qx "$version" <<<"$tags"; then
    die "le tag $version existe déjà sur origin.
  Une URL jsDelivr épinglée est immutable : la republier ne diffuserait PAS ce build,
  les boutiques resteraient figées sur l'ancien contenu.
  Dernier tag publié : $(sort -V <<<"$tags" | tail -1) — prochain libre : $(next_version "$tags")"
  fi
}

next_version() {
  sort -V <<<"$1" | tail -1 | awk -F. '{printf "%d.%d.%d", $1, $2, $3 + 1}'
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

  # Réécrit uniquement le bloc @generated du loader : les commentaires et la logique
  # restent sous contrôle humain.
  python3 - "$LOADER" "$url" "$sri" <<'PY'
import re, sys
path, url, sri = sys.argv[1], sys.argv[2], sys.argv[3]
src = open(path, encoding='utf-8').read()
block = ("/* @generated-begin — régénéré par tools/release.sh */\n"
         "  var WIDGET_URL = '%s';\n"
         "  var WIDGET_SRI = '%s';\n"
         "  /* @generated-end */" % (url, sri))
new, n = re.subn(r'/\* @generated-begin.*?@generated-end \*/', block, src, flags=re.S)
if n != 1:
    sys.exit("bloc @generated introuvable (ou en double) dans %s" % path)
open(path, 'w', encoding='utf-8').write(new)
PY
  ok "loader régénéré → $version"

  minify "$LOADER" "$LOADER_MIN"
  ok "loader minifié : $(basename "$LOADER_MIN") ($(wc -c < "$LOADER_MIN" | tr -d ' ') octets)"

  printf '\n  URL widget : %s\n  SRI        : %s\n\n' "$url" "$sri"
  cat <<EOF
Étapes suivantes (tag SANS préfixe « v » — c'est la convention du dépôt et ce que
résout l'URL jsDelivr) :
  git add -A && git commit -m "release: $version"
  git tag $version && git push origin $version
  ./tools/release.sh verify $version
  puis déployer everyparts-widget-loader.min.js en Cache-Control: no-cache
EOF
}

cmd_verify() {
  local version="$1" url expected actual cc tmp
  url="$(widget_url "$version")"
  tmp="$(mktemp)"

  # Le loader minifié est la source de vérité : c'est lui qui part en production.
  expected="$(grep -oE 'sha384-[A-Za-z0-9+/=]+' "$LOADER_MIN" | head -1)" \
    || die "aucune empreinte SRI dans $LOADER_MIN — lancez d'abord le build."
  grep -qF "@${version}/" "$LOADER_MIN" \
    || die "$LOADER_MIN ne pointe pas sur @${version} — build et loader désynchronisés."

  curl -fsSL --max-time 30 "$url" -o "$tmp" || die "jsDelivr ne sert pas encore $url (tag poussé ?)."
  actual="sha384-$(sri_of "$tmp")"
  cc="$(curl -sI --max-time 20 "$url" | tr -d '\r' | awk 'BEGIN{IGNORECASE=1}/^cache-control:/{$1="";print substr($0,2)}')"

  if [[ "$actual" != "$expected" ]]; then
    rm -f "$tmp"
    die "SRI divergent — le fichier publié ne correspond pas au loader.
    attendu : $expected
    publié  : $actual
  Le tag pointe probablement sur un commit antérieur au dernier build."
  fi
  ok "SRI conforme : $expected"

  cmp -s "$tmp" "$MIN" && ok "fichier publié identique au .min.js local" \
                       || printf '\033[33m!\033[0m publié et local diffèrent hors SRI (encodage ?)\n'
  [[ "$cc" == *immutable* ]] && ok "cache CDN : $cc" \
                             || printf '\033[33m!\033[0m Cache-Control inattendu sur une URL épinglée : %s\n' "$cc"
  rm -f "$tmp"
}

case "${1:-}" in
  verify) [[ $# -eq 2 ]] || die "usage : $0 verify <version>"; cmd_verify "$2" ;;
  '')     die "usage : $0 <version>  |  $0 verify <version>" ;;
  *)      [[ $# -eq 1 ]] || die "usage : $0 <version>"; cmd_build "$1" ;;
esac
