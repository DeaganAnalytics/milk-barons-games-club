#!/usr/bin/env bash
set -euo pipefail
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
revision=$(git rev-parse HEAD)
node scripts/stage-site.mjs . "$scratch/site" production "$revision"
node scripts/stage-site.mjs . "$scratch/site/dev" development "$revision"
BROWSER_TEST_ROOT="$scratch/site" BROWSER_TEST_FILE=tests/pages-browser.mjs bash scripts/browser-tests.sh
