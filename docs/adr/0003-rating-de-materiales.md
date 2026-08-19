# Rating de materiales: voto efímero, solo agregados

## Status: accepted

## Decision

El Voto es un acto de sesión: solo los Participantes confirmados (incluido el Moderador y quienes marcan "Sin sorteo") votan el Material de la Sesión, de forma anónima, con 1 a 5 estrellas, en su dispositivo individual — la UI de votación nunca aparece en la pantalla compartida, reservada para el Escenario del debate (ADR 0002). El voto es voluntario, se abre al terminar la última Intervención del debate como una acción del Moderador dentro de `en_curso` (sin nuevo estado de sesión), y es modificable hasta que el Moderador lo cierra manualmente. Al cerrar la Sesión el agregado se congela — promedio (1 decimal) y conteo — materializado por Sesión y acumulado por Material, y los votos individuales se descartan: la privacidad se cumple por eliminación, no solo por no-exposición.

Durante la votación el Moderador solo ve el progreso ("X de Y votaron") sin nombres; al cerrarla, la pantalla compartida muestra una tarjeta resumen (promedio + conteo) que permanece hasta cerrar la Sesión. El Rating está siempre visible en el Histórico y en la página del Material, que no recoge votos: votar fuera de sesión queda fuera del MVP. En `cerrada` el Moderador puede mover o borrar el agregado de la Sesión (p. ej. Material mal asignado, Sesión duplicada), nunca votos individuales; en `histórico` el Rating es inmutable.

## Rejected alternatives

- **Voto fuera de sesión (página del Material)**: se descarta en el MVP; rompería el congelado al cerrar, permitiría rating de ausentes y convertiría la memoria del club en un sitio de reseñas.
- **Guardar votos individuales de forma permanente (sin exponerlos)**: se descarta; la privacidad por eliminación es más simple de justificar y elimina el riesgo de filtración futura. Costo aceptado: no existe historial de voto por Miembro.
- **UI de votación en pantalla compartida**: se descarta; contamina el Escenario mínimo.
- **Promedio en vivo mientras se vota**: se descarta; ancla y sesga a los indecisos.
- **Auto-revelado al votar todos**: se descarta; roba al Moderador el momento de cierre (la sesión avanza 100% manual, ADR 0002).
- **Voto obligatorio**: se descarta; la app acompaña, no dirige; el cierre nunca depende de que todos voten.
- **Umbral mínimo de votos para mostrar promedio**: se descarta; el grupo es pequeño y el voto es anónimo.