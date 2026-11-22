# מדיניות פרטיות — מוסיף למשנת (Privacy Policy — Mosif LaMishnat)

**תאריך עדכון אחרון / Last Updated:** 22/11/2026  
**מפתח התוסף / Developer:** לב טוב דיגיטל (Lev Tov Digital) — `a5400300801@gmail.com`

---

## עברית

התוסף **"מוסיף למשנת"** מכבד את פרטיות המשתמשים ופועל בשקיפות מלאה. להלן פירוט המידע שבו התוסף משתמש, היכן הוא נשמר וכיצד הוא מאובטח:

### 1. מידע שנשמר מקומית בדפדפן בלבד (אינו נשלח לשרתים שלנו)
* היסטוריית הזמנות, מוצרים קבועים, הגדרות צבעים, תקציב שבועי והעדפות התראות נשמרים **אך ורק בדפדפן שלך** (`localStorage` ו-`chrome.storage`).
* התוסף אינו אוסף ואינו שומר סיסמאות, פרטי כרטיס אשראי או נתוני התחברות של חשבון משנת יוסף.

### 2. מידע שנשלח ביוזמת המשתמש בלבד (אופציונלי)
התוסף שולח מידע לשרת שלנו (`Cloudflare Workers + D1`) **רק כאשר המשתמש בוחר באופן אקטיבי** להשתמש באחת משתי התכונות הבאות:
1. **הערות קהילה על מוצרים (צ'אט מוצר):**
   * תוכן ההערה, כינוי תצוגה לבחירתך (ברירת מחדל: "קונה אנונימי"), מזהה המוצר, והצבעות ("מועיל" / "ספאם" / "דיווח על משתמש").
   * לצורך מניעת ספאם (מגבלת קצב וחסימה אוטומטית לאחר 10 דיווחים), נשמר מזהה גיבוב חד-כיווני (SHA-256 Hash) אנונימי בלבד — ללא שמירת כתובת IP גלויה.
2. **טופס "פנייה למפתח התוסף":**
   * נושא הפנייה, תוכן ההודעה, גרסת התוסף, וכן שם וכתובת אימייל לחזרה **רק אם בחרת להזין אותם**.
   * פניות אלו נשמרות לצורך טיפול ותמיכה בלבד ונשלחות לתיבת המייל של מפתח התוסף.

### 3. שימוש במידע ושיתוף עם צדדים שלישיים
* איננו מוכרים, משכירים או משתפים מידע אישי עם צדדים שלישיים, מפרסמים או סוכנויות מידע.
* המידע אינו משמש לפרסום ממוקד, פרופיילינג או כל מטרה שאינה קשורה ישירות לפעולת התוסף.

### 4. יצירת קשר ומחיקת מידע
ניתן למחוק הערות שפרסמת ישירות מתוך חלון הצ'אט, או לבקש מחיקה מלאה של כל פנייה/מידע בפנייה למייל: `a5400300801@gmail.com`.

---

## English (For Chrome Web Store Review)

**"Mosif LaMishnat" (מוסיף למשנת)** is committed to protecting user privacy.

### 1. Local-Only Data (Never Transmitted to Developer Servers)
* Order history, recurring-item highlights, budget targets, display preferences, and notification settings are stored **strictly locally** in the user's browser (`localStorage` and `chrome.storage`).
* The extension never collects, stores, or transmits Mishnat Yosef passwords, payment methods, or authentication credentials to developer servers.

### 2. Strictly Opt-In, User-Initiated Data
Data is transmitted to our Cloudflare Workers + D1 backend (`mishnat-yosef-comments.lev-tov-digital.workers.dev`) **only when a user actively chooses** to use one of the following optional features:
1. **Community Product Comments:** Comment text, an optional user-chosen display nickname (default: anonymous), product ID, and helpful/spam/abuse votes. A one-way cryptographic hash (SHA-256) of a random client ID and IP is used solely for anti-spam rate limiting and automated abuse blocking; raw IP addresses are not stored.
2. **"Contact Developer" Support Form:** Message category, message body, extension version, and optional name / reply-to email address if voluntarily provided by the user. Support messages are stored in our database and forwarded to the developer's email solely to respond to user inquiries.

### 3. Data Sharing & Limited Use Compliance
* We **do not** sell, rent, or transfer user data to third parties.
* We **do not** use user data for advertising, analytics tracking, or any purpose unrelated to the extension's single purpose.
* The use of information received adheres strictly to the Chrome Web Store User Data Policy, including the Limited Use requirements.

### 4. Contact & Data Deletion
Users can delete their own comments directly in the product chat widget, or request deletion of any submitted support message by emailing `a5400300801@gmail.com`.
