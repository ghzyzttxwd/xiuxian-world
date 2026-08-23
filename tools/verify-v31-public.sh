#!/usr/bin/env bash
set -u

BASE='https://ghzyzttxwd.github.io/xiuxian-world/'
EXPECT_GAME='492a2808ba69727ab6232e753ed25f388cc324cff0a8032a1ccc35f8549180e7'
EXPECT512='757ff87de9b0a763d3de2afcc7e23a3c6655847fee1c9690e29bbb005ce92c7b'
EXPECT192='a44e68e89072c644c9f19d2c44997ae7c9af6806facc7cc9eaf76b3e0855bdcf'
BASE_SHA="${BASE_SHA:-unknown}"
ATTEMPTS="${ATTEMPTS:-24}"
DIAG='/tmp/V31_PUBLIC_DIAGNOSTIC.txt'
OKFILE='/tmp/V31_PUBLIC_OK'

fetch_asset(){ local url="$1" out="$2" err="$3" code; code=$(curl -sS -L --connect-timeout 10 --max-time 20 -w '%{http_code}' "$url" -o "$out" 2>"$err" || true); [[ "$code" =~ ^[0-9]{3}$ ]] || code='000'; printf '%s' "$code"; }
write_diag(){
  local status="$1" attempt="$2"
  {
    echo "status=$status"; echo "attempt=$attempt"; echo "base_sha=$BASE_SHA"
    echo "index_http=$index_code"; echo "app_http=$app_code"; echo "game_http=$game_code"; echo "sw_http=$sw_code"; echo "manifest_http=$manifest_code"; echo "icon512_http=$icon512_code"; echo "icon192_http=$icon192_code"
    echo "index_v31=$index_v31"; echo "app_v31=$app_v31"; echo "game_v31=$game_v31"; echo "schema28=$schema28"; echo "sw_v31=$sw_v31"
    echo "game_sha=$game_sha"; echo "game_sha_expected=$EXPECT_GAME"; echo "game_sha_ok=$game_sha_ok"
    echo "icon512_sha=$icon512_sha"; echo "icon512_ok=$icon512_ok"; echo "icon192_sha=$icon192_sha"; echo "icon192_ok=$icon192_ok"
    echo "manifest_ok=$manifest_ok"; echo "regression_ok=$regression_ok"
  } > "$DIAG"
}

: > "$DIAG"; echo false > "$OKFILE"
for i in $(seq 1 "$ATTEMPTS"); do
  index_code=$(fetch_asset "${BASE}?v=3101&diag=${BASE_SHA}-${i}" /tmp/public-index.html /tmp/curl-index.err)
  app_code=$(fetch_asset "${BASE}app.js?v=3101&diag=${BASE_SHA}-${i}" /tmp/public-app.js /tmp/curl-app.err)
  game_code=$(fetch_asset "${BASE}src/game-v31.js?v=3101&diag=${BASE_SHA}-${i}" /tmp/public-game.js /tmp/curl-game.err)
  sw_code=$(fetch_asset "${BASE}sw.js?v=3101&diag=${BASE_SHA}-${i}" /tmp/public-sw.js /tmp/curl-sw.err)
  manifest_code=$(fetch_asset "${BASE}manifest-v6.webmanifest?v=6&diag=${BASE_SHA}-${i}" /tmp/public-manifest.json /tmp/curl-manifest.err)
  icon512_code=$(fetch_asset "${BASE}icon-v6-512.png?diag=${BASE_SHA}-${i}" /tmp/public-icon512.png /tmp/curl-icon512.err)
  icon192_code=$(fetch_asset "${BASE}icon-v6-192.png?diag=${BASE_SHA}-${i}" /tmp/public-icon192.png /tmp/curl-icon192.err)

  index_v31=0; app_v31=0; game_v31=0; schema28=0; sw_v31=0; game_sha='missing'; game_sha_ok=0; icon512_sha='missing'; icon512_ok=0; icon192_sha='missing'; icon192_ok=0; manifest_ok=0; regression_ok=0
  [ -f /tmp/public-index.html ] && grep -q 'V3.1 · 功法术法大扩容' /tmp/public-index.html && index_v31=1
  [ -f /tmp/public-app.js ] && grep -q 'src/game-v31.js?v=3101' /tmp/public-app.js && grep -q "gameplayVersion:'3.1.0'" /tmp/public-app.js && app_v31=1
  [ -f /tmp/public-game.js ] && grep -q "const VERSION='3.1.0'" /tmp/public-game.js && game_v31=1
  [ -f /tmp/public-game.js ] && grep -q 'const SAVE_SCHEMA_VERSION=28' /tmp/public-game.js && schema28=1
  [ -f /tmp/public-sw.js ] && grep -q 'taixuan-v3.1.0-manual-spell-expansion-3101' /tmp/public-sw.js && sw_v31=1
  if [ -f /tmp/public-game.js ]; then game_sha=$(sha256sum /tmp/public-game.js | awk '{print $1}'); [ "$game_sha" = "$EXPECT_GAME" ] && game_sha_ok=1; fi
  if [ -f /tmp/public-icon512.png ]; then icon512_sha=$(sha256sum /tmp/public-icon512.png | awk '{print $1}'); [ "$icon512_sha" = "$EXPECT512" ] && icon512_ok=1; fi
  if [ -f /tmp/public-icon192.png ]; then icon192_sha=$(sha256sum /tmp/public-icon192.png | awk '{print $1}'); [ "$icon192_sha" = "$EXPECT192" ] && icon192_ok=1; fi
  if [ -f /tmp/public-manifest.json ]; then node -e "const m=require('/tmp/public-manifest.json');if(m.display!=='standalone'||!Array.isArray(m.icons)||m.icons.length<2)process.exit(1)" >/dev/null 2>&1 && manifest_ok=1; fi
  if [ "$index_v31" = 1 ] && [ "$game_v31" = 1 ] && [ "$schema28" = 1 ] && [ "$game_sha_ok" = 1 ]; then INDEX_PATH=/tmp/public-index.html GAME_PATH=/tmp/public-game.js node tests/regression-v31.mjs >/tmp/public-regression-v31.log 2>&1 && regression_ok=1; fi

  status=FAIL
  if [ "$index_code" = 200 ] && [ "$app_code" = 200 ] && [ "$game_code" = 200 ] && [ "$sw_code" = 200 ] && [ "$manifest_code" = 200 ] && [ "$icon512_code" = 200 ] && [ "$icon192_code" = 200 ] && [ "$index_v31" = 1 ] && [ "$app_v31" = 1 ] && [ "$game_v31" = 1 ] && [ "$schema28" = 1 ] && [ "$sw_v31" = 1 ] && [ "$game_sha_ok" = 1 ] && [ "$icon512_ok" = 1 ] && [ "$icon192_ok" = 1 ] && [ "$manifest_ok" = 1 ] && [ "$regression_ok" = 1 ]; then status=PASS; fi
  write_diag "$status" "$i"
  if [ "$status" = PASS ]; then echo true > "$OKFILE"; cat "$DIAG"; exit 0; fi
  sleep 5
done
cat "$DIAG"; exit 2
