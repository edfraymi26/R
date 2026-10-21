# Rivera Financial Group LLC · v3.4

Web informativa en español e inglés para **riverafinancialgroup.net**, preparada para el sitio Netlify del propietario. Eduardo Rivera, CEO · +1 267-666-2239 · riverafinancialgroup0@gmail.com.

## Desarrollo local

Node.js **22 o superior**. No hay dependencias de ejecución de la web ni de sus funciones; los paquetes de desarrollo se usan para comprobar el navegador.

```sh
npm ci
npm run verify
npm run dev
```

`verify` compila 42 páginas, dos páginas de agradecimiento y el 404, ejecuta pruebas y valida rutas, SEO, activos y sintaxis. `dev` sirve las páginas y adapta las dos funciones originales a HTTP local (puerto 4173). No reproduce el rate limiting de Netlify. Detén el servidor con Ctrl+C. Para otro puerto: `PORT=4174 npm run dev`.

Pruebas de navegador, en otra terminal:

```sh
npx playwright install chromium
npm run test:browser
```

Si ya tienes Chromium, usa `CHROMIUM_EXECUTABLE_PATH=/ruta/a/chromium npm run test:browser`. `TEST_BASE_URL` permite otro puerto. Los resultados y capturas se guardan en `artifacts/` y no entran en Git. Las respuestas del proveedor en esta suite son simuladas.

## Publicación y clave

Lee **[docs/LANZAMIENTO.md](docs/LANZAMIENTO.md)**. Conecta el código completo al **sitio Netlify existente**. `netlify.toml` ejecuta `npm run verify` antes de publicar y empaqueta `netlify/functions/` junto con `dist/`.

Añade **GROQ_API_KEY** en las variables de entorno de Netlify, con alcance **Functions** y contexto **Production**, y vuelve a desplegar. No hace falta editar código. Nunca copies la clave a `assets/`, `dist/`, Git o el ZIP. La clave no se necesita durante la compilación.

**Arrastrar únicamente `dist/` a Netlify Drop no instala el servidor de Niklaus.**

Sin clave se ofrece una guía local identificada. El estado `configured` solo acredita presencia de configuración; una respuesta real completa acredita conexión en ese momento. El comando posterior al despliegue es:

```sh
node scripts/doctor.mjs --url=https://riverafinancialgroup.net
node scripts/doctor.mjs --url=https://riverafinancialgroup.net --ai
```

La segunda comprobación hace una consulta real y consume cuota. No evalúa por sí sola la exactitud de las respuestas.

## Entrega

- 21 páginas por idioma, más agradecimiento de reseñas, 404 bilingüe, SEO, sitemap, robots y redirecciones.
- Temas Claro/Oscuro con preferencia persistente y adaptación al sistema por defecto.
- Balanza realista basada en la referencia: documentos/certificado a la izquierda, casa/maletín a la derecha. Sin letras dentro del símbolo. Acabado metálico cálido moderado, base fija y oscilación continua con pausa/reanudación; marca pequeña estática y movimiento reducido respetado.
- Niklaus: streaming, contexto de la pestaña, herramientas, fuentes permitidas, guía local y contacto humano. Sin pagos, cuentas ni carga de documentos.
- [Informe de pruebas](docs/VERIFICACION.md), [modelo y límites](docs/GROQ.md), [arquitectura](docs/ARQUITECTURA.md) y [casos pendientes con IA real](docs/CASOS-DE-EVALUACION.md).

`src/data.mjs` es el catálogo común de la web y Niklaus. Edita fuentes; `dist/` se regenera y está excluido de Git. El ZIP incluye `dist/` por comodidad. No se realizó publicación ni cambio de dominio como parte de esta entrega.

## English quick start

Use Node.js 22+, then `npm ci`, `npm run verify` and `npm run dev`. Deploy the **complete project** to the existing Netlify site. Set `GROQ_API_KEY` in Netlify's **Functions / Production** environment and deploy again. Static-only Netlify Drop does **not** install the assistant server. A configured key does not prove connectivity: run `scripts/doctor.mjs --url=https://riverafinancialgroup.net --ai` after deployment. Free-tier quotas are finite; live model evaluation remains pending. The website itself is fully bilingual.

Auditoría pública del 21/10/2026 y corrección posterior: [informe](docs/AUDITORIA-PUBLICA-2026-10-21.md). La versión pública probada fue 3.3.0; 3.3.1 está preparada para redesplegar.

Corrección de teclado móvil v3.3.2: [comportamiento y límites de las pruebas](docs/TECLADO-MOVIL.md). Requiere desplegar esta versión para aplicarse en el sitio público.

Reseñas reales: activa Netlify Forms y sigue [la guía de moderación](docs/RESENAS.md). No se publican automáticamente; el correo permanece privado. La recepción real debe comprobarse después del despliegue.
