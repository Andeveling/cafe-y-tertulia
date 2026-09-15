# Presencia híbrida estilo Slack/juego

Presencia solo con Realtime efímero parpadea, no distingue en-sala y pierde la última vez al recargar. Decidimos híbrido: `club-roster` vivo + `sala:{id}` por sala + `members.last_seen` por heartbeat 30s throttled, con gracia offline 90s y Ausente a 5 min sin actividad fuera de Sala.

## Status: accepted

## Decision

Estados `En línea / En sesión / Ausente / Desconectado + última vez`, visibles en home y Presentes/Invitar primero, Sala después. Una key por Miembro (multi-pestaña colapsa), track con `last_active + session_id`, escucha `sync + join/leave`, orden estable por grupos. Llamar solo a En línea y Ausente; En otra sala muestra etiqueta sin botón. MVP con un solo canal `club-roster` que lleva `session_id` en el payload (equivale al canal por sala para saber quién está dónde); canal `sala:{id}` dedicado queda como follow-up si la Sala necesita latencia propia.

## Rejected alternatives

- **Solo Presence efímero**: se descarta; sin `last_seen` no hay "hace X" fiable ni offline real al recargar.
- **Solo `last_seen` por polling DB**: se descarta; latencia alta y coste innecesario frente a Realtime para lo vivo.
- **Ausente también dentro de Sala**: se descarta; en Debate se mira sin tocar y marcaría falsos ausentes.
