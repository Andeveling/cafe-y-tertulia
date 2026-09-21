#!/usr/bin/env bash
# Gate pre-push: bloquea el push a main si producción está a la deriva.
#  1. Vercel production debe correr el mismo commit que origin/main.
#  2. Todas las migraciones locales deben estar aplicadas en remoto
#     (equivale a `supabase db push --linked --dry-run` limpio).
#
# Solo se exige al pushear main/master; otras ramas se omiten.
# Bypass (no recomendado): git push --no-verify
set -euo pipefail

PROD_URL="${VERCEL_PROD_URL:-https://cafe-y-tertulia.vercel.app}"
MAIN_REFS=("refs/heads/main" "refs/heads/master")

pushing_main=false
if [ -t 0 ]; then
	# Sin stdin (p. ej. invocado por lefthook): decide por la rama actual.
	current="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
	for m in main master; do
		[[ "$current" == "$m" ]] && pushing_main=true
	done
else
	while read -r _ _ remote_ref _; do
		for m in "${MAIN_REFS[@]}"; do
			[[ "$remote_ref" == "$m" ]] && pushing_main=true
		done
	done
fi

if ! $pushing_main; then
	echo "[deploy-sync] push sin rama main: verificación omitida."
	exit 0
fi

fail() {
	echo "[deploy-sync] ERROR: $*" >&2
	exit 1
}
need() {
	command -v "$1" >/dev/null 2>&1 || fail "CLI '$1' no encontrada. Instálala o usa 'git push --no-verify' para omitir (no recomendado)."
}

need git
need supabase
need vercel

echo "[deploy-sync] 1/2 migraciones supabase en remoto..."
push_out="$(supabase db push --linked --dry-run 2>&1)" || fail "supabase db push --dry-run falló: $push_out"
grep -q "Remote database is up to date" <<<"$push_out" || fail "hay migraciones sin aplicar en remoto. Ejecuta 'supabase db push --linked' antes del push. Salida: $push_out"
echo "[deploy-sync] base sincronizada."

echo "[deploy-sync] 2/2 vercel production vs origin/main..."
origin_sha="$(git ls-remote origin main 2>/dev/null | awk '{print $1}')"
[[ -n "$origin_sha" ]] || fail "no se pudo leer origin/main (¿sin red?)."
tmp_log="$(mktemp)"
if ! vercel inspect "$PROD_URL" --logs >"$tmp_log" 2>&1; then
	rm -f "$tmp_log"
	fail "vercel inspect falló para $PROD_URL."
fi
vercel_sha="$(grep -oP 'Commit: \K[0-9a-f]+' "$tmp_log" | head -1)"
rm -f "$tmp_log"
[[ -n "$vercel_sha" ]] || fail "no se pudo leer el commit del deploy en $PROD_URL."
[[ "$origin_sha" == "$vercel_sha"* ]] || fail "vercel ($vercel_sha) != origin/main (${origin_sha:0:7}). Espera a que Vercel despliegue antes del push."
echo "[deploy-sync] vercel al día ($vercel_sha)."
echo "[deploy-sync] OK: push autorizado."
