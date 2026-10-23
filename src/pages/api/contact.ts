export const prerender = false;

import nodemailer from "nodemailer";
import type { APIRoute } from "astro";

const transporter = nodemailer.createTransport({
  host: "mail.oqumail.com", // Servidor SMTP de OquMail (envío)
  port: 587,
  secure: false, // STARTTLS en el puerto 587 (no SSL directo)
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER ?? import.meta.env.SMTP_USER,
    pass: process.env.SMTP_PASS ?? import.meta.env.SMTP_PASS,
  },
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { nombre, correo, telefono, curso, notas, fromUrl } = data;

    if (!nombre || !correo) {
      return new Response(JSON.stringify({ error: "Faltan campos obligatorios" }), { status: 400 });
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Lead - Professional Academy</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px; color: #1e293b; line-height: 1.5;">
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <tr>
          <td style="background-color: #060a0a; text-align: center; padding: 40px 20px; border-bottom: 4px solid #0d9488;">
            <img src="https://www.proacademymx.com/email-logo.png" alt="Professional Academy" width="180" height="46" style="display: block; margin: 0 auto; width: 180px; height: auto; max-width: 100%;" />
            <h1 style="color: #ffffff; margin: 24px 0 0 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">¡Nuevo contacto generado!</h1>
            <p style="color: #5eead4; margin: 8px 0 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px;">Sitio Web Oficial</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 45px 40px;">
            <p style="margin: 0 0 24px 0; font-size: 16px; color: #334155;">Hola equipo,</p>
            <p style="margin: 0 0 32px 0; font-size: 16px; color: #334155;">Un nuevo prospecto acaba de dejar sus datos en el sitio web interesado en iniciar su preparación con nosotros. Aquí están los detalles para que podamos contactarlo a la brevedad:</p>
            
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0d9488; margin-bottom: 32px;">
              <tr>
                <td style="padding: 24px;">
                  
                  <div style="margin-bottom: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Estudiante</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">${nombre}</p>
                  </div>

                  <div style="margin-bottom: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Curso de interés</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0d9488;">${curso}</p>
                  </div>

                  <div style="margin-bottom: ${telefono ? '20px' : '0'};">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Correo electrónico</p>
                    <p style="margin: 0; font-size: 15px;"><a href="mailto:${correo}" style="color: #0369a1; text-decoration: none; font-weight: 500;">${correo}</a></p>
                  </div>

                  ${telefono ? `
                  <div style="margin-bottom: ${notas ? '20px' : '0'};">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Teléfono celular</p>
                    <p style="margin: 0; font-size: 15px;"><a href="tel:${telefono}" style="color: #0369a1; text-decoration: none; font-weight: 500;">${telefono}</a></p>
                  </div>
                  ` : ''}

                  ${notas ? `
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Mensaje / Objetivo</p>
                    <p style="margin: 0; font-size: 15px; font-style: italic; color: #475569; line-height: 1.6;">"${notas}"</p>
                  </div>
                  ` : ''}
                  
                </td>
              </tr>
            </table>

            ${telefono ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <a href="https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola ' + nombre + '! Te escribimos de Professional Academy, vimos que te interesa prepararte para el curso de ' + curso + '.')}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; text-transform: uppercase;">Abrir chat en WhatsApp</a>
                </td>
              </tr>
            </table>
            ` : ''}
            
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">Este mensaje es confidencial y ha sido generado a través de tu plataforma web.</p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8;"><a href="${fromUrl || "https://www.proacademymx.com"}" style="color: #0d9488; text-decoration: none;">Ver página de origen</a> • Professional Academy</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: '"Professional Academy Web" <contacto@proacademymx.com>',
      to: "contacto@proacademymx.com",
      subject: `Nuevo prospecto: ${nombre} (${curso})`,
      html: htmlContent,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error enviando correo:", error);
    return new Response(JSON.stringify({ error: error.message || "Error al enviar correo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
