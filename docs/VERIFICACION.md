# Informe de entrega original · Rivera v3.3 · 20 de octubre de 2026

**Versión 3.4:** 51 pruebas Node; 17 grupos de navegador; 42 páginas indexables + 2 agradecimientos noindex + 404. El formulario de reseñas se probó con envío interceptado: falta activar Netlify Forms, desplegar y verificar recepción real. Las reseñas de prueba no se enviaron ni se publicaron. El historial inferior describe las entregas previas.

**Actualización 21/10:** este informe conserva las pruebas originales. La auditoría pública posterior sí incluyó llamadas reales a Groq; véase `AUDITORIA-PUBLICA-2026-10-21.md`. La corrección 3.3.1 pasó 46 pruebas Node y 15 grupos locales de navegador. La corrección de teclado 3.3.2 tiene su alcance y limitaciones en `TECLADO-MOVIL.md`.

## Alcance

Se leyó el código del ZIP antes de modificarlo. La entrega conserva la web informativa bilingüe y el catálogo, reemplaza la identidad visual, incorpora dos temas y mejora el diagnóstico y recuperación de Niklaus. No se publicó en Netlify, no se subió a GitHub y no se modificó el dominio.

## Revisión de streaming v3.3

Se conserva la estética de v3.2 y se añade una cola de presentación independiente del streaming de red: hasta tres caracteres cada 50 ms, con pausas de 150 ms al terminar un bloque en puntuación. Detener descarta el texto pendiente; el historial y la copia contienen solo el texto mostrado. Se prueban ráfagas, Unicode, cancelación durante la presentación y reinicio sin contenido obsoleto. La velocidad real de Groq no se evaluó: las pruebas del navegador usan respuestas simuladas. Se vuelven a ejecutar `npm run verify` y la suite de navegador. La instalación reproducible, el empaquetado Netlify y las comprobaciones de documentación Groq de la tabla proceden de v3; las funciones no cambiaron en esta revisión.

## Resultados

| Comprobación | Resultado |
|---|---|
| Instalación reproducible `npm ci` | Correcta con el lockfile incluido |
| `npm run verify` | Compilación, pruebas y comprobador estático correctos |
| Pruebas Node | **46 aprobadas**, 0 fallidas, 0 omitidas |
| Salida estática | **40 páginas bilingües + 404**, **2.273 referencias locales** verificadas |
| Runtime | Verificación con Node.js **22.23.3** y **24.19.0** |
| Empaquetado de Functions | CLI oficial Netlify **27.14.0**, dos bundles correctos, también ejecutado bajo Node 22 |
| Rutas de Functions | Manifest de empaquetado contiene `/api/chat` y `/api/niklaus-status`, modo streaming y regla de límite de chat |
| Navegador | Chromium **154.0.8037.57**, Playwright **1.64.1** |
| Pruebas de navegador | **14 grupos aprobados**; reporte y capturas incluidos en `evidence/` |

Las pruebas Node cubren selección de servicios, contacto con contexto, cálculo validado, hojas de ruta, datos sensibles, validación de solicitudes, origen, bytes, estado de configuración, errores 400/401/403/404/422/429/503/504, tiempo de espera, streaming parcial y completo, herramientas, fuentes bloqueadas, cancelación, límites de tramas, ausencia de conversaciones/claves en logs y comportamiento del tema. Un caso verifica que el primer delta llega antes de completar el flujo del proveedor simulado.

La prueba de contraste de tokens exige **4,5:1 para texto normal** y **3:1 para foco y bordes esenciales de controles** frente a las superficies utilizadas en cada tema.

## Navegador y accesibilidad

- HTTP: las 40 rutas en su idioma, 404, sitemap, robots y redirección de privacidad.
- Ambos temas a **320, 390, 768, 1024, 1366 y 1920 px**, en seis páginas representativas por tamaño/tema; sin desbordamiento horizontal.
- Selección por teclado, `aria-pressed`, persistencia al recargar, idioma inglés, sincronización entre pestañas, preferencia del sistema y almacenamiento bloqueado.
- Tema oscuro aplicado antes del primer fotograma con body; fondo comprobado #20211F.
- Menú de escritorio/móvil, Escape, foco de retorno y ciclo de foco en diálogo.
- Contacto contextual SAM.gov en WhatsApp, SMS y correo; los enlaces no se enviaron.
- Guía local sin clave, configuración sin conexión afirmada, cinco categorías de error con respuestas simuladas, recuperación posterior y renderizado de texto sin ejecutar HTML del modelo.
- Botón Detener con textarea vacío; reinicio que impide insertar respuestas antiguas.
- Movimiento reducido; brazo y platos móviles, base fija y oscilación comprobada después de tres segundos, pausa/reanudación, etiquetas ES/EN y suspensión fuera de pantalla.
- Enlace para saltar al contenido y ampliación de texto al **200 %**. Se corrigió un desbordamiento del encabezado encontrado durante esta prueba.
- Capturas inspeccionadas de portada clara/oscura, móvil, diálogos y tarjeta social. No hubo excepciones JavaScript no controladas en la suite.

axe (reglas WCAG A/AA) no detectó infracciones automáticas en seis rutas representativas por tema y el diálogo de contacto oscuro. Reportó algunos contrastes como **revisión manual pendiente** por imágenes SVG recortadas o elementos superpuestos: no se contabilizan como comprobaciones automáticas aprobadas. Los colores efectivos se contrastaron adicionalmente mediante las pruebas de tokens y las capturas. Esto no es una certificación exhaustiva de accesibilidad.

## Qué se simuló y qué no se pudo comprobar

**No hubo llamadas reales a Groq.** Las pruebas de respuestas, streaming, herramientas y errores usan un proveedor simulado. Los 50 casos de `CASOS-DE-EVALUACION.md` no son evaluaciones ejecutadas del modelo. Falta una clave real, acceso al modelo y evaluación bilingüe de respuestas.

Se confirmó `openai/gpt-oss-120b` en el SDK oficial de Groq. El proxy bloqueó las páginas de documentación de modelos/cuotas con HTTP 403; **no se verificaron las cifras actuales del plan gratuito ni la disponibilidad en la cuenta del propietario**. Detalles y enlaces en `GROQ.md`.

El antecedente público `mode: guide` / `503 not_configured` aportado por el propietario corresponde a una revisión anterior. **No se presenta como resultado público actual**. Las solicitudes de esta entrega se hicieron contra el servidor local; no se revalidó el dominio público ni se modificó el despliegue activo.

El empaquetado local de Netlify comprueba inclusión de código y rutas, pero no acredita una publicación real, inyección del secreto, rate limiting efectivo, cuota o límites de ejecución de la cuenta. El adaptador local no emula todos los servicios de Netlify.

Pendientes tras desplegar:

1. Añadir `GROQ_API_KEY` en Netlify Functions / Production y hacer un despliegue completo.
2. Ejecutar `doctor.mjs` normal y con `--ai`; confirmar respuesta completa, funciones y límites de la cuenta.
3. Ejecutar los casos de evaluación bilingües con datos ficticios y comprobar precisión de fuentes y herramientas con el modelo real.
4. Probar Safari/iPhone y Android reales, teclado virtual, lectores de pantalla y contactos efectivos. Los anchos emulados en Chromium no equivalen a esos dispositivos.
5. Revisar controles de datos y condiciones contractuales/legales de la operación. Los textos web no sustituyen esas obligaciones.

## Evidencia incluida

`evidence/browser-report.json` registra los grupos de navegador, las comprobaciones axe y sus resultados incompletos. `evidence/node22-verify.log` contiene el resultado del comando con Node 22. Las capturas muestran la versión revisada. Los paquetes de funciones fueron comprobados localmente; Netlify debe reconstruirlos desde el código fuente incluido.
