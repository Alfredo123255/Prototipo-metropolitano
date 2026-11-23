# MetroFlujo

Prototipo funcional de distribución dinámica de flota del Metropolitano de Lima. Incluye un centro de operaciones y una vista para pasajeros conectados al mismo simulador. **Datos simulados – prototipo**: no utiliza información en vivo, servicios de ATU, APIs, backend ni base de datos.

## Ejecutar

Requiere Node.js 22 y npm.

```sh
npm install
npm run dev
```

Abre la dirección local que muestra Vite, normalmente <http://127.0.0.1:5173>.

- `/operador`: tablero, troncal, indicadores, recomendaciones y tablas.
- `/pasajero`: estación, ruta, próxima llegada y ocupación.
- `/operador?panel=stations`: estaciones y favoritos.
- `/operador?panel=history`: registro y deshacer.

```sh
npm run build         # TypeScript estricto + distribución en dist/
npm run preview       # Servir la compilación
npm run lint          # ESLint, sin advertencias permitidas
npm test              # Pruebas del motor determinista
npm run format:check  # Prettier
```

La tipografía Inter se sirve desde los archivos instalados; la aplicación no depende de fuentes externas. Las rutas de React Router requieren que un alojamiento estático devuelva `index.html` para rutas desconocidas. Vite ya lo hace durante el desarrollo.

## Estructura

```text
src/
  components/    Controles, indicadores, troncal, recomendaciones, tablas y diálogos
  data/          Tipos estrictos, estaciones, buses y perfiles de demanda
  i18n/es.ts     Textos de la interfaz en español
  pages/         Operador y Pasajero
  sim/           Motor puro, generador determinista y pruebas
  state/         Context, reducer, intervalos y preferencias locales
  styles.css     Tokens Campsite, componentes y adaptación responsive
```

La referencia visual original se conserva en `DESIGN (4).md`. Se usan sus colores, superficies, tipografía, bordes suaves y controles de píldora. Los tonos oscuros complementarios de verde y rojo permiten leer los estados con contraste suficiente; cada estado combina icono y texto.

## Simulación y escenarios

El selector del tablero permite cambiar entre **Hora punta mañana**, **Hora punta tarde**, **Valle** y **Evento especial**. Cambiar escenario reinicia sus colas, buses y decisiones. Reiniciar vuelve a la misma semilla y conserva el modo, la pausa y la velocidad.

Cada tick representa **un minuto simulado**. A ×1 ocurre cada 6 segundos reales; ×5 cada 1,2 segundos; ×10 cada 0,6 segundos. Pausa detiene el intervalo. El botón Avanzar un minuto permite recorrer una demostración manualmente, incluso pausada. Los intervalos se limpian al desmontar el proveedor.

Los perfiles y las horas iniciales están en `src/data/mocks.ts`. Para cambiar la demanda, modifica `PROFILES[escenario].queues` manteniendo el orden de las diez estaciones. Las seis franjas de pronóstico representan ventanas de 15 minutos; el panel destaca la ventana próxima. Son perfiles sintéticos del escenario, no predicciones recalculadas por una API.

La demo contiene 40 buses de 160 plazas y cuatro rutas ficticias. La cifra de 522 se incluye únicamente como contexto solicitado del sistema real. Las estaciones usan nombres reales; las posiciones siguen un esquema de la troncal, sin cartografía ni distancias oficiales. Los buses completan un ciclo al llegar al extremo del esquema.

El simulador mantiene dos mundos independientes para el mismo escenario y secuencia determinista de llegadas. **Sin MetroFlujo** empieza con una cola sintética 35 % mayor y buses con mayor ocupación, representando una distribución inicial menos equilibrada. **Con MetroFlujo** tiene una capacidad base de embarque ligeramente mayor y admite refuerzos. Esta comparación ilustra una hipótesis de diseño: no es una evaluación causal ni una medición de beneficios reales. Cambiar el interruptor selecciona el mundo observado, sin reiniciar su reloj ni transferir decisiones entre mundos.

Los indicadores se calculan con las colas y buses del mundo seleccionado. Los pequeños gráficos registran los últimos 20 ticks de cada indicador; no muestran series inventadas. La espera es una aproximación didáctica: cola media dividida entre una capacidad de embarque de referencia, más 0,8 minutos. Un bus se considera muy lleno por encima del 90 % y una estación saturada desde 180 personas. El intervalo de una ruta se aproxima con 46 minutos divididos por sus buses en servicio; un hueco ocurre al superar 6 minutos.

Aceptar una recomendación asigna buses disponibles a una ruta de refuerzo y a su estación objetivo. El primer bus llega después de los minutos indicados; el segundo, un minuto después. Cada llegada descuenta plazas disponibles de la cola. El mundo fijo continúa sin esa intervención. Un movimiento que supera el intervalo objetivo requiere confirmación explícita. La tercera recomendación inicial permite probar ese caso.

Deshacer restaura los buses originales mientras **ninguno** haya llegado. Una vez iniciado el embarque, se deshabilita y se explica el motivo. Descartar elimina la recomendación del escenario actual; Posponer la devuelve en tres minutos simulados. El catálogo de recomendaciones es deliberadamente acotado: reinicia el escenario para repetir la demo. El registro conserva cada decisión y la llegada del refuerzo.

La selección del pasajero y los favoritos se guardan en `localStorage`; la simulación vive en memoria, se comparte al navegar dentro de la aplicación y se reinicia al recargar. Las pestañas independientes del navegador no comparten el reloj.

## Heurísticas de Nielsen

| Heurística                      | Dónde se verifica en la interfaz                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Visibilidad del estado       | Reloj simulado, En vivo/Pausado, antigüedad de actualización, avisos tras acciones, tarjeta de refuerzo en camino y estado de carga del pasajero.                                           |
| 2. Lenguaje del mundo real      | Estación, andén, cola, hora punta, ruta y refuerzo; nombres de estaciones de Lima en ambas vistas.                                                                                          |
| 3. Control y libertad           | Pausar, avanzar, reiniciar, cambiar escenario, descartar, posponer, deshacer antes del embarque y logo para volver al inicio.                                                               |
| 4. Consistencia                 | Componentes compartidos para ocupación y estados, mismos iconos, tokens, nombres de ruta y simulación en ambas vistas; foco visible y enlaces subrayados al foco.                           |
| 5. Prevención de errores        | Se verifica disponibilidad de buses; Aceptar se deshabilita en modo fijo; mover buses que deje un intervalo superior a 6 min exige confirmación; Deshacer se bloquea después de la llegada. |
| 6. Reconocer antes que recordar | Leyenda de estados en troncal y pasajero, opciones visibles, razones de cada sugerencia y última estación/ruta recordadas.                                                                  |
| 7. Eficiencia                   | A acepta la primera sugerencia, D la descarta y espacio pausa/reanuda; búsqueda, filtros, orden, paginación, favoritos y velocidades ×1/×5/×10.                                             |
| 8. Diseño minimalista           | Canvas cálido Campsite, cuatro indicadores, troncal como foco, dos recomendaciones visibles y expansión opcional; tarjeta principal de llegada en móvil.                                    |
| 9. Recuperación de errores      | Búsqueda sin resultados con Limpiar filtros; selección guardada inválida con causa y Reintentar; estados vacío, carga y error accesibles desde Estados de demostración.                     |
| 10. Ayuda y documentación       | Recorrido inicial de tres pasos, descartable y reabrible; panel ¿Cómo funciona? con las tres piezas del sistema y explicación de atajos.                                                    |

Los atajos no actúan al escribir, interactuar con controles o abrir un diálogo. El recorrido recuerda su descarte en este navegador. Los diálogos nativos contienen el foco, admiten Escape y restauran el foco anterior.

## Accesibilidad y verificación

HTML `lang="es-PE"`, regiones semánticas, enlace para saltar al contenido, controles etiquetados, estados con icono y texto, barras de ocupación con `role="meter"`, SVG con descripciones, objetivos táctiles de 44 px y estilos de foco. Se respeta `prefers-reduced-motion`. Los avisos usan `role="status"` y el reloj anuncia solo cada diez minutos simulados para reducir interrupciones.

La troncal tiene una representación de lista en pantallas pequeñas. Las tablas mantienen sus datos esenciales sin ampliar la página; la columna de posición/pronóstico se oculta en móvil. El detalle completo se consulta en el esquema o en escritorio.

Las pruebas del motor cubren repetibilidad, efecto y escalonamiento de refuerzos, aislamiento del mundo fijo, deshacer, confirmación de huecos, posposición y 250 minutos en cada escenario. El objetivo de Lighthouse Accesibilidad es ≥90; una puntuación automatizada no sustituye la revisión con tecnologías de asistencia.

Verificación realizada: seis pruebas aprobadas, build y lint sin errores; Lighthouse 12.8.2 Accesibilidad **100/100 en Operador y 100/100 en Pasajero**. Se revisaron visualmente ambas vistas a 1280 y 390 px y se comprobó que el documento no desborda horizontalmente a 360 px. En el navegador se verificaron aceptar, llegada escalonada y reducción de cola, deshacer, confirmación de intervalos, posponer, comparación, atajo A, registro, favoritos, selección recordada y recuperación de estados vacío/error. No se observaron errores ni advertencias de consola durante estas interacciones. Los informes locales de auditoría se guardan en `.qa/`, excluido de Git.

La compilación de producción obtuvo **99/100 en Rendimiento** en Lighthouse de escritorio contra el servidor local, sin limitación artificial de red: primera pintura y elemento principal a **0,7 s**, con **0 ms** de bloqueo total. Es una medición local de esta ejecución, no una garantía para cualquier dispositivo o conexión. Las capturas de escritorio y móvil están en `.qa/operador-1280.jpg` y `.qa/pasajero-390.jpg`.

Consulta `DEMO.md` para el guion de dos minutos.
