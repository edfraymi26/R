# Instalación en el sitio Netlify existente

## 1. Conserva la versión anterior

Guarda el despliegue anterior y su configuración para poder volver atrás. Esta entrega no migra ni elimina datos del sitio anterior. No cambies el dominio, DNS, alojamiento ni registros de correo.

## 2. Sube el proyecto completo

Extrae `rivera-financial-group/` del ZIP. La raíz correcta contiene `package.json`, `package-lock.json`, `netlify.toml`, `build.mjs`, `src/`, `assets/`, `netlify/`, `tests/` y `scripts/`.

En tu repositorio Git, añade estos archivos de código. `.gitignore` excluye `dist/`, `node_modules/`, `.netlify/`, resultados de pruebas y archivos `.env` reales. `dist/` está incluido en el ZIP, pero Netlify lo genera desde las fuentes. No subas claves.

En la configuración de builds del **sitio Netlify que ya tiene riverafinancialgroup.net**, conecta el repositorio y selecciona la rama que contiene el proyecto:

| Campo | Valor |
|---|---|
| Base directory | Raíz que contiene `package.json`; vacía si está en la raíz del repositorio |
| Build command | `npm run verify` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |
| Node.js | `22` (configurado en `netlify.toml`) |

Netlify instala desde el lockfile. La compilación corre pruebas automáticamente: un fallo debe detener la publicación. El bundler `esbuild` incluye los módulos de `src/` importados por las funciones. No hay un servidor que debas mantener encendido.

## 3. Añade la clave sin editar código

1. Crea una clave en tu cuenta de Groq: https://console.groq.com/keys . Conserva el plan gratuito y revisa sus límites.
2. En Netlify, abre el sitio correcto → **Project configuration → Environment variables → Add a variable**.
3. Nombre exacto: **`GROQ_API_KEY`**. Valor: tu clave. Márcala como secreta si la interfaz ofrece esa opción.
4. Alcance: **Functions**. Si tu plan solo permite todos los alcances, selecciona esa opción; el código de compilación no lee ni expone la clave.
5. Contexto: **Production**. Si necesitas probar un deploy preview, añade explícitamente ese contexto y considera quién puede usar esa cuota.
6. Opcionales: `GROQ_MODEL=openai/gpt-oss-120b` y `NIKLAUS_ENABLED=true`. Ambos ya tienen valores predeterminados; no son necesarios para activar el chat. `NIKLAUS_ENABLED=false` deja disponible la guía local.
7. Guarda y crea **un nuevo despliegue completo**. Cambiar una variable no modifica mágicamente una función ya desplegada.

No pegues la clave en el chat, `.env.example`, archivos públicos, capturas o el repositorio. Revisa los controles de datos de Groq y las condiciones reales de tu cuenta antes de usar mensajes de visitantes.

## 4. Verifica funciones y conexión

En el log del despliegue deben aparecer `chat` y `niklaus-status`. Comprueba:

```sh
node scripts/doctor.mjs --url=https://riverafinancialgroup.net
node scripts/doctor.mjs --url=https://riverafinancialgroup.net --ai
```

El primero comprueba páginas y configuración. El segundo hace una consulta real, exige texto y un evento final `done`, y falla ante un error. Consume cuota y no imprime conversaciones.

- Sin clave: `/api/niklaus-status` devuelve `mode: "guide"`, `configured: false`, `connection: "unchecked"`, `reason: "not_configured"`.
- Con clave: devuelve `mode: "configured"`, `configured: true`, `connection: "unchecked"`, `reason: null`. **No significa conexión comprobada.**
- Solo una respuesta real del proveedor permite a la interfaz indicar que recibió respuesta de Groq. Esa comprobación corresponde a esa solicitud, no garantiza disponibilidad futura.

Si falla, revisa el código de error y el identificador de solicitud en los logs de Functions. Consulta `docs/GROQ.md`. Una cuota agotada no se resuelve subiendo una clave al navegador.

Prueba español e inglés, cálculo 300/1000 = 30%, comparación de servicios, fuentes, detener/reiniciar y contacto humano. Usa datos ficticios. Los 50 casos de `CASOS-DE-EVALUACION.md` son una lista pendiente, no respuestas ya aprobadas del modelo.

## Alternativa con CLI oficial

Instala la CLI oficial y, desde la raíz del proyecto:

```sh
npm install --global netlify-cli
netlify login
netlify link
netlify deploy
```

Vincula el **sitio existente** y revisa el deploy de prueba. La CLI actual compila por defecto y usa `netlify.toml`, incluidas las verificaciones y el empaquetado de funciones. Para publicar en producción cuando tú lo decidas:

```sh
npm run deploy
```

Este script ejecuta `npm run verify` y después `netlify deploy --prod`. No cambies a `--no-build` ni publiques solo archivos estáticos. No ejecutamos login, vinculación ni publicación en tu cuenta durante esta entrega.

**Netlify Drop con solo `dist/` publica HTML y activos; no instala las funciones de Niklaus.** Usa Git conectado a Netlify o la CLI con el proyecto completo.

## Presupuesto y comprobaciones finales

No actives planes pagos ni recargas automáticas si el presupuesto adicional es $0. Las cuotas gratuitas de Groq y Netlify son finitas y pueden cambiar. El dominio y servicios ya contratados conservan sus costos. El rate limit del chat es una protección parcial, no un presupuesto global garantizado.

Verifica en tu cuenta que el rate limiting declarado esté aplicado y sea compatible con tu plan. Revisa cuotas, logs y duración máxima de Functions. Comprueba el sitio en Safari/iPhone y Android reales, el teclado virtual y la recepción efectiva de WhatsApp/SMS/llamadas/correo. Conserva las obligaciones contractuales y legales de la operación: los avisos web no las sustituyen.

## Reseñas de clientes

Activa la detección de formularios Netlify y redespliega. Confirma `client-reviews-es` y `client-reviews-en` en Forms; realiza una prueba identificada y elimínala. La recepción real no fue probada desde este entorno. Consulta [RESENAS.md](RESENAS.md) para moderar y publicar sin exponer correos.
