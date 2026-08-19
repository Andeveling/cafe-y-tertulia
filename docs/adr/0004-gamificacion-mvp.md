# Gamificación del MVP: insignias, puntos y temporadas

## Status: accepted

## Decision

La gamificación del MVP tiene **tres capas, de las cuales solo una es visible**:

1. **Conteos** — la capa de cálculo: contadores de eventos por Miembro y por club (preguntas creadas, sesiones asistidas, trivias ganadas, exposiciones, etc.). Son la base de todo lo demás y no se muestran.
2. **Insignias** (individuales) y **Hitos** (colectivos) — la capa visible, presentada con emojis como iconografía. Catálogo del MVP: las 9 del PRD §14 (Primera pregunta, Memoria de elefante, Cambio de perspectiva, Pregunta que hizo pensar, Participación perfecta, Lector constante, Primer libro terminado, 50 sesiones realizadas, 100 preguntas debatidas). Las de horizonte largo (50 sesiones, 100 preguntas) se implementan como umbrales dormidos sobre conteos que se disparan solos; no necesitan código nuevo cuando lleguen.
3. **Puntos** — solo concepto, no tabla: cada acción registra su Conteo; los valores de punto se definen cuando exista un consumidor que los use.

**Insignias individuales** (6): Primera pregunta (1ª pregunta creada), Memoria de elefante (ganar una trivia), Cambio de perspectiva y Pregunta que hizo pensar (subjetivas, las otorga el moderador en vivo durante la Intervención, ligadas a esa Pregunta/Intervención y registradas en el histórico; el panel de cierre solo lista pendientes), Participación perfecta (preparar una Pregunta *o* una Trivia *y* exponer si te toca Asignación, y sin faltar al cierre), Lector constante (varias sesiones consecutivas).

**Hitos colectivos** (3): Primer libro terminado (primer Material del club en `terminado`), 50 sesiones realizadas, 100 preguntas debatidas. Se registran en la página del Material o del club, no en un perfil individual.

**Superficies visibles**: perfil de Miembro (insignias propias), pantalla de cierre de Sesión (reconocimientos otorgados ese día), página del Material (Hitos del club + rating). Sin página de "explorar insignias" ni ranking.

**Temporadas**: un mes calendario natural, creadas y cerradas automáticamente; el moderador puede reabrir una cerrada para corregir errores. El cierre entrega **Reconocimientos por categoría** — Maestro de la trivia, Gran debatiente, Creador de preguntas, Asistencia perfecta — y **no** Top 1/2/3 ni "Mejor tertuliano". El ranking competitivo reinicia; los logros históricos persisten. El moderador puede otorgarse insignias a sí mismo (club pequeño y de confianza); el otorgamiento queda registrado.

## Considered Options

- **Ledger de puntos con valores** vs. **Conteos directos**: se eligió Conteos. El ledger sería una moneda intermedia sin consumidor visible en el MVP; los Conteos cubren las mismas insignias con menos código. El Punto queda documentado como regla futura.
- **Top 1/2/3 + reconocimientos** vs. **solo reconocimientos por categoría**: se eligió lo segundo. El PRD §23 marca el exceso de gamificación como riesgo y el mapa ya decidió "sin ranking permanente"; los Top son un ranking por volumen. "Mejor tertuliano" es un Top 1 con otro nombre y se descarta.
- **Insignias todas o subconjunto**: se eligieron las 9 del PRD; las de largo plazo son umbrales dormidos, no trabajo extra.

## Consequences

- El histórico guarda los Otorgamientos ligados a su Intervención/evento, no solo el hecho de tener la insignia.
- Los Reconocimientos por categoría al cierre de Temporada dependen de los Conteos de esa Temporada; al reiniciar, una misma persona puede repetir reconocimiento cada mes.
- Los valores de Punto, si algún día llegan, se suman sobre los mismos Conteos ya registrados: no hace falta migrar datos.
