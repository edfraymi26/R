# Auditoría pública — 21 de octubre de 2026

Sitio: https://riverafinancialgroup.net. Versión observada: **3.3.0**, compilada el 20 de octubre de 2026 a las 23:53 UTC. Revisión realizada aproximadamente entre 01:01 y 01:10 UTC. La corrección preparada es **3.3.1**; no se publicó durante esta auditoría.

## Hallazgos y acciones

1. **Cuota real de Groq alcanzada en una consulta.** El servidor abrió SSE con HTTP 200 y emitió `error: quota`. No fue una ausencia de clave ni una caída completa del sitio. Otras consultas posteriores funcionaron. El límite exacto (por minuto/día, solicitudes/tokens) no puede determinarse con la respuesta pública; requiere el panel del propietario. No se cambió el modelo, el plan ni se prometen consultas ilimitadas. La recuperación a guía local se verificó mediante respuestas simuladas.
2. **Etiqueta prematura de conexión/respuesta.** Se reprodujo contra la interfaz publicada, simulando un delta vacío: la etiqueta pasó a «respuesta recibida» antes de volver a guía. Corrección: ignorar deltas vacíos antes de activar dicha etiqueta. Se añadió una regresión de navegador. Esta corrección necesita despliegue.
3. **Accesibilidad: comprobaciones automáticas incompletas.** axe no detectó infracciones en las rutas examinadas, pero dejó ciertos contrastes para revisión manual debido a imágenes, gradientes y capas superpuestas. Las pruebas de tokens pasan; no se declara conformidad exhaustiva WCAG ni validación de lectores de pantalla.

## Comprobaciones realizadas contra producción

- 40 páginas ES/EN: HTTP 200, idioma correcto, un H1 y canonical correspondiente.
- 46 enlaces/recursos internos únicos encontrados: ningún error HTTP.
- 404 real, sitemap, robots, tarjeta social y redirecciones heredadas.
- HTTP redirige a HTTPS; www redirige al dominio principal.
- `/.env`, `/netlify/functions/chat.mjs` y `/src/provider.mjs`: 404; no se encontraron archivos privados en esas rutas. Esto no constituye una auditoría de seguridad exhaustiva.
- Funciones: GET rechazado con 405; origen ajeno con 403; contenido no JSON con 415; lista vacía de mensajes con 400. No se hicieron pruebas de carga ni envíos de datos personales reales.
- 14 grupos de navegador contra la versión publicada: temas, persistencia, teclado, menús, diálogos, contactos con servicio, movimiento continuo y reducido, texto al 200 %, streaming presentado gradualmente, detener y reiniciar.
- 72 combinaciones de disposición: seis anchos (320–1920 px), dos temas, seis rutas representativas. Sin desbordamiento horizontal.
- axe en 12 combinaciones de ruta/tema y diálogo de contacto oscuro: sin infracciones automáticas detectadas, con contrastes incompletos registrados.
- Observación adicional de cuatro páginas en móvil: sin errores de consola ni solicitudes fallidas. En esa muestra, tiempos de carga aproximados de 0,48–0,67 s. Son mediciones de laboratorio a través del proxy, con caché entre páginas; no son Core Web Vitals de visitantes ni pruebas de red móvil lenta.
- Contactos: se revisaron destinos y mensajes preparados. No se enviaron WhatsApp, SMS, correos ni llamadas.

## Evaluación real de Niklaus

Se realizaron cinco solicitudes reales: cuatro respuestas completadas y una limitada por cuota.

- Smoke de SAM.gov: flujo real recibido y completado.
- Español: consulta de fuente oficial SAM.gov, evento `source.live=true`; respuesta sin promesa de contratos. Se contrastó el contenido recuperable de la página oficial. La extracción es parcial, no una lectura exhaustiva del sitio.
- Inglés: herramienta de cálculo, 300 / 1000 = 30 %, sin garantía de aumento de puntuación.
- Contexto de conversación + derivación: cuota; **no se considera aprobada esa evaluación real**.
- Interfaz real: cotización LLC con teléfono y correo correctos y sin precio inventado. Texto progresivo comprobado en muestras de 250 ms, finalizado aproximadamente en 4,5 s.

Los casos de error, reinicio, inyección HTML y ausencia de clave se simularon para no modificar secretos ni agotar cuotas. Esos resultados se distinguen de las cinco solicitudes reales. La muestra no certifica todas las respuestas futuras del modelo ni sustituye los casos de evaluación bilingües pendientes.

## Entorno y límites

El acceso directo de Node/Chromium estaba bloqueado en este entorno; se utilizó su proxy configurado. Chromium no reconocía la CA del proxy, por lo que la suite se ejecutó con la excepción HTTPS explícita del contexto de prueba. curl/Python/Node con el almacén del entorno sí validaron las conexiones. La excepción no modifica el sitio ni Netlify; estas pruebas de navegador no certifican por sí solas la cadena pública TLS.

Pendientes: Safari/iPhone y Android físicos, teclado virtual, lectores de pantalla, métricas de visitantes, revisión del panel/cuotas Groq, evaluación más amplia del modelo y comprobación de 3.3.1 después del despliegue. No se alteró el dominio ni se publicó ningún cambio.

## Evidencia

`evidence/production/` incluye informes de rutas, validación HTTP, navegador, resultados reales de IA con preguntas ficticias y capturas. `evidence/browser-report.json` corresponde a la corrección local: 15 grupos; `evidence/node22-verify.log`, 46 pruebas Node. No contiene claves.
