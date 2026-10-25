#!/bin/sh
set -eu

# Caddy substitutes {$DOMAINS} into the Caddyfile before lexing it. A bare
# comma-separated value therefore becomes one site-address token, and Caddy
# rejects it ("site addresses cannot contain a comma"). Normalize the list to
# "a, b, c" so Caddy sees separate address tokens. Accepts lists with or
# without spaces and tolerates a trailing comma.
: "${DOMAINS:?DOMAINS environment variable is required}"

normalized_domains=$(printf '%s' "$DOMAINS" | tr -d '[:space:]' | sed -e 's/,*$//' -e 's/,/, /g')
export DOMAINS="$normalized_domains"

exec "$@"
