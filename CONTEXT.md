# Café y Tertulias

Club de lectura y conversación. Aplicación web que acompaña y organiza las sesiones del club: antes de la reunión recoge las preguntas, durante la tertulia organiza la dinámica (sorteo, debate, minijuegos) y después conserva la memoria de lo discutido. La conversación está primero; la aplicación acompaña, no dirige.

## Language

**Miembro**:
Una persona del club con acceso a la aplicación.
_Avoid_: Usuario, Participante (como entidad)

**Participante**:
Un Miembro confirmado como presente en una Sesión concreta. Término de contexto de sesión, no una entidad propia.
_Avoid_: Asistente, integrante

**Moderador**:
Estado temporal que un Miembro asume al iniciar o conducir una Sesión. Cualquier miembro puede serlo; no existe un moderador permanente.
_Avoid_: Host, anfitrión, admin de sesión

**Sesión**:
Encuentro del club (presencial o por videollamada) con sus fases, estados y datos asociados.
_Avoid_: Tertulia (como término de modelo), reunión, meet

**Estado de la sesión**:
Ciclo de vida de una Sesión: `preparación` (los miembros proponen materiales, preguntas y trivias antes de que exista una cita), `lobby` (el moderador confirma participantes y ejecuta el Sorteo), `en_curso` (el debate; internamente lleva un punto de revelación y el estado de la intervención actual), `cerrada` (datos congelados, aún editable por el moderador para corregir errores) e `histórico` (solo lectura, permanente). Los minijuegos son acciones dentro de `en_curso`, no estados propios.
_Avoid_: Fase, etapa, status

**Material**:
Contenido sobre el que se conversa: libro, podcast, video o artículo. Tiene un pipeline de estados (propuesto → seleccionado → en curso → terminado) y puede cubrirse en varias Sesiones.
_Avoid_: Contenido, recurso, libro (como término general)

**Pregunta**:
Pregunta abierta que un Miembro aporta para una Sesión sobre un Material. Tiene autor y, dentro de la Sesión, un asignado.
_Avoid_: Cuestión, interrogante

**Asignación**:
Vínculo entre una Pregunta y el Miembro que debe responderla en una Sesión concreta, resultado del Sorteo. Es donde viven las Notas de respuesta.
_Avoid_: Turno, reparto

**Momento de preparación**:
Fase breve entre la revelación de una Pregunta y la exposición verbal del asignado, donde escribe sus ideas principales.
_Avoid_: Tiempo de pensar, turno de notas

**Notas de respuesta**:
Ideas principales, palabras clave o argumentos que el asignado escribe durante el Momento de preparación. Pertenecen a la Asignación y pueden quedar vacías.
_Avoid_: Respuesta escrita, ensayo, minuta

**Complemento**:
Aporte breve (unos dos minutos) que el autor de una Pregunta hace tras la exposición del asignado, cuando está presente. Si una Pregunta tiene dos asignados, el autor complementa una sola vez, tras el último.
_Avoid_: Réplica, turno extra

**Sorteo**:
Asignación aleatoria de Preguntas a los participantes de la Sesión, con estado propio y oculto hasta revelar. Nadie —ni el Moderador— conoce su Pregunta hasta el momento de revelarla. Una Pregunta puede asignarse a hasta dos participantes, nunca a su autor. Estados: `pendiente` (aún no ejecutado), `oculto` (ejecutado, nadie ve las asignaciones), `revelando` (algunas asignaciones reveladas), `revelado` (todas reveladas).
_Avoid_: Ruleta, rifa, asignación manual

**Sin sorteo**:
Opt-out que un Participante marca al confirmar en el lobby: no recibe Asignación ni llamada del Sorteo y conversa libremente.
_Avoid_: No participar, espectador

**Fuera de sorteo**:
Marcado que el Moderador aplica a una Pregunta del pool para excluirla del Sorteo (duplicada o fuera de contexto).
_Avoid_: Descartada, descualificada

**Trivia**:
Minijuego de preguntas de opción múltiple sobre el Material, que recompensa memoria y atención. Se crea colaborativamente antes de la Sesión.
_Avoid_: Quiz, juego de preguntas

**Take**:
Disparador corto de conversación (frase para completar, votación o miniargumentación) que el moderador puede lanzar durante la Sesión.
_Avoid_: Prompt, disparador, gancho

**Insignia**:
Logro visible que recompensa participación, individual o colectivo.
_Avoid_: Badge, medalla, trofeo

**Punto**:
Unidad interna acumulable por acciones (preparar pregunta, participar, ganar trivia, asistencia). Base para calcular insignias y logros; no es la capa visible.
_Avoid_: Score, ranking

**Logro**:
Término paraguas para lo que un Miembro o el club gana: una Insignia o un hito.
_Avoid_: Premio, conquista

**Reconocimiento**:
Entrega concreta de un Logro en un momento dado (ej. cierre de Temporada, insignia otorgada por el moderador).
_Avoid_: Celebración, mención

**Temporada**:
Período de actividad del club (inicialmente un mes) con fecha de inicio y fin, dentro del cual se acumulan logros y puntos. Al cerrar, entrega reconocimientos y el ranking competitivo reinicia; los logros históricos persisten.
_Avoid_: Ciclo, ronda, liga

**Rating**:
Valoración agregada de un Material: promedio y número de votos, derivada de los Votos. Nunca expone votos individuales.
_Avoid_: Calificación, puntaje, nota

**Voto**:
Calificación anónima de 1 a 5 estrellas que un Miembro da a un Material en una Sesión. Modificable mientras la Sesión está activa; se congela al cerrarla.
_Avoid_: Estrella, valoración individual

**Histórico**:
Modo de ver la memoria del club: lectura de Sesiones, Preguntas, Notas, minijuegos, Logros y Rating desde la página de un Material. No es una entidad con datos propios.
_Avoid_: Archivo, registro, timeline
