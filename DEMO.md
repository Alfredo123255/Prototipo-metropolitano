# MetroFlujo · Demo de dos minutos

**Preparación:** abre `/operador`. Cierra o completa el recorrido inicial. Elige **Hora punta mañana**, activa **Con MetroFlujo**, pausa y pulsa **Reiniciar escenario**. La pausa permite controlar cada minuto con **Avanzar un minuto**. Mantén visible la etiqueta Datos simulados – prototipo.

| Tiempo    | Acción y relato                                                                                                                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20 | «La flota existe, pero no siempre está donde se necesita». Muestra los 40 buses simulados, las diez estaciones y los cuatro indicadores. Selecciona Estación Central: empieza con 268 personas y estado Saturado.                                                                                 |
| 0:20–0:40 | Lee la primera acción: enviar dos buses de B a Estación Central. Señala la cola, la demanda prevista y que B conserva un intervalo de hasta seis minutos. Pulsa **Aceptar**; aparece Refuerzo en camino.                                                                                          |
| 0:40–1:00 | Pulsa **Avanzar un minuto** tres veces: llega el primer refuerzo. Pulsa una cuarta vez: llega el segundo. La cola baja y el estado cambia. Los buses llegan separados para evitar coincidir en el andén. Antes de la primera llegada también puedes mostrar Deshacer.                             |
| 1:00–1:25 | Cambia a **Vista Pasajero**. Elige Estación Central y Expreso 1. Muestra la espera del próximo bus, ocupación, siguientes tres llegadas y el estado actualizado de la estación. Si cambias de vista antes del tercer minuto, también verás el aviso de refuerzo en camino.                        |
| 1:25–1:45 | Vuelve a **Vista Operador** y activa **Sin MetroFlujo**. El escenario y el minuto son los mismos, pero este mundo no recibió refuerzos. Compara la cola, espera y saturación. Explica que las diferencias iniciales y las reglas son hipótesis sintéticas del prototipo, no resultados oficiales. |
| 1:45–2:00 | Vuelve a Con MetroFlujo. Abre **Decisiones** para ver la autorización y la llegada. Termina en **¿Cómo funciona?**: pronóstico de demanda, medición de ocupación y recomendaciones de reparto.                                                                                                    |

## Recorridos opcionales

- **Control del usuario:** reinicia, acepta y pulsa Deshacer antes de avanzar tres minutos. Los buses regresan a su asignación anterior.
- **Prevención:** reinicia, expande Ver 1 acción más y acepta el movimiento de tres buses de C. Se pide confirmación porque quedaría un intervalo de siete minutos. Cancela para conservar la cobertura.
- **Posposición:** pospón una sugerencia y avanza tres minutos; vuelve al panel.
- **Eficiencia:** usa A, D y espacio fuera de formularios y botones. Explora filtros, orden y favoritos en Estaciones.
- **Recuperación:** en Vista Pasajero, abre Estados de demostración y prueba el estado vacío o el error. Reintentar recupera las llegadas.
- **Escenarios:** alterna mañana, tarde, valle y evento especial; cada cambio reinicia la misma semilla del escenario.
