/**
 * Catálogo de avatares del club (`public/avatars/*.svg`).
 *
 * El miembro elige uno en su perfil y se guarda en `members.avatar`
 * como el `src` público (p. ej. `/avatars/Avatar01.svg`), listo para
 * `<AvatarImage src>`. Guardar el src —y no un id— evita una
 * resolución en cada lector (NavUser, Sala, roster).
 */

export type AvatarOption = {
	/** Valor que se persiste en `members.avatar` y se usa como `src`. */
	src: string;
	/** Etiqueta accesible para el selector. */
	label: string;
};

const FILES = [
	"Avatar01",
	"Avatar03",
	"Avatar04",
	"Avatar05",
	"Avatar06",
	"Avatar07",
	"Avatar08",
	"Avatar09",
	"Avatar10",
	"Avatar11",
	"Avatar12",
	"Avatar13",
	"Avatar14",
	"Avatar15",
	"Avatar16",
	"Avatar17",
	"Avatar18",
	"Avatar19",
	"Avatar20",
	"Avatar21",
] as const;

export const AVATARS: AvatarOption[] = FILES.map((name, i) => ({
	src: `/avatars/${name}.svg`,
	label: `Avatar ${i + 1}`,
}));

const VALID = new Set(AVATARS.map((a) => a.src));

/** true si `src` es uno de los avatares del catálogo. */
export function isValidAvatar(src: string | null | undefined): src is string {
	return typeof src === "string" && VALID.has(src);
}

/**
 * Normaliza el valor persistido a un `src` del catálogo o null.
 * Los SVG ya traen fondo propio, así que `AvatarImage` los muestra tal cual.
 */
export function resolveAvatar(value: string | null | undefined): string | null {
	return isValidAvatar(value) ? value : null;
}
