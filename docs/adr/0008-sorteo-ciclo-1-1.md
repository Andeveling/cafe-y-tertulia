# Sorteo en ciclo 1:1, Espectador autodclarado

El Sorteo deja de ser un matching bipartito (hasta 2 asignados por Pregunta, pool con ausentes, sobrantes sin Asignación) y pasa a un ciclo 1:1 entre presentes que no son Espectador. Cada uno responde exactamente una Pregunta ajena; nadie se queda sin turno salvo quien se sacó. Así se garantiza participación simétrica en mesas chicas, que es el caso real del club.

Quien marca Sin sorteo queda Espectador: no responde y sus Preguntas no entran. El Moderador ya no pasa a nadie a Espectador. Ausentes no entran. Si un autor tiene varias Preguntas, elige cuál entra; si no elige, una al azar. Hacen falta al menos dos Listos para avanzar. Quien no alcanzó a escribir en `Preguntas` lo hace en `Presentes` sin volver atrás.

Supersede ADR-0001.

## Considered Options

- **Seguir ADR-0001 (hasta 2 asignados, pool con ausentes)**: se descarta por ahora; deja gente sin turno o con dos Intervenciones y no encaja con “todos menos el Espectador participan una vez”.
- **Espectador y Sin sorteo como roles distintos**: se descarta; en la mesa se leían como lo mismo y trababan el avance (sin Pregunta + En sorteo bloqueaba Listos).
- **El Moderador asigna Espectador**: se descarta; cada quien se saca. Si alguien no actúa, la mesa espera.

## Consequences

- Una Pregunta ya no tiene dos asignados: el Complemento es siempre una vez, tras el único exponente.
- Preguntas de ausentes y las no elegidas por su autor quedan como memoria, sin Asignación.
- `opt_out` y `role = spectator` pasan a ser la misma condición de dominio (Espectador).
