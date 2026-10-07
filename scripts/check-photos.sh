#!/usr/bin/env bash
# Verifies candidate Unsplash photo IDs resolve to a real image.
# Usage: ./check-photos.sh ids.txt
IDS_FILE="${1:-ids.txt}"
check() {
  id="$1"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
    "https://images.unsplash.com/photo-${id}?w=200&q=50")
  if [ "$code" = "200" ]; then echo "OK   $id"; else echo "FAIL $id ($code)"; fi
}
export -f check
cat "$IDS_FILE" | grep -v '^#' | grep -v '^$' | xargs -P 12 -I{} bash -c 'check {}'
