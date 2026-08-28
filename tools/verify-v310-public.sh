#!/usr/bin/env bash
set -u
BASE='https://ghzyzttxwd.github.io/xiuxian-world/'
EXPECT_GAME="${EXPECT_GAME:?EXPECT_GAME must be the locked V3.10 source SHA256}"
EXPECT512='757ff87de9b0a763d3de2afcc7e23a3c6655847fee1c9690e29bbb005ce92c7b'
EXPECT192='a44e68e89072c644c9f19d2c44997ae7c9af6806facc7cc9eaf76b3e0855bdcf'
BASE_SHA="${BASE_SHA:-unknown}";ATTEMPTS="${ATTEMPTS:-36}";DIAG='/tmp/V310_PUBLIC_DIAGNOSTIC.txt';OKFILE='/tmp/V310_PUBLIC_OK'
fetch_asset(){ local url="$1" out="$2" err="$3" code; code=$(curl -sS -L --connect-timeout 10 --max-time 20 -w '%{http_code}' "$url" -o "$out" 2>"$err" || true); [[ "$code" =~ ^[0-9]{3}$ ]] || code='000'; printf '%s' "$code"; }
write_diag(){ local status="$1" attempt="$2"; { echo "status=$status";echo "attempt=$attempt";echo "base_sha=$BASE_SHA";echo "index_http=$index_code";echo "app_http=$app_code";echo "game_http=$game_code";echo "build_http=$build_code";echo "sw_http=$sw_code";echo "manifest_http=$manifest_code";echo "icon512_http=$icon512_code";echo "icon192_http=$icon192_code";echo "index_v310=$index_v310";echo "app_v310=$app_v310";echo "game_v310=$game_v310";echo "schema36=$schema36";echo "sw_v310=$sw_v310";echo "build_v310=$build_v310";echo "game_sha=$game_sha";echo "game_sha_expected=$EXPECT_GAME";echo "game_sha_ok=$game_sha_ok";echo "icon512_sha=$icon512_sha";echo "icon512_ok=$icon512_ok";echo "icon192_sha=$icon192_sha";echo "icon192_ok=$icon192_ok";echo "manifest_ok=$manifest_ok";echo "syntax_ok=$syntax_ok";echo "public_headless_regression_ok=$regression_ok"; } > "$DIAG"; }
: > "$DIAG";echo false > "$OKFILE"
for i in $(seq 1 "$ATTEMPTS"); do
 index_code=$(fetch_asset "${BASE}?v=31001&diag=${BASE_SHA}-${i}" /tmp/public-v310-index.html /tmp/curl-v310-index.err)
 app_code=$(fetch_asset "${BASE}app.js?v=31001&diag=${BASE_SHA}-${i}" /tmp/public-v310-app.js /tmp/curl-v310-app.err)
 game_code=$(fetch_asset "${BASE}src/game-v310.js?v=31001&diag=${BASE_SHA}-${i}" /tmp/public-v310-game.js /tmp/curl-v310-game.err)
 build_code=$(fetch_asset "${BASE}BUILD_V310_BALANCE.json?diag=${BASE_SHA}-${i}" /tmp/public-v310-build.json /tmp/curl-v310-build.err)
 sw_code=$(fetch_asset "${BASE}sw.js?v=31001&diag=${BASE_SHA}-${i}" /tmp/public-v310-sw.js /tmp/curl-v310-sw.err)
 manifest_code=$(fetch_asset "${BASE}manifest-v6.webmanifest?v=6&diag=${BASE_SHA}-${i}" /tmp/public-v310-manifest.json /tmp/curl-v310-manifest.err)
 icon512_code=$(fetch_asset "${BASE}icon-v6-512.png?diag=${BASE_SHA}-${i}" /tmp/public-v310-icon512.png /tmp/curl-v310-icon512.err)
 icon192_code=$(fetch_asset "${BASE}icon-v6-192.png?diag=${BASE_SHA}-${i}" /tmp/public-v310-icon192.png /tmp/curl-v310-icon192.err)
 index_v310=0;app_v310=0;game_v310=0;schema36=0;sw_v310=0;build_v310=0;game_sha='missing';game_sha_ok=0;icon512_sha='missing';icon512_ok=0;icon192_sha='missing';icon192_ok=0;manifest_ok=0;syntax_ok=0;regression_ok=0
 [ -f /tmp/public-v310-index.html ] && grep -q 'V3.10 · 无充值全流程总平衡篇' /tmp/public-v310-index.html && index_v310=1
 [ -f /tmp/public-v310-app.js ] && grep -q 'src/game-v310.js?v=31001' /tmp/public-v310-app.js && grep -q "gameplayVersion:'3.10.0'" /tmp/public-v310-app.js && app_v310=1
 [ -f /tmp/public-v310-game.js ] && grep -q "const VERSION='3.10.0'" /tmp/public-v310-game.js && game_v310=1
 [ -f /tmp/public-v310-game.js ] && grep -q 'const SAVE_SCHEMA_VERSION=36' /tmp/public-v310-game.js && schema36=1
 [ -f /tmp/public-v310-sw.js ] && grep -q 'taixuan-v3.10.0-no-recharge-full-run-balance-31001' /tmp/public-v310-sw.js && sw_v310=1
 if [ -f /tmp/public-v310-game.js ];then game_sha=$(sha256sum /tmp/public-v310-game.js|awk '{print $1}');[ "$game_sha" = "$EXPECT_GAME" ]&&game_sha_ok=1;node --check /tmp/public-v310-game.js >/tmp/public-v310-syntax.log 2>&1&&syntax_ok=1;fi
 if [ -f /tmp/public-v310-build.json ];then EXPECT_GAME="$EXPECT_GAME" node -e "const b=require('/tmp/public-v310-build.json');if(b.status!=='PASS'||b.gameplay_version!=='3.10.0'||b.build!=='31001'||b.save_schema_version!==36||b.content_registry_version!==10||b.source_sha256!==process.env.EXPECT_GAME)process.exit(1)" >/dev/null 2>&1&&build_v310=1;fi
 if [ -f /tmp/public-v310-icon512.png ];then icon512_sha=$(sha256sum /tmp/public-v310-icon512.png|awk '{print $1}');[ "$icon512_sha" = "$EXPECT512" ]&&icon512_ok=1;fi
 if [ -f /tmp/public-v310-icon192.png ];then icon192_sha=$(sha256sum /tmp/public-v310-icon192.png|awk '{print $1}');[ "$icon192_sha" = "$EXPECT192" ]&&icon192_ok=1;fi
 if [ -f /tmp/public-v310-manifest.json ];then node -e "const m=require('/tmp/public-v310-manifest.json');if(m.display!=='standalone'||!Array.isArray(m.icons)||m.icons.length<2)process.exit(1)" >/dev/null 2>&1&&manifest_ok=1;fi
 if [ "$index_v310" = 1 ]&&[ "$game_v310" = 1 ]&&[ "$schema36" = 1 ]&&[ "$game_sha_ok" = 1 ]&&[ "$syntax_ok" = 1 ];then
   cp /tmp/public-v310-index.html index.html
   mkdir -p src
   cp /tmp/public-v310-game.js src/game-v310.js
   if node tests/regression-v310.mjs >/tmp/public-regression-v310.log 2>&1 && node tests/regression-v310-premahayana-auction.mjs >>/tmp/public-regression-v310.log 2>&1 && node tests/regression-v310-core-market.mjs >>/tmp/public-regression-v310.log 2>&1;then regression_ok=1;fi
 fi
 status=FAIL
 if [ "$index_code" = 200 ]&&[ "$app_code" = 200 ]&&[ "$game_code" = 200 ]&&[ "$build_code" = 200 ]&&[ "$sw_code" = 200 ]&&[ "$manifest_code" = 200 ]&&[ "$icon512_code" = 200 ]&&[ "$icon192_code" = 200 ]&&[ "$index_v310" = 1 ]&&[ "$app_v310" = 1 ]&&[ "$game_v310" = 1 ]&&[ "$schema36" = 1 ]&&[ "$sw_v310" = 1 ]&&[ "$build_v310" = 1 ]&&[ "$game_sha_ok" = 1 ]&&[ "$icon512_ok" = 1 ]&&[ "$icon192_ok" = 1 ]&&[ "$manifest_ok" = 1 ]&&[ "$syntax_ok" = 1 ]&&[ "$regression_ok" = 1 ];then status=PASS;fi
 write_diag "$status" "$i";if [ "$status" = PASS ];then echo true > "$OKFILE";cat "$DIAG";exit 0;fi;sleep 5
done
cat "$DIAG";exit 2
