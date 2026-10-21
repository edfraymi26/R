# Documento histórico de la versión anterior

Este informe venía dentro del ZIP de base. No es una auditoría nueva ni describe la marca v3; sus afirmaciones históricas no se revalidaron durante esta entrega. El resultado actual está en VERIFICACION.md.

# Auditoría de la entrega anterior

Archivo de entrada: deploy-6aa23482b9c9605f134ee72a.zip.

La entrega incluía HTML público, portal de clientes, administrador, estilos superpuestos, módulos de cotización, blog, avisos legales, recursos de marca y migraciones SQL. No incluía las funciones servidor que resolvían las rutas `/api/` ni credenciales.

Hallazgos que determinaron esta versión:

- El chat anterior ya leía respuestas progresivas con `ReadableStream`; no era necesario simular letras para aparentar streaming.
- El chat dependía de `/api/chat`, cuyo código servidor no estaba en el ZIP. Esta entrega incluye un nuevo servidor propio.
- El historial público anterior utilizaba localStorage y una ventana de dos horas. La nueva versión usa memoria de pestaña, sin persistencia propia de conversaciones.
- Las migraciones describían usuarios, empresas, documentos, mensajes y conversaciones; no incluían datos reales ni demostraban que las funciones estuvieran operativas.
- El portal podía anunciar memoria eliminada aunque la petición fallara. Se sustituyó por reinicio de la conversación local, describiendo su alcance real.
- El sitio anterior tenía cuentas, formularios, portal, administrador y servicios de crédito pendientes. La nueva web es informativa, con servicios confirmados por el propietario y contactos externos.
- Los importes y estimadores anteriores no se conservaron como oferta: el propietario eligió solicitar cotización.
- Se preservó el símbolo de marca y se optimizó para web. No se usa el video permanente anterior.
- Las páginas legales se reescribieron para describir el funcionamiento de esta versión, no cuentas o cargas que ya no existen.

La copia original se mantuvo separada durante la preparación. Publicar este proyecto no migra ni elimina automáticamente datos o servidores del sitio anterior; el propietario debe conservar lo necesario antes de reemplazar su despliegue.
