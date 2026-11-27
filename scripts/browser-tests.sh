#!/usr/bin/env bash
set -euo pipefail
scratch=$(mktemp -d)
trap 'kill ${server_pid:-} ${chrome_pid:-} 2>/dev/null || true; wait "${server_pid:-}" "${chrome_pid:-}" 2>/dev/null || true; rm -rf "$scratch" || true' EXIT
browser=${CHROMIUM:-$(command -v chromium || command -v google-chrome)}
server_port=${TEST_HTTP_PORT:-18183}
debug_port=${TEST_DEBUG_PORT:-19283}
flags=()
if [[ ${CHROMIUM_NO_SANDBOX:-0} == 1 ]]; then flags+=(--no-sandbox); fi
python3 -m http.server "$server_port" --bind 127.0.0.1 --directory "${BROWSER_TEST_ROOT:-.}" >"$scratch/http.log" 2>&1 &
server_pid=$!
"$browser" "${flags[@]}" --headless --disable-dev-shm-usage --remote-debugging-port="$debug_port" --user-data-dir="$scratch/chrome" about:blank >"$scratch/chrome.log" 2>&1 &
chrome_pid=$!
for attempt in {1..60}; do
  if curl -fsS "http://127.0.0.1:$debug_port/json/list" >/dev/null 2>&1; then
    GAME_URL=${GAME_URL:-http://127.0.0.1:$server_port/} CHROME_DEBUG_URL="http://127.0.0.1:$debug_port" node "${BROWSER_TEST_FILE:-tests/browser.mjs}"
    exit
  fi
  sleep .25
done
cat "$scratch/chrome.log" >&2
exit 1
