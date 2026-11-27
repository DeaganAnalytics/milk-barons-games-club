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
debugger="http://127.0.0.1:$debug_port"
for attempt in {1..60}; do
  if ! kill -0 "$chrome_pid" 2>/dev/null; then
    wait "$chrome_pid" || echo "Chromium exited with status $?." >&2
    break
  fi
  if curl --noproxy "*" --max-time 1 -fsS "$debugger/json/list" >/dev/null 2>"$scratch/probe.log"; then
    GAME_URL=${GAME_URL:-http://127.0.0.1:$server_port/} CHROME_DEBUG_URL="http://127.0.0.1:$debug_port" node "${BROWSER_TEST_FILE:-tests/browser.mjs}"
    exit
  fi
  sleep .25
done
echo "Chromium did not open $debugger/json/list (binary: $browser)." >&2
"$browser" --version >&2 || true
touch "$scratch/probe.log"
cat "$scratch/probe.log" "$scratch/chrome.log" "$scratch/http.log" >&2
exit 1
