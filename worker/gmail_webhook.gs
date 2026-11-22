/**
 * Google Apps Script — שולח מייל מעוצב מימין לשמאל (RTL) ישירות ל-Gmail שלך
 * בכל פנייה חדשה מהתוסף "מוסיף למשנת".
 *
 * לעדכון ב-script.google.com:
 * 1. החלף את הקוד הקיים בפרויקט בקוד הזה ושמור.
 * 2. לחץ למעלה: "פריסה" (Deploy) -> "ניהול פריסות" (Manage deployments) -> עריכה (אייקון עיפרון) -> גרסה: "גרסה חדשה" -> "פריסה" (Deploy).
 *    (הכתובת נשארת בדיוק אותה כתובת — אין צורך לעדכן ב-Cloudflare!)
 */

const TARGET_EMAIL = 'a5400300801@gmail.com';

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const category = data.category || 'פנייה כללית';
    const senderName = data.senderName || 'משתמש אנונימי';
    const replyTo = data.replyTo || 'לא צוין';
    const appVersion = data.appVersion || 'לא ידוע';
    const message = data.message || '';
    const timeStr = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    const subject = `[מוסיף למשנת] ${category} מאת ${senderName}`;
    const plainBody = [
      `התקבלה פנייה חדשה מתוך התוסף "מוסיף למשנת":`,
      `סוג הפנייה: ${category}`,
      `שם השולח: ${senderName}`,
      `פרטי קשר לחזרה: ${replyTo}`,
      `גרסת התוסף: v${appVersion}`,
      `תאריך: ${timeStr}`,
      ``,
      message
    ].join('\n');

    const safeMessageHtml = escHtml(message).replace(/\n/g, '<br>');
    const hasEmailReply = replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo);

    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; background:#f1f5f9; padding:24px 14px; text-align:right; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 6px 20px rgba(15,23,42,0.06);">
          <div style="background:linear-gradient(135deg, #2e9e5b, #1e7a43); padding:20px 24px; color:#ffffff;">
            <div style="font-size:12px; opacity:0.9; margin-bottom:4px;">מוסיף למשנת · פנייה חדשה מהתוסף</div>
            <div style="font-size:20px; font-weight:700;">✉️ ${escHtml(category)}</div>
          </div>

          <div style="padding:20px 24px;">
            <table role="presentation" dir="rtl" style="width:100%; border-collapse:collapse; margin-bottom:18px; font-size:13.5px;">
              <tr>
                <td style="padding:6px 0; color:#64748b; width:125px;"><b>שם השולח:</b></td>
                <td style="padding:6px 0; color:#0f172a; font-weight:600;">${escHtml(senderName)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;"><b>יצירת קשר:</b></td>
                <td style="padding:6px 0; color:#0f172a;">
                  ${hasEmailReply
                    ? `<a href="mailto:${escHtml(replyTo)}" style="color:#2e9e5b; text-decoration:none; font-weight:600;">${escHtml(replyTo)}</a>`
                    : escHtml(replyTo)}
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;"><b>גרסת התוסף:</b></td>
                <td style="padding:6px 0; color:#0f172a;">v${escHtml(appVersion)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;"><b>תאריך ושעה:</b></td>
                <td style="padding:6px 0; color:#0f172a;">${escHtml(timeStr)}</td>
              </tr>
            </table>

            <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:8px;">תוכן הפנייה:</div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-right:4px solid #2e9e5b; border-radius:10px; padding:14px 16px; font-size:14.5px; line-height:1.7; color:#0f172a;">
              ${safeMessageHtml}
            </div>

            ${hasEmailReply ? `
              <div style="margin-top:18px; text-align:center;">
                <a href="mailto:${escHtml(replyTo)}?subject=${encodeURIComponent('Re: ' + subject)}"
                   style="display:inline-block; background:#2e9e5b; color:#ffffff; text-decoration:none; padding:10px 22px; border-radius:10px; font-size:13.5px; font-weight:700;">
                  ↩️ השב לשולח במייל
                </a>
              </div>
            ` : ''}
          </div>

          <div style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:12px 24px; font-size:11.5px; color:#94a3b8; text-align:center;">
            נשלח אוטומטית ממערכת הפניות של "מוסיף למשנת" (גיבוי נשמר גם ב-Cloudflare D1)
          </div>
        </div>
      </div>
    `;

    const mailOpts = { htmlBody: htmlBody };
    if (hasEmailReply) {
      mailOpts.replyTo = replyTo;
    }

    MailApp.sendEmail(TARGET_EMAIL, subject, plainBody, mailOpts);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
