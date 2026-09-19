# Corazones por Intervención: aprecio a respuesta y pregunta

## Status: accepted

## Decision

Cada Intervención recoge **Corazones** (1-5, anónimos) en ventana viva: en `exposición` evalúan la respuesta del asignado, en `complemento` la pregunta del autor. Votan los presentes con Sala abierta menos el evaluado (autor vota exposición, asignado vota complemento; Espectador y Moderador sí); un Corazón por votante por fase, modificable hasta que el Moderador avanza. Votar vive solo en el dispositivo propio y el Escenario muestra reloj + `X de Y`, sin promedio en vivo; al congelar se descartan los individuales y solo persiste el **Aprecio** (promedio 1 decimal + conteo) por Intervención y fase, revelado al completar y en el Histórico.

Sin Complemento (autor ausente) no hay Corazón a la pregunta. El Aprecio solo alimenta `Conteo`, sin insignia automática nueva; sirve de insumo para los Reconocimientos de Temporada (`Gran debatiente`, `Creador de preguntas`). Con 2-3 presentes el anonimato es débil y se acepta sin bloquear.

## Considered Options

- **Promedio en vivo durante la votación**: se descarta; ancla a los indecisos (mismo motivo que ADR 0003).
- **Votar en la pantalla compartida**: se descarta; contamina el Escenario mínimo (ADR 0002) y rompe el secreto del voto.
- **Guardar corazones individuales**: se descarta; privacidad por eliminación, como el Voto.
- **Insignia automática por Aprecio alto**: se descarta en el MVP; competiría con `Cambio de perspectiva / Pregunta que hizo pensar` y añade código sin consumidor claro.
- **Umbral mínimo de corazones para mostrar promedio**: se descarta; el grupo es pequeño, igual que en ADR 0003.

## Consequences

- El anti auto-voto se aplica en servidor; el cliente solo oculta el botón.
- El Histórico guarda el Aprecio por Intervención, no hay perfil público ni ranking de personas.
- `Voto / Rating` siguen reservados al Material; `Corazón / Aprecio` a la Intervención.
