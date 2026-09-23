#!/bin/sh
# Limpia los worktrees efimeros de Sandcastle.
# Quita cada worktree bajo .sandcastle/worktrees, poda el registro de
# worktrees y borra su rama sandcastle/* (ya integradas en main).
# Uso: npm run sand:clean [-- --dry-run]
set -eu

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) echo "Uso: $0 [--dry-run]" >&2; exit 1 ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel)"
DIR="$ROOT/.sandcastle/worktrees"

if [ ! -d "$DIR" ]; then
  echo "Nada que limpiar: no existe $DIR"
  exit 0
fi

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

FOUND=0
for path in "$DIR"/*; do
  [ -e "$path" ] || continue
  FOUND=1
  name="$(basename "$path")"
  stamp="${name##sandcastle-sequential-reviewer-}"
  branch="sandcastle/sequential-reviewer/$stamp"

  if git worktree list --porcelain | grep -q "^worktree $path$"; then
    run git worktree remove --force -- "$path"
  else
    # Directorio huerfano no registrado: basta con borrarlo.
    run rm -rf -- "$path"
  fi

  if git show-ref --verify --quiet "refs/heads/$branch"; then
    run git branch -D -- "$branch"
  else
    echo "Rama no encontrada (se omite): $branch"
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "Nada que limpiar: $DIR esta vacio"
  exit 0
fi

run git worktree prune

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry-run completo: no se borro nada."
else
  echo "Limpieza completa."
fi
