/**
 * Google Apps Script — שולח מייל ישירות ל-Gmail שלך בכל פנייה חדשה מהתוסף "מוסיף למשנת".
 *
 * הוראות התקנה (30 שניות):
 * 1. היכנס ל-https://script.google.com (עם החשבון a5400300801@gmail.com) -> "פרויקט חדש".
 * 2. הדבק את הקוד הזה במקום מה שמופיע שם ושמור.
 * 3. לחץ למעלה משמאל/ימין: "פריסה" (Deploy) -> "פריסה חדשה" (New deployment) -> "אפליקציית אינטרנט" (Web app):
 *    - הפעלה כ: אני (Me)
 *    - למי יש גישה: כולם (Anyone)
 * 4. העתק את כתובת ה-Web App (`https://script.google.com/macros/s/.../exec`) ותן לי אותה כדי שאחבר אותה ל-Cloudflare Worker.
 */

const TARGET_EMAIL = 'a5400300801@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const category = data.category || 'פנייה כללית';
    const senderName = data.senderName || 'משתמש אנונימי';
    const replyTo = data.replyTo || 'לא צוין';
    const appVersion = data.appVersion || 'לא ידוע';
    const message = data.message || '';

    const subject = `[מוסיף למשנת] ${category} מאת ${senderName}`;
    const body = [
      `התקבלה פנייה חדשה מתוך התוסף "מוסיף למשנת":`,
      ``,
      `סוג הפנייה: ${category}`,
      `שם השולח: ${senderName}`,
      `פרטי יצירת קשר לחזרה: ${replyTo}`,
      `גרסת התוסף: v${appVersion}`,
      `תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`,
      ``,
      `תוכן הפנייה:`,
      `----------------------------------------`,
      message,
      `----------------------------------------`
    ].join('\n');

    const mailOpts = {};
    if (replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      mailOpts.replyTo = replyTo;
    }

    MailApp.sendEmail(TARGET_EMAIL, subject, body, mailOpts);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
