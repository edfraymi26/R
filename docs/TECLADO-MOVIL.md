# Campo de escritura y teclado móvil — v3.3.2

Las capturas del propietario muestran un fallo en Safari/iPhone: el teclado tapa el compositor y obliga a desplazar la ventana para ver el texto.

La ventana utilizaba `100dvh`. En iOS, el teclado puede reducir el viewport visual sin reducir esa medida de diseño. Ahora `assets/chat-viewport.mjs` sigue `visualViewport.height` y `offsetTop`, tanto al redimensionar como al desplazarse el viewport. El historial es el área flexible con scroll; el encabezado y el compositor no se comprimen. En pantallas pequeñas con teclado, el campo multilínea tiene una altura máxima adaptada al espacio disponible.

En la página completa de Niklaus, el chat ocupa temporalmente el espacio visible mientras el foco esté dentro y el teclado reduzca la altura. Recupera su disposición normal al cerrarlo. Se ocultan las acciones móviles inferiores durante ese estado para evitar superposición. Con menos de 320 px visibles se ocultan temporalmente el aviso de privacidad ya mostrado y el pie secundario para conservar espacio para escribir; vuelven al cerrar el teclado. No se fuerza esta disposición al ampliar con los dedos ni en escritorio sin pantalla táctil. Los navegadores sin Visual Viewport conservan el diseño de respaldo.

La regresión de navegador simula una pantalla de 390 × 844 con un viewport visible de 390 px y desplazamiento superior de 65 px. Comprueba ventana y página completa, posición del campo y botón de envío, historial desplazable, entrada multilínea, orientación horizontal con 250 px de altura visible, cierre del teclado y zoom. Las capturas se identifican como simuladas.

**Límite:** Chromium con viewport simulado no reproduce el teclado real ni todos los comportamientos de Safari. Falta comprobar la versión desplegada en el iPhone del propietario: abrir Niklaus, tocar el campo, escribir varias líneas, cerrar/reabrir teclado y girar el teléfono. No se ha publicado esta corrección desde el entorno.
