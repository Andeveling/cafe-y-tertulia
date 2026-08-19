# Conducir el debate desde la pantalla compartida

## Status: accepted

## Decision

Durante `en_curso`, la pantalla del moderador (compartida por Meet) presenta un **Escenario** central y mínimo — la Pregunta revelada, el estado de la Intervención actual y el temporizador — y los controles del moderador viven en esa misma pantalla, compactos y mostrando solo **acciones** (revelar, continuar, extender, siguiente), nunca el contenido de la asignación oculta. Así se conserva la sorpresa del Sorteo sin exigir una segunda pantalla/ventana.

El avance de fases es **siempre manual**: la app gira solo cuando el moderador pulsa "continuar". El temporizador es orientativo (transcurrido + sugerido), "extender" agrega tiempo y **nunca corta** una fase. El moderador, por ser también Participante, puede ser asignado por el Sorteo: su escenario muestra lo mismo y usa su teléfono para las Notas; los pulsos los da él o un colega.

## Escenas de una Intervención

Cada Asignación recorre: **oculta** ("próximo: [nombre]", Pregunta sin revelar) → **preparación** (Pregunta revelada + prompt "escribí tus ideas en tu teléfono" + temporizador) → **exposición** (Pregunta + asignado + temporizador) → **complemento** (si el autor está presente) → **completa** (siguiente de la rotación).

## Rejected alternatives

- **Auto-avance por temporizador**: se descarta; el tiempo es guía, no límite, y el corte automático competiría con la conversación.
- **Controles en zona no compartida / segunda ventana**: se descarta en el MVP; añade fricción y la sorpresa no requiere ocultar los controles (solo el contenido).
- **Dashboard con paneles múltiples**: se descarta; compite con la conversación.
