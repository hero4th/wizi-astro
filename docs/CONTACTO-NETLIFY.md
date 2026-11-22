# Formulario de contacto en Netlify

El formulario de `/contacto` envía un `POST` a `/api/contact`. Esa ruta es la
única parte del sitio que **no** es estática: se ejecuta como función de Netlify
porque necesita credenciales SMTP privadas. Por eso el sitio puede seguir siendo
estático sin perder los correos.

## Síntoma

El formulario mostraba “mensaje enviado” pero no llegaba nada a
`contacto@proacademymx.com`. La respuesta real de producción era:

```
500 {"error":"Missing credentials for \"PLAIN\""}
```

Eso significa que la función se ejecutó, pero el entorno de Netlify no tenía
`SMTP_PASS` (la contraseña del buzón de OquMail). Sin contraseña, `nodemailer`
no puede autenticarse.

## Configuración necesaria (una sola vez)

En <https://app.netlify.com/projects/proacademymx>:

1. **Site configuration → Environment variables → Add a variable**.
2. Crear estas dos variables:

   | Variable | Valor | Scope |
   | --- | --- | --- |
   | `SMTP_USER` | `contacto@proacademymx.com` | Functions (o All) |
   | `SMTP_PASS` | contraseña del buzón en OquMail | Functions (o All) |

   El scope debe incluir **Functions**. Si se guarda solo como “Builds”, el
   valor se usa al compilar pero no llega a la función en tiempo de ejecución.
3. Opcional: `CONTACT_TO` permite cambiar el destinatario sin tocar código. Si
   no existe, se usa `contacto@proacademymx.com`.
4. **Deploys → Trigger deploy → Deploy site** (no hace falta limpiar caché,
   pero sí un deploy nuevo para que la función lea las variables).

> Si no se conoce la contraseña, se restablece desde el webmail de OquMail y se
> guarda el nuevo valor en Netlify. No se debe escribir la contraseña en el
> repositorio.

## Cómo verificar

Con el deploy terminado:

```bash
curl -X POST https://proacademymx.com/api/contact \
  -H 'Content-Type: application/json' \
  --data '{"nombre":"Prueba","correo":"test@example.com","curso":"TOEFL"}'
```

| Respuesta | Significado |
| --- | --- |
| `200 {"success":true}` | Correcto: revisar la bandeja de `contacto@proacademymx.com`. |
| `503` | Faltan `SMTP_USER`/`SMTP_PASS` en el entorno de Functions. |
| `500` | Las credenciales llegaron pero el SMTP las rechazó (contraseña vencida, por ejemplo). Revisar **Logs → Functions**. |
| `400` | La ruta funciona; faltan `nombre` o `correo` en la petición. |

## Comportamiento del formulario

- Solo muestra “¡Mensaje enviado!” cuando la API responde `2xx`.
- Si falla, muestra un error y abre WhatsApp con los datos ya escritos, para no
  perder al prospecto.
- Nunca muestra el error técnico de SMTP al visitante; el detalle queda en los
  logs de la función.

## Rama de despliegue

El sitio `proacademymx` está conectado a
`luishdzl/proacademytest`, rama **main**. Un push a `master` no publica nada.
Después de cambiar este código hay que actualizar `main` (fast-forward desde
`master`) o hacer merge y esperar el deploy automático.
