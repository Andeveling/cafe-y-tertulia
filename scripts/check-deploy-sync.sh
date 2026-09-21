#!/usr/bin/env bash
# Gate pre-push: bloquea el push a main si producción está a la deriva de
# origin/main — no si el propio push trae trabajo nuevo.
#
#  1. Migraciones YA EN origin/main deben estar aplicadas en el remoto.
#     Las que introduce este push no son deriva: el hook las aplica
#     (schema → code) y el push sigue. Archivos uncommitted en
#     supabase/migrations/ = error.
#  2. Vercel production debe correr el mismo commit que origin/main.
#
# Solo se exige al pushear main/master; otras ramas se omiten.
# Bypass (no recomendado): git push --no-verify
set -euo pipefail

PROD_URL="${VERCEL_PROD_URL:-https://cafe-y-tertulia.vercel.app}"
MAIN_REFS=("refs/heads/main" "refs/heads/master")

# Lefthook no reenvía los refs de git. Unión: rama actual + stdin del hook.
pushing_main=false
current="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
for m in main master; do
	[[ "$current" == "$m" ]] && pushing_main=true
done
if [ ! -t 0 ]; then
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
need python3

# Versiones (timestamp 14 dígitos) de migraciones en un tree-ish.
versions_in() {
	git ls-tree -r --name-only "$1" -- supabase/migrations/ \
		| sed -n 's|^supabase/migrations/\([0-9]\{14\}\)_.*.sql$|\1|p' \
		| sort -u
}

echo "[deploy-sync] 1/2 migraciones supabase vs origin/main..."

tmp_json="$(mktemp)"
tmp_err="$(mktemp)"
cleanup() { rm -f "$tmp_json" "$tmp_err"; }
trap cleanup EXIT

if ! supabase migration list --linked --output-format json >"$tmp_json" 2>"$tmp_err"; then
	fail "supabase migration list --linked falló: $(cat "$tmp_err")"
fi

# remote = aplicadas. pending = archivo local sin fila remota.
eval "$(python3 - "$tmp_json" <<'PY'
import json, sys
path = sys.argv[1]
with open(path) as f:
	data = json.load(f)
remote, pending = [], []
for m in data.get("migrations", []):
	loc = (m.get("local") or "").strip()
	rem = (m.get("remote") or "").strip()
	if rem:
		remote.append(rem)
	elif loc:
		pending.append(loc)
def sh_array(name, items):
	print(f"{name}=(")
	for i in items:
		print(f"  {json.dumps(i)}")
	print(")")
sh_array("remote_versions", remote)
sh_array("pending_versions", pending)
PY
)"

declare -A remote_set=()
for v in "${remote_versions[@]+"${remote_versions[@]}"}"; do
	remote_set["$v"]=1
done

origin_ref="origin/main"
git rev-parse --verify -q "$origin_ref" >/dev/null || origin_ref="origin/master"
git rev-parse --verify -q "$origin_ref" >/dev/null || fail "no se encontró origin/main (¿sin fetch?)."

mapfile -t origin_versions < <(versions_in "$origin_ref")
mapfile -t head_versions < <(versions_in HEAD)

declare -A origin_set=() head_set=()
for v in "${origin_versions[@]+"${origin_versions[@]}"}"; do
	[[ -n "$v" ]] && origin_set["$v"]=1
done
for v in "${head_versions[@]+"${head_versions[@]}"}"; do
	[[ -n "$v" ]] && head_set["$v"]=1
done

drift=()
for v in "${origin_versions[@]+"${origin_versions[@]}"}"; do
	[[ -z "$v" ]] && continue
	[[ -n "${remote_set[$v]:-}" ]] || drift+=("$v")
done
if ((${#drift[@]})); then
	fail "origin/main tiene migraciones sin aplicar en remoto: ${drift[*]}. Ejecuta 'supabase db push --linked' para reparar antes del push."
fi

uncommitted=()
outgoing=()
for v in "${pending_versions[@]+"${pending_versions[@]}"}"; do
	if [[ -z "${head_set[$v]:-}" ]]; then
		uncommitted+=("$v")
	elif [[ -z "${origin_set[$v]:-}" ]]; then
		outgoing+=("$v")
	fi
done
if ((${#uncommitted[@]})); then
	fail "hay migraciones en disco que no están en HEAD: ${uncommitted[*]}. Commitea o borra antes de pushear main."
fi

echo "[deploy-sync] origin/main y remoto alineados."

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

if ((${#outgoing[@]})); then
	echo "[deploy-sync] aplicando ${#outgoing[@]} migración(es) del push en remoto: ${outgoing[*]}"
	supabase db push --linked --yes || fail "supabase db push --linked falló."
	echo "[deploy-sync] migraciones del push aplicadas."
fi

echo "[deploy-sync] OK: push autorizado."
