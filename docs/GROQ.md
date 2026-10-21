# Niklaus: modelo, presupuesto y diagnóstico

## Qué está comprobado

Modelo predeterminado: **`openai/gpt-oss-120b`**. El 20 de octubre de 2026 se consultó el [SDK TypeScript oficial de Groq](https://github.com/groq/groq-typescript/blob/main/src/resources/chat/completions.ts): enumera este identificador y documenta `reasoning_effort` con `low`, `medium` y `high` para GPT-OSS. Esta entrega usa `low`, chat completions, streaming y llamadas a herramientas.

Eso comprueba que el identificador y la opción están documentados por Groq; **no comprueba acceso en tu cuenta, disponibilidad actual del servicio ni calidad de respuestas**. No se contó con `GROQ_API_KEY` para consultar el catálogo autenticado ni generar una respuesta real.

Se intentó consultar estas páginas oficiales:

- https://console.groq.com/docs/model/openai/gpt-oss-120b
- https://console.groq.com/docs/models
- https://console.groq.com/docs/rate-limits

El proxy del entorno rechazó la conexión con **HTTP 403 (Tunnel connection failed)**. Por tanto, no se presentan cifras de cuota como si hubieran sido verificadas. La configuración se mantiene modificable mediante `GROQ_MODEL`, sin editar código, por si el catálogo cambia.

## Límites del presupuesto adicional de $0

Usa la cuenta gratuita de Groq y las prestaciones gratuitas disponibles en tu cuenta Netlify. Este código no activa suscripciones, no compra créditos ni implementa cobros. No requiere servicios pagos de búsqueda, base vectorial o base de datos.

Groq limita solicitudes por minuto/día y tokens por minuto/día; la cuota efectiva depende del modelo, organización y plan. En la consola de Groq revisa **Limits** y anota los límites vigentes para `openai/gpt-oss-120b` antes de publicar. No basta con que un modelo aparezca en el SDK. Ante agotamiento, el proveedor puede responder 429. No uses múltiples cuentas o claves para evadir límites.

Cada mensaje puede causar **hasta dos solicitudes de inferencia**: una inicial y una final después de hasta dos herramientas. El servidor limita el contexto conversacional a 6.000 caracteres, la salida a 1.000 tokens en la primera ronda y 1.300 en la segunda, y la espera a 45 segundos. El conocimiento del servicio y los esquemas de herramientas también consumen tokens. Estas cifras son límites de nuestra implementación, no cuotas prometidas por Groq.

Netlify también tiene cuotas de tráfico, compilación y Functions; sus límites pueden afectar toda la web, no solo el chat. El límite declarativo de ocho solicitudes de chat por minuto por IP/dominio no sustituye una cuota global ni garantiza bloquear todo abuso. Su aplicación efectiva depende de Netlify y debe confirmarse en el sitio desplegado. Si la plataforma corta una función antes del plazo del código, el cliente trata la respuesta incompleta como interrumpida.

No se promete tráfico ilimitado, nivel AGI ni disponibilidad permanente gratuita. El costo del dominio o servicios previamente contratados permanece. Si el presupuesto es cero, no habilites upgrades ni recargas automáticas: conserva la guía local y el contacto humano cuando falte disponibilidad.

## Configuración y conexión son estados distintos

`GET /api/niklaus-status` **no llama al proveedor** ni consume su cuota. Devuelve presencia de configuración y `connection: "unchecked"`. No comprueba la validez de la clave.

Una consulta real se hace desde el chat o con:

```sh
node scripts/doctor.mjs --url=https://riverafinancialgroup.net --ai
```

El comprobador exige deltas de texto y terminación correcta. No sustituye evaluar contenido, herramientas y exactitud con los casos bilingües de `CASOS-DE-EVALUACION.md`.

## Diagnósticos

| Código | Significado / acción |
|---|---|
| `not_configured` | Falta GROQ_API_KEY; añade el secreto en Functions y vuelve a desplegar. |
| `disabled` | NIKLAUS_ENABLED está en false; la guía permanece disponible. |
| `authentication` | Groq devolvió 401/403; revisa clave, permisos y cuenta. |
| `model` | Modelo inexistente, retirado o no disponible; revisa catálogo y GROQ_MODEL. |
| `provider_request` | Petición/opciones rechazadas (400/422 sin error específico de modelo). |
| `quota` | Límite temporal del proveedor; espera y revisa Limits. Un 429 de Netlify también se muestra como límite. |
| `timeout` | Se excedió la espera o el proveedor devolvió 408/504. |
| `unavailable` | Fallo de red/proveedor o respuesta no procesable. |
| `interrupted` | El flujo terminó sin señal de finalización válida; no se presenta como completo. |
| `empty` | El proveedor terminó sin texto útil. |
| `truncated` | Aviso: alcanzó el límite de salida; se puede pedir continuación. |

Antes de emitir texto, un error de IA ofrece guía local etiquetada. Si ya había texto, se conserva como respuesta incompleta con aviso. El siguiente mensaje puede volver a intentar IA: una falla temporal no bloquea permanentemente toda la sesión.

Los logs del servidor contienen solo evento, identificador aleatorio de solicitud, resultado, estado HTTP del proveedor y duración. No contienen clave, cabeceras de autorización, prompt, respuesta ni conversación completa. Las plataformas mantienen políticas y registros propios; revisa sus controles de datos.
