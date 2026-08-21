# Café y Tertulias

Club de lectura y conversación. Aplicación web que acompaña y organiza las sesiones del club: antes de la reunión recoge las preguntas, durante la tertulia organiza la dinámica (sorteo, debate, minijuegos) y después conserva la memoria de lo discutido. La conversación está primero; la aplicación acompaña, no dirige.

## Language

**Miembro**:
Una persona del club con acceso a la aplicación. Ciclo de vida: `invitado` (creado por la Invitación de otro Miembro, aún no ingresó), `activo`, `baja` (sus aportes permanecen como memoria del club).
_Avoid_: Usuario, Participante (como entidad)

**Participante**:
Un Miembro confirmado como presente en una Sesión concreta. Término de contexto de sesión, no una entidad propia.
_Avoid_: Asistente, integrante

**Sala de Sesión**:
Única vista de una Sesión activa: ocupa todo el espacio de la pantalla, cambia de contenido según la Etapa y se mantiene sincronizada en realtime para Moderador y Participantes. Durante una Sesión nadie navega a otras páginas: las transiciones ocurren dentro de la Sala.
_Avoid_: Lobby (como página), Escenario (como página separada), dashboard

**Etapa**:
Lo que la Sala muestra en cada momento y todos los dispositivos ven igual, en orden fijo: `Preguntas` → `Presentes` → `Sorteo` → `Debate` → `Cierre`. El Estado técnico de la Sesión respalda a las Etapas; la interfaz siempre indica la Etapa actual y las ya completadas.
_Avoid_: Pantalla, vista, pestaña

**Listo**:
Condición de un Participante que está presente y tiene al menos una Pregunta registrada para la Sesión. Cuando todos están Listos, la siguiente Etapa queda habilitada; el Moderador puede avanzar de todos modos y la interfaz muestra siempre quién falta y por qué.
_Avoid_: Ready, confirmado, completo

**Moderador**:
Estado temporal que un Miembro asume al iniciar o conducir una Sesión. Lo asume quien abre la Sesión, puede cederlo a otro Participante en el lobby antes del Sorteo y no se transfiere durante la Sesión; cualquier miembro puede serlo — no existe un moderador permanente.
_Avoid_: Host, anfitrión, admin de sesión

**Sesión**:
Encuentro del club (presencial o por videollamada) con sus fases, estados y datos asociados.
_Avoid_: Tertulia (como término de modelo), reunión, meet

**Estado de la sesión**:
Ciclo de vida técnico de una Sesión: `preparación` (los miembros proponen materiales, preguntas y trivias antes de que exista una cita), `lobby` (el moderador confirma participantes y ejecuta el Sorteo), `en_curso` (el debate; internamente lleva un punto de revelación y el estado de la intervención actual), `cerrada` (datos consolidados al cerrar — rating congelado y minijuegos finalizados; solo editable por el moderador de la sesión para correcciones puntuales: rango, fecha programada, notas de respuesta y agregado de rating vía `clear_session_rating`; nunca votos individuales, participantes, asignaciones, sorteo ni resultados de minijuegos) e `histórico` (solo lectura, permanente e inmutable; corresponde al valor técnico `archived`). `cerrada → histórico` es manual inmediato con archivado automático a las 48h. Los minijuegos son acciones dentro de `en_curso`, no estados propios. Las Etapas visibles de la Sala se apoyan en estos estados.
_Avoid_: Fase, status, archivado (como término de dominio; usar `histórico`)

**Material**:
Contenido sobre el que se conversa: libro, podcast, video o artículo. Tiene un pipeline de estados (propuesto → seleccionado → en curso → terminado) y puede cubrirse en varias Sesiones.
_Avoid_: Contenido, recurso, libro (como término general)

**Rango cubierto**:
Porción del Material que aborda una Sesión concreta (ej. "Capítulos 1-3", "Ep. 2", "Min 0-30"). Se define progresivamente al crear cada Sesión como texto libre, sin lista previa de capítulos ni validación de solapes; una Sesión puede cubrir uno o varios capítulos. Es la etiqueta que ordena la cronología del Histórico.
_Avoid_: Capítulo (como entidad), episodio, sección

**Pregunta**:
Pregunta abierta que un Miembro aporta para una Sesión sobre un Material, asincrónicamente: puede escribirla días antes desde la etapa `Preguntas` de la Sala. Su texto es visible solo para su autor hasta la Intervención que la revela; los demás participantes ven autor y estado (enviada ✓), no el contenido. Tiene autor y, dentro de la Sesión, un asignado.
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

**Intervención**:
Ciclo de una Asignación dentro del debate: `oculta` → Momento de preparación → `exposición` → Complemento → completa. Lo conduce el Moderador; el temporizador orienta el ritmo pero nunca corta ni fuerza transiciones — solo habilita acciones de conducción (tiempo extra, siguiente fase). La rotación de Intervenciones es la permutación aleatoria fijada por el Sorteo.
_Avoid_: Turno, intervención libre (como fase), bloque de debate

**Escenario**:
Zona central de la pantalla compartida donde vive la conversación: la Pregunta revelada, el estado de la Intervención actual y el temporizador. Mínimo y focal; no compite con la charla. Los controles del Moderador solo exponen acciones (revelar, continuar, extender, siguiente), nunca el contenido oculto.
_Avoid_: Dashboard, panel, stage

**Sorteo**:
Asignación aleatoria de Preguntas a los participantes de la Sesión. Ejecutado el Sorteo, todos ven las parejas autor → asignado, pero el texto de cada Pregunta permanece oculto hasta la Intervención de su asignado: la sorpresa es el texto y el momento, no la pareja. Una Pregunta puede asignarse a hasta dos participantes, nunca a su autor. Estados: `pendiente` (aún no ejecutado), `oculto` (ejecutado: parejas visibles, textos ocultos), `revelando` (algunas Intervenciones completadas), `revelado` (todas completadas).
_Avoid_: Ruleta, rifa, asignación manual

**Espectador**:
Persona presente en una Sesión que esta vez no participa: no aporta Preguntas, no recibe Asignación y no cuenta para la condición de todos Listos. La agrega el Moderador a la mesa; sí cuenta como presente. No es una variante de Sin sorteo: el que está Sin sorteo aportó al club pero prefiere conversar libre.
_Avoid_: Invitado pasivo, oyente, audiencia

**Sin sorteo**:
Opt-out que un Participante marca al confirmar en el lobby: no recibe Asignación ni llamada del Sorteo y conversa libremente. Difiere del Espectador en que quien está Sin sorteo es Miembro activo y aporta Preguntas normalmente.
_Avoid_: No participar, espectador

**Fuera de sorteo**:
Marcado que el Moderador aplica a una Pregunta del pool para excluirla del Sorteo (duplicada o fuera de contexto).
_Avoid_: Descartada, descualificada

**Trivia**:
Minijuego de preguntas de opción múltiple sobre el Material, que recompensa memoria y atención. Se crea colaborativamente antes de la Sesión.
_Avoid_: Quiz, juego de preguntas

**Ronda de trivia**:
Grupo de 3-5 preguntas de Trivia que se juegan de una vez dentro de `en_curso`. Cada acierto suma +1 punto interno, sin penalización por error; todos responden en su dispositivo a la vez y los resultados se muestran agregados en la pantalla del moderador, sin exponer errores individuales por pregunta.
_Avoid_: Quiz, partida, nivel

**Marcador**:
Conteo de aciertos por participante dentro de una Trivia, visible al final del juego. Es la capa visible del minijuego; alimenta la acumulación de Puntos.
_Avoid_: Score, puntuación del juego, ranking del juego

**Take**:
Disparador corto de conversación (frase para completar, votación o miniargumentación) que el moderador puede lanzar durante la Sesión. En el MVP, solo la variante de frase disparadora con votación rápida.
_Avoid_: Prompt, disparador, gancho

**Posición**:
Postura de un participante ante un Take: de acuerdo, en desacuerdo o neutral. Se recoge por votación rápida y solo se muestra agregada (conteo por postura); las posiciones individuales nunca se exponen.
_Avoid_: Voto del take, respuesta, postura individual

**Insignia**:
Logro visible individual que recompensa participación. Los logros del club como grupo son Hitos.
_Avoid_: Badge, medalla, trofeo

**Invitación**:
Acto por el que un Miembro (padrino) suma a una nueva persona al club; quien la recibe queda como Miembro `invitado` hasta su primer ingreso. Cualquier Miembro puede invitar; no existe invitación pública.
_Avoid_: Alta, registro, signup, reclutar

**Punto**:
Unidad interna acumulable por acciones (preparar pregunta, participar, ganar trivia, asistencia). Base para calcular insignias y logros; no es la capa visible. En el MVP entra como concepto (regla documentada), no como tabla: cada acción registra un Conteo.
_Avoid_: Score, ranking

**Conteo**:
Contador de eventos que alimenta Puntos e Insignias: preguntas creadas, sesiones asistidas, trivias ganadas, exposiciones, etc. Es la capa de cálculo del MVP; los valores de punto se definen cuando exista un consumidor que los use.
_Avoid_: Evento, métrica, ledger

**Logro**:
Término paraguas para lo que un Miembro o el club gana: una Insignia (individual) o un Hito (colectivo).
_Avoid_: Premio, conquista

**Hito**:
Logro colectivo del club, no de un Miembro: Primer libro terminado, 50 sesiones realizadas, 100 preguntas debatidas. Se registra en la página del Material o del club, no en un perfil individual.
_Avoid_: Meta, logro grupal

**Reconocimiento**:
Entrega concreta de un Logro en un momento dado: insignias otorgadas por el moderador (incluido él mismo) y, al cierre de Temporada, Reconocimientos por categoría — Maestro de la trivia, Gran debatiente, Creador de preguntas, Asistencia perfecta — sin Top 1/2/3 ni ranking.
_Avoid_: Celebración, mención, premio

**Otorgamiento**:
Acción del moderador de entregar una Insignia a un Miembro durante una Intervención (las subjetivas "Cambio de perspectiva" y "Pregunta que hizo pensar"), o bien la entrega automática al cumplir un umbral. Queda registrado en el histórico, ligado a la Intervención o al evento que lo disparó.
_Avoid_: Concesión, entrega, award

**Temporada**:
Período de actividad del club de un mes calendario natural, con fecha de inicio y fin, dentro del cual se acumulan logros y puntos. Se crea y cierra automáticamente por calendario; el moderador puede reabrir una cerrada para corregir errores. Al cerrar entrega los Reconocimientos por categoría y el ranking competitivo reinicia; los logros históricos persisten.
_Avoid_: Ciclo, ronda, liga

**Rating**:
Valoración agregada de un Material: promedio y número de votos, derivada de los Votos de todas sus Sesiones; también existe el agregado por Sesión. Nunca expone votos individuales.
_Avoid_: Calificación, puntaje, nota

**Voto**:
Calificación anónima de 1 a 5 estrellas que un Participante da al Material de la Sesión. Voluntario y modificable mientras la Sesión está activa; al cerrarla se congela y el voto individual se descarta: solo persiste su aporte al agregado.
_Avoid_: Estrella, valoración individual

**Histórico**:
Modo de ver la memoria del club: lectura de Sesiones, Preguntas, Notas, minijuegos, Logros y Rating desde la página de un Material. No es una entidad con datos propios.
_Avoid_: Archivo, registro, timeline
