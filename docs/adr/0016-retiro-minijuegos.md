# Retiro de minijuegos (trivia + takes)

Las sesiones son para debatir y por tiempo no encaja un juego adicional; trivia y takes llevan sin uso con tablas vacías. Decidimos borrado definitivo en DB + código (tablas, RPCs, policies, triggers, realtime y ramas de histórico/hitos/maestría), con DROP directo sin export.

## Considered Options

- Pausa reversible (ocultar UI, mantener tablas): se descartó porque guards, coherencia por grupo, realtime e histórico seguirían costando aunque vacíos.

## Consequences

- Salen `trivias, trivia_items, trivia_rounds, trivia_answers, trivia_hits, takes, take_votes`, premio `elephant_memory` / conteo `trivia_won` e UI `debate-tools-tray, trivia-bank, history-minigames` de trivia/takes. Sorteo, rating y aprecio quedan intactos.
