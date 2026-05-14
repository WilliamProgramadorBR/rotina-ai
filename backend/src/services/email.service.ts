import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER e GMAIL_APP_PASSWORD não configurados no .env.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    tls: { rejectUnauthorized: false },
    auth: { user, pass }
  });
}

export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  const transporter = getTransporter();
  const from = `"Rotina AI" <${process.env.GMAIL_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject: `${code} — Código para redefinir sua senha`,
    html: buildResetEmailHtml(name, code),
    text: `Olá, ${name}!\n\nSeu código para redefinir a senha é: ${code}\n\nEle expira em 15 minutos.\n\nSe não foi você, ignore este e-mail.`
  });
}

function buildResetEmailHtml(name: string, code: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir senha — Rotina AI</title>
</head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;border:1px solid #E2E8F0;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1D4ED8,#7C3AED);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">🧠</div>
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Rotina AI</span>
              </div>
              <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:14px;">Redefinição de senha</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#64748B;">Olá, <strong style="color:#111827;">${escapeHtml(name)}</strong>!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748B;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Use o código abaixo no app para continuar.
              </p>

              <!-- Code Box -->
              <div style="background:#F1F5F9;border:2px dashed #CBD5E1;border-radius:16px;padding:28px 16px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94A3B8;letter-spacing:2px;text-transform:uppercase;">Seu código</p>
                <span style="font-size:44px;font-weight:800;letter-spacing:12px;color:#1D4ED8;font-family:'Courier New',monospace;">${code}</span>
                <p style="margin:12px 0 0;font-size:12px;color:#94A3B8;">⏱ Válido por <strong>15 minutos</strong></p>
              </div>

              <p style="margin:0 0 24px;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
                Se você não solicitou a redefinição, ignore este e-mail.
                Sua senha permanece a mesma.
              </p>

              <!-- Security Note -->
              <div style="background:#ECFDF5;border:1px solid #BBF7D0;border-radius:12px;padding:14px 16px;display:flex;gap:10px;align-items:flex-start;">
                <span style="font-size:16px;flex-shrink:0;">🔒</span>
                <p style="margin:0;font-size:12px;color:#065F46;line-height:1.5;">
                  <strong>Dica de segurança:</strong> nunca compartilhe este código com ninguém.
                  A equipe Rotina AI jamais pedirá seu código.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                © ${new Date().getFullYear()} Rotina AI · Você está recebendo este e-mail porque solicitou a redefinição de senha.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
