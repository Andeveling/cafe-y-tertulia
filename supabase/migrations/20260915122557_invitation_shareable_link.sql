-- ADR 0011: Invitación por enlace compartible.
-- El padrino entrega un enlace firmado por la app (hash en esta tabla);
-- ya no se envía correo. Corte limpio: las pendientes del sistema anterior
-- quedan caducadas. Vigencia nueva: 7 días (la app lo fija al crear).

alter table public.invitations
	add column if not exists token_hash text;

comment on column public.invitations.token_hash is
	'Hash del enlace emitido; null en invitaciones anteriores al corte limpio.';

comment on table public.invitations is
	'Registro de padrinazgo: Invitación de un Miembro activo, enlace vigente 7 días (ADR 0011).';

update public.invitations
set status = 'expired'
where status = 'pending'
	and token_hash is null;
