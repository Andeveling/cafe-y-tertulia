# Retiro definitivo de minijuegos (Trivia + Takes)

Las Sesiones existen para debatir en la Sala. Los Minijuegos (Trivia + Takes) quedaron sin uso porque por tiempo no encaja un juego adicional al debate, pero sus tablas, RPCs, políticas, triggers, publicación realtime y UI seguían vivos y había que mantenerlos aunque estuvieran vacíos.

## Status: accepted

Se retiran Trivia y Takes de la base y del código en un solo corte (issue #85): siete tablas y tres enums eliminados, RPCs de ciclo y lectura eliminados, ramas de Histórico, Hitos y Maestría retiradas, Cierre simplificado (ya no bloquea por trivia en curso ni votación abierta; mantiene Sorteo revelado). Sorteo, Rating y Aprecio quedan intactos. DROP directo sin exportación: cero filas en la nube vinculada.

## Considered Options

- **Pausa reversible (feature flag)**: mantiene guards, políticas, realtime y UI sin uso. Se descarta por coste de mantenimiento.
- **Retiro parcial (solo UI)**: deja RPCs huérfanos y tablas vacías con RLS. Se descarta: el corte es DB + código a la vez.
- **Reversión futura**: si algún día vuelven los juegos, será propuesta nueva con su ADR, no reversión parcial.
