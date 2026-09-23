# La cuenta es abierta; el cierre es el Grupo

Un Miembro es la misma persona en varios Grupos (pareja, trabajo, familia) y lo que se habla en uno no se ve en otro. El padrinazgo de plataforma cerraba la lista de personas antes de que existiera un Grupo al que entrar. Se abre el registro: cualquiera crea cuenta, puede crear Grupos al momento, esperar una Invitación o entrar al perfil sin pertenecer a ninguno. La Invitación es solo a un Grupo privado, la hace un Administrador, y si no hay cuenta el enlace registra y mete en ese Grupo. El Grupo activo es el de la URL. Recordar solo sirve para abrir `/` en el último Grupo visitado; un enlace compartido gana siempre a la memoria.

## Status: accepted

Deroga la membresía cerrada por padrinazgo de ADR-0005. La mecánica de contraseña y el RLS por `auth.uid` siguen hasta que el registro abierto esté construido. El enlace compartible de ADR-0011 sigue valiendo como canal de la Invitación; deja de valer la consecuencia «no hay registro público».

## Considered Options

- **Seguir con padrinazgo y después invitar al Grupo**: dos puertas para un solo acto. Quien ya puede registrarse no necesita un padrino de plataforma.
- **El enlace solo suma cuentas que ya existen**: la persona sin cuenta no puede entrar desde la invitación de su Grupo.
- **Un grupo por defecto guardado en el Miembro**: inventa un hogar cuando hay varios y nunca se visitó ninguno. Sin memoria, se elige en Mis Grupos.
