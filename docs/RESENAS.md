# Reseñas reales — instalación y moderación

## Qué incluye

- `/resenas/` y `/en/resenas/`, accesibles desde la portada, navegación y pie.
- Formulario con alias público, correo privado, servicio, calificación 1–5, comentario y consentimiento obligatorio.
- Recepción privada mediante **Netlify Forms**, con honeypot y filtros de la plataforma; no se publica el envío automáticamente.
- Lista pública de reseñas aprobadas. Empieza vacía: no contiene testimonios, estrellas medias ni clientes inventados.
- Sin cuentas, pagos, documentos adjuntos ni nueva base de datos. Las reseñas públicas se construyen desde `src/reviews.json`.

## Activar recepción en tu sitio Netlify

1. En el sitio existente, abre **Forms** y activa **form detection** si está desactivado. El nombre o ubicación puede variar en el panel.
2. Despliega el proyecto completo, con build `npm run verify`, publicación `dist` y funciones `netlify/functions`. Este cambio conserva Niklaus y la corrección del teclado móvil.
3. Confirma que Netlify detectó **client-reviews-es** y **client-reviews-en**.
4. Envía tú una prueba identificada como prueba desde cada idioma. Comprueba que aparece en Forms y que el navegador muestra la página de agradecimiento. Borra esas pruebas; no las publiques como reseñas.
5. Si quieres avisos, configura las notificaciones de Forms en Netlify hacia el correo del negocio. No se configuraron ni enviaron notificaciones desde este trabajo.

**No se ha comprobado recepción real:** estos formularios todavía no están desplegados. Las pruebas automatizadas interceptan el POST y simulan la respuesta de Netlify; no envían reseñas ficticias a tu panel. El servidor local devuelve 405 al enviar formularios porque no emula Netlify Forms.

No se añadió una suscripción de pago. Forms depende del plan, créditos, límites y política anti-spam de tu cuenta Netlify. Antes de activarlo, revisa esas condiciones y desactiva recargas automáticas si no quieres cargos. No se promete recepción ilimitada ni se verificó tu panel de facturación. Si la recepción queda deshabilitada, no des por recibido un envío solo por ver el formulario: compruébalo en Forms.

## Revisar con criterios consistentes

- Comprueba que el autor recibió el servicio, usando el correo privado o los registros que ya tienes. No solicites SSN ni documentos a través del formulario.
- Confirma consentimiento, servicio, fecha y texto. No publiques el correo ni el registro completo de Netlify.
- Trata igual las calificaciones bajas y altas. No rechaces una opinión por ser negativa, ni la reescribas para hacerla favorable. No pagues ni ofrezcas descuentos por reseñas.
- Excluye spam, suplantación, amenazas y datos privados. Si el autor debe corregir el texto, solicita una versión nueva autorizada; no alteres silenciosamente su significado.
- Los visitantes ven la reseña en su idioma original. No se crean traducciones atribuidas al cliente ni se añade una insignia de verificación externa.
- Atiende las solicitudes de corrección o retirada. El borrado de la reseña pública y el de la solicitud privada en Netlify son acciones separadas; no hay eliminación automática. Conserva la autorización solo durante el tiempo necesario para gestionar la publicación y las obligaciones aplicables.

## Publicar sin editar el código

En una terminal dentro del proyecto:

```sh
npm run reviews -- --new
npm run verify
```

El asistente pregunta nombre público, servicio, calificación, comentario exacto, fecha, idioma y confirmación de experiencia/consentimiento. Copia únicamente la información que el cliente autorizó. Después despliega el proyecto completo en el sitio Netlify existente. La reseña aparecerá tras ese despliegue; no al terminar de rellenar el formulario.

IDs de servicio: `formation`, `sam`, `business-credit`, `personal-build`, `personal-repair`, `ein`, `good-standing`, `agent`, `maintenance`, `google`, `other`. Usa el ID que muestre la solicitud; el programa rechaza servicios desconocidos.

El modo avanzado acepta un JSON privado con las claves exactas `id`, `name`, `service`, `rating`, `text`, `date`, `language`, `consent` y `confirmed`:

```sh
npm run reviews -- --add /ruta/privada/resena-aprobada.json
```

Nunca introduzcas exportaciones completas de Forms en `src`, `assets`, `dist` o el ZIP. El validador rechaza campos adicionales como email y algunos patrones sensibles; no sustituye la revisión humana.

## Retirar o corregir

Busca el identificador en `src/reviews.json` y ejecuta:

```sh
npm run reviews -- --remove review-identificador
npm run verify
```

Despliega nuevamente para retirar la reseña pública. Para corregirla, retira la anterior y añade el texto que autorice el cliente. Gestiona por separado los datos privados en Netlify Forms.
