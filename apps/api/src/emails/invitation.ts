export function invitationEmailHtml({
  inviterName,
  organizationName,
  role,
  acceptUrl,
}: {
  inviterName: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:22px;color:#18181b">
            Rejoignez ${organizationName}
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6">
            <strong>${inviterName}</strong> vous invite à rejoindre
            <strong>${organizationName}</strong> en tant que <strong>${role}</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td align="center" style="background:#18181b;border-radius:6px;padding:12px 32px">
              <a href="${acceptUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600">
                Accepter l'invitation
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5">
            Ou copiez ce lien&nbsp;: <a href="${acceptUrl}" style="color:#18181b;word-break:break-all">${acceptUrl}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
