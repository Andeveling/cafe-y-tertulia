# Sorteo de preguntas: reglas y casos borde

## Status: superseded by ADR-0008

## Decision

El Sorteo asigna aleatoriamente las Preguntas del pool (todas las propuestas en `preparación` para el Material de la Sesión, presente o no su autor) a los Participantes confirmados, con la única restricción de que nadie responde su propia Pregunta. Una Pregunta puede asignarse a hasta dos participantes; si aun así hay más participantes que posiciones, los sobrantes conversan libremente sin Asignación. Proponer Preguntas no es condición para presentar.

Todo el Sorteo —incluido el Moderador— permanece oculto hasta revelar: en `oculto` nadie ve las asignaciones, y el orden de revelación es una permutación aleatoria fijada al sortear que el Moderador avanza de a una en `en_curso`. El Sorteo se ejecuta una sola vez en el lobby; al agotarse las Asignaciones el debate continúa libre, sin segundo sorteo formal en el MVP.

## Model

La asignación es un emparejamiento aleatorio en un grafo bipartito Participantes→Preguntas que excluye la autoría (matching aleatorio máximo con CSPRNG). Si sobran participantes, se reasigna repitiendo Preguntas permitidas con límite 2; si aun así no hay emparejamiento, quedan sin Asignación. La misma permutación aleatoria define el orden de revelación.

Por Asignación revelada: se muestra la Pregunta → el asignado hace su Momento de preparación → expone → si su autor está presente, este complementa (unos dos minutos) → se marca completa → se avanza. Si dos participantes comparten Pregunta, sus Asignaciones se revelan por separado y el autor complementa una sola vez, tras el último exponente.

## Rejected alternatives

- **Sorteo visible para el Moderador de antemano**: se descarta para conservar la sorpresa total del momento "revelar"; el Moderador avanza por orden fijo y nunca ve qué contiene la siguiente asignación.
- **Segundo sorteo en sesiones largas**: se descarta en el MVP; el tiempo es guía, no límite, y la conversación libre cubre el excedente sin añadir mecánica.
- **Deduplicación automática de Preguntas repetidas**: se descarta; quedan como Preguntas distintas y el Moderador excluye las sobrantes con "Fuera de sorteo".
- **Dejar sin asignación cuando hay más participantes que Preguntas**: se descarta como regla única; se prefiere permitir hasta dos asignados por Pregunta antes de que alguien quede sin llamada.
