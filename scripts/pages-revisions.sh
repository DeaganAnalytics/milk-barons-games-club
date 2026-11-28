#!/usr/bin/env bash
# Run with the Pages workflow's repository-wide concurrency lock held.
set -euo pipefail
destination=${1:?staging directory}
mkdir -p "$destination"
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
git fetch origin refs/heads/main:refs/remotes/origin/main refs/heads/develop:refs/remotes/origin/develop
# These Git refs pin the last successfully published commits without artifact expiry.
for ref in production development; do
  if git ls-remote --exit-code origin "refs/tags/pages-$ref" >/dev/null; then
    git fetch --force origin "refs/tags/pages-$ref:refs/tags/pages-$ref"
  fi
done

select_revision() {
  local branch=$1 environment=$2 revision previous
  revision=$(git rev-parse "origin/$branch")
  previous=$(git rev-parse --verify "refs/tags/pages-$environment^{commit}" 2>/dev/null || true)
  if [[ "$previous" == "$revision" ]]; then
    printf '%s\n' "$revision"
    return
  fi
  mkdir -p "$scratch/$branch"
  git archive "$revision" | tar -x -C "$scratch/$branch"
  if (cd "$scratch/$branch" && npm ci && npm test) >&2; then
    printf '%s\n' "$revision"
  elif [[ -n "$previous" ]]; then
    printf '::warning::%s tests failed. Retaining %s.\n' "$branch" "$previous" >&2
    printf '%s\n' "$previous"
  else
    printf '::error::%s tests failed and its deployment pin is missing. Restore the last published revision before retrying.\n' "$branch" >&2
    return 1
  fi
}

production=$(select_revision main production)
development=$(select_revision develop development)
for environment in production development; do
  revision=${!environment}
  mkdir "$scratch/$environment"
  git archive "$revision" | tar -x -C "$scratch/$environment"
  target=$destination
  if [[ "$environment" == development ]]; then target="$destination/dev"; fi
  node scripts/stage-site.mjs "$scratch/$environment" "$target" "$environment" "$revision"
  printf '%s=%s\n' "$environment" "$revision" >> "${GITHUB_OUTPUT:?}"
done
