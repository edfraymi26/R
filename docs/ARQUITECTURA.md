# Arquitectura v3

HTML estático generado con Node.js, CSS propio y módulos JavaScript. Sin framework de ejecución ni fuentes remotas. Las únicas dependencias npm son herramientas de desarrollo (Playwright y axe); las Functions usan APIs nativas de Node.js/Web.

- `src/data.mjs`: catálogo, empresa, contactos y fuentes permitidas.
- `src/articles.mjs`: guías y páginas de privacidad, términos y transparencia.
- `build.mjs`: genera 40 páginas, 404, sitemap, robots y módulos públicos compartidos directamente en `dist/`. No reescribe fuentes durante la compilación.
- `src/scale.mjs`: compone cuatro piezas fotográficas transparentes en SVG. `assets/scale-parts.webp` es una adaptación de la referencia suministrada, sin texto incorporado.
- `assets/scale-motion.mjs`: rotación periódica suave del brazo en un pivote fijo; platos contrarrotados con oscilación propia. Base inmóvil y ciclo continuo de 5,6 segundos. Control bilingüe de pausa/reanudación; suspensión fuera de pantalla y con pestaña oculta. Header/footer estáticos; preferencia de movimiento reducido respetada al cargar y si cambia durante la animación.
- `assets/site.css`: una capa de estilos por componente, tokens semánticos de color para ambos temas y ajustes de pantalla. Sin la antigua superposición de paletas.
- `assets/theme.js`: script pequeño bloqueante en head que aplica el tema antes del primer render de body. Persiste solo `rivera-appearance`; tolera almacenamiento bloqueado y sincroniza pestañas. Sigue el sistema hasta elegir manualmente. CSS también cubre la preferencia del sistema si JavaScript no carga.
- `assets/app.mjs`: navegación, contactos, sesión de chat, errores localizados y presentación segura mediante nodos DOM. Nunca inserta HTML producido por el modelo.
- `src/niklaus-core.mjs`: catálogo para el prompt, filtro básico de identificadores, validación, herramientas y parser SSE. Genera helpers públicos sin incluir el servidor ni secretos.
- `src/provider.mjs`: configuración y clasificación de errores exclusivamente del servidor.
- `netlify/functions/chat.mjs`: validación de origen/método/tipo/tamaño en bytes/roles, contexto acotado, hasta dos llamadas a Groq, cancelación, límite de tiempo y logs mínimos sin contenido.
- `netlify/functions/niklaus-status.mjs`: presencia de configuración, nunca una afirmación automática de conectividad.
- `scripts/dev.mjs`: adaptador local HTTP de las funciones originales. Aplica CSP y redirecciones del archivo de configuración para las pruebas, pero no reproduce el rate limiting distribuido de Netlify.

## Fuentes y herramientas

Cálculo de utilización validado; comparación de servicios y hojas de ruta desde el catálogo. La consulta remota acepta solo IDs asociados a URLs fijas; no sigue redirecciones, limita tiempo/tamaño/tipos de contenido y marca por separado consulta realizada o referencia no consultada. D&B y Experian son fuentes privadas de sus propios servicios, no organismos gubernamentales. El nombre interno de la herramienta no atribuye afiliación oficial a Rivera.

La información externa entra como datos no confiables. El asistente no presenta trámites, abre cuentas, procesa pagos, lee expedientes ni envía mensajes humanos. No hay base de datos ni persistencia propia de conversaciones: solo memoria de la pestaña, borrada al recargar/reiniciar.

## Seguridad y presupuesto

La clave se usa únicamente en Functions hacia api.groq.com. Los errores del proveedor se traducen a códigos controlados, sin reenviar su cuerpo ni cabeceras. La CSP permite recursos propios; los enlaces del modelo se filtran y el texto se construye con textContent. El filtro de datos sensibles es heurístico, no una garantía de detección total.

El límite Netlify declarado es de ocho solicitudes por minuto por IP/dominio. Requiere validación en la plataforma; no es un contador global propio. Los límites gratuitos y las pruebas pendientes están en `GROQ.md` y `VERIFICACION.md`.

## Mantenimiento

`npm run verify` es obligatorio en la configuración de build de Netlify. Las pruebas de navegador se ejecutan con `npm run test:browser` y un servidor local. `dist/` es un resultado generado excluido de Git e incluido en el ZIP. No se incluyen node_modules, .git, credenciales ni cachés. La tarjeta social preconstruida se puede regenerar con `scripts/social-card.mjs` usando Chromium y el servidor local.

- `assets/text-pacer.mjs`: cola de presentación del texto recibido por SSE, separada de la lectura de red. La interfaz conserva el estado ocupado hasta terminar de mostrar el texto; abortar descarta la cola y el reinicio invalida el turno. No simula conexión con IA ni afecta el modo guía identificado.
