/**
 * worker/src/index.js
 * Cloudflare Worker + D1 API לפורום הערות המוצרים של "מוסיף למשנת".
 * - מגבלת קצב: עד 5 הערות ב-10 דקות למשתמש/IP
 * - כפתור "👍 מועיל" (לייק אחד למשתמש להערה)
 * - כפתור "ספאם" (הסתרה אוטומטית ב-3 דיווחים ייחודיים)
 * - מערכת דיווחים על משתמשים: חסימה אוטומטית מכתיבת הערות ב-10 דיווחים ייחודיים
 * - סינון קוד/XSS/קישורים ומילים לא נקיות
 * - Cache בקצה (Edge) ל-GET /api/counts לאפס עומס על האתר ועל מסד הנתונים
 */

import { sanitizeText, detectCodeOrLink, validateCommentPayload } from './moderation.js';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 דקות
const CONTACT_RATE_MAX = 3;
const CONTACT_RATE_WINDOW_MS = 60 * 60 * 1000; // שעה
const SPAM_HIDE_THRESHOLD = 3;
const USER_BAN_THRESHOLD = 10;

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = /^https:\/\/([a-z0-9-]+\.)?mishnatyosef\.org$/i.test(origin)
    || /^chrome-extension:\/\//i.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://mishnatyosef.org',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id, X-Admin-Key',
    'Vary': 'Origin'
  };
}

function jsonResponse(request, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...getCorsHeaders(request),
      ...extraHeaders
    }
  });
}

async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getActorHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const clientId = sanitizeText(request.headers.get('X-Client-Id') || '', 64);
  const salt = env.HASH_SALT || 'myfam-comments-salt-v1';
  const actorKey = clientId ? `${clientId}|${ip}` : ip;
  return sha256Hex(`${salt}:${actorKey}`);
}

async function getIpOnlyHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const salt = env.HASH_SALT || 'myfam-comments-salt-v1';
  return sha256Hex(`${salt}:ip:${ip}`);
}

async function getClientOnlyHash(request, env) {
  const clientId = sanitizeText(request.headers.get('X-Client-Id') || '', 64);
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const salt = env.HASH_SALT || 'myfam-comments-salt-v1';
  return sha256Hex(`${salt}:client:${clientId || ip}`);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. GET /api/counts — בקשה יחידה קלילה לספירת ההערות בכל המוצרים (עם Edge Cache של 60 שניות)
      if (request.method === 'GET' && path === '/api/counts') {
        const { results } = await env.DB.prepare(
          'SELECT pid, COUNT(*) AS cnt FROM comments WHERE hidden = 0 GROUP BY pid'
        ).all();
        const counts = {};
        for (const row of (results || [])) {
          counts[row.pid] = Number(row.cnt) || 0;
        }
        return jsonResponse(request, { counts }, 200, {
          'Cache-Control': 'public, max-age=60, s-maxage=60'
        });
      }

      // 2. GET /api/comments?pid=p123 — שליפת הערות למוצר ספציפי (נטען רק בלחיצה!)
      if (request.method === 'GET' && path === '/api/comments') {
        const pid = sanitizeText(url.searchParams.get('pid') || '', 40);
        if (!pid || !/^[a-z0-9_-]{2,40}$/i.test(pid)) {
          return jsonResponse(request, { error: 'מזהה מוצר לא תקין' }, 400);
        }

        const voterHash = await getClientOnlyHash(request, env);
        const { results } = await env.DB.prepare(
          `SELECT c.id, c.pid, c.author, c.body, c.sale_week, c.likes, c.created_at,
                  (c.author_hash = ?) AS is_mine,
                  EXISTS(SELECT 1 FROM votes v WHERE v.comment_id = c.id AND v.voter_hash = ? AND v.vote_type = 'like') AS liked_by_me,
                  EXISTS(SELECT 1 FROM votes v WHERE v.comment_id = c.id AND v.voter_hash = ? AND v.vote_type = 'spam') AS spammed_by_me,
                  EXISTS(SELECT 1 FROM user_reports ur WHERE ur.target_hash = c.author_hash AND ur.reporter_hash = ?) AS user_reported_by_me
           FROM comments c
           WHERE c.pid = ? AND c.hidden = 0
           ORDER BY c.likes DESC, c.created_at DESC
           LIMIT 50`
        ).bind(voterHash, voterHash, voterHash, voterHash, pid).all();

        const comments = (results || []).map(r => ({
          id: r.id,
          pid: r.pid,
          author: r.author,
          body: r.body,
          saleWeek: r.sale_week || '',
          likes: Number(r.likes) || 0,
          createdAt: Number(r.created_at) || 0,
          isMine: Boolean(r.is_mine),
          likedByMe: Boolean(r.liked_by_me),
          spammedByMe: Boolean(r.spammed_by_me),
          userReportedByMe: Boolean(r.user_reported_by_me)
        }));

        return jsonResponse(request, { pid, comments }, 200, {
          'Cache-Control': 'no-store'
        });
      }

      // 3. POST /api/comments — הוספת הערה חדשה (בדיקת חסימת משתמש + עד 5 הערות ב-10 דקות + סינון מלא)
      if (request.method === 'POST' && path === '/api/comments') {
        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse(request, { error: 'בקשה לא תקינה' }, 400);
        }

        const authorHash = await getClientOnlyHash(request, env);
        const ipHash = await getIpOnlyHash(request, env);

        // בדיקה האם המשתמש נחסם אוטומטית (עקב 10 דיווחי משתמשים)
        const banRow = await env.DB.prepare(
          'SELECT user_hash FROM banned_users WHERE user_hash = ? OR user_hash = ? LIMIT 1'
        ).bind(authorHash, ipHash).first();
        if (banRow) {
          return jsonResponse(request, {
            error: 'נחסמת מכתיבת הערות בצ\'אטים עקב דיווחי משתמשים.'
          }, 403);
        }

        const check = validateCommentPayload(payload || {});
        if (!check.ok) {
          return jsonResponse(request, { error: check.error }, 400);
        }

        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW_MS;
        const actorHash = await getActorHash(request, env);

        // ניקוי רשומות ישנות + בדיקת מגבלת 5 הערות ב-10 דקות
        await env.DB.prepare('DELETE FROM rate_limits WHERE created_at < ?').bind(windowStart).run();
        const rlRow = await env.DB.prepare(
          'SELECT COUNT(*) AS cnt FROM rate_limits WHERE actor_hash = ? AND created_at >= ?'
        ).bind(actorHash, windowStart).first();

        if ((Number(rlRow?.cnt) || 0) >= RATE_LIMIT_MAX) {
          return jsonResponse(request, {
            error: 'הגעת למגבלה של 5 הערות ב-10 דקות. נא להמתין מספר דקות ולנסות שוב.'
          }, 429);
        }

        const productName = sanitizeText(payload?.productName || '', 80);
        const saleWeek = sanitizeText(payload?.saleWeek || '', 40);

        const insertRes = await env.DB.prepare(
          `INSERT INTO comments (pid, product_name, author, author_hash, ip_hash, body, sale_week, likes, spam_count, hidden, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`
        ).bind(check.pid, productName, check.author, authorHash, ipHash, check.body, saleWeek, now).run();

        await env.DB.prepare(
          'INSERT INTO rate_limits (actor_hash, created_at) VALUES (?, ?)'
        ).bind(actorHash, now).run();

        const newId = insertRes?.meta?.last_row_id;
        return jsonResponse(request, {
          ok: true,
          comment: {
            id: newId,
            pid: check.pid,
            author: check.author,
            body: check.body,
            saleWeek,
            likes: 0,
            createdAt: now,
            isMine: true,
            likedByMe: false,
            spammedByMe: false,
            userReportedByMe: false
          }
        }, 201);
      }

      // 4. POST /api/comments/:id/like — כפתור "👍 מועיל" (הפעלה/ביטול)
      const likeMatch = path.match(/^\/api\/comments\/(\d+)\/like$/);
      if (request.method === 'POST' && likeMatch) {
        const commentId = parseInt(likeMatch[1], 10);
        const voterHash = await getClientOnlyHash(request, env);

        const existing = await env.DB.prepare(
          "SELECT 1 FROM votes WHERE comment_id = ? AND voter_hash = ? AND vote_type = 'like'"
        ).bind(commentId, voterHash).first();

        let liked = false;
        if (existing) {
          await env.DB.prepare(
            "DELETE FROM votes WHERE comment_id = ? AND voter_hash = ? AND vote_type = 'like'"
          ).bind(commentId, voterHash).run();
          await env.DB.prepare(
            'UPDATE comments SET likes = MAX(0, likes - 1) WHERE id = ?'
          ).bind(commentId).run();
          liked = false;
        } else {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO votes (comment_id, voter_hash, vote_type, created_at) VALUES (?, ?, 'like', ?)"
          ).bind(commentId, voterHash, Date.now()).run();
          await env.DB.prepare(
            'UPDATE comments SET likes = likes + 1 WHERE id = ?'
          ).bind(commentId).run();
          liked = true;
        }

        const updated = await env.DB.prepare('SELECT likes FROM comments WHERE id = ?').bind(commentId).first();
        return jsonResponse(request, { ok: true, liked, likes: Number(updated?.likes) || 0 });
      }

      // 5. POST /api/comments/:id/spam — כפתור "ספאם" (הסתרה אוטומטית ב-3 דיווחים)
      const spamMatch = path.match(/^\/api\/comments\/(\d+)\/spam$/);
      if (request.method === 'POST' && spamMatch) {
        const commentId = parseInt(spamMatch[1], 10);
        const voterHash = await getClientOnlyHash(request, env);

        const existing = await env.DB.prepare(
          "SELECT 1 FROM votes WHERE comment_id = ? AND voter_hash = ? AND vote_type = 'spam'"
        ).bind(commentId, voterHash).first();

        if (!existing) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO votes (comment_id, voter_hash, vote_type, created_at) VALUES (?, ?, 'spam', ?)"
          ).bind(commentId, voterHash, Date.now()).run();
          await env.DB.prepare(
            'UPDATE comments SET spam_count = spam_count + 1, hidden = CASE WHEN spam_count + 1 >= ? THEN 1 ELSE hidden END WHERE id = ?'
          ).bind(SPAM_HIDE_THRESHOLD, commentId).run();
        }

        const updated = await env.DB.prepare('SELECT hidden FROM comments WHERE id = ?').bind(commentId).first();
        return jsonResponse(request, { ok: true, hidden: Boolean(updated?.hidden) });
      }

      // 6. POST /api/comments/:id/report-user — דיווח על משתמש (חסימה אוטומטית ב-10 דיווחים ייחודיים)
      const reportUserMatch = path.match(/^\/api\/comments\/(\d+)\/report-user$/);
      if (request.method === 'POST' && reportUserMatch) {
        const commentId = parseInt(reportUserMatch[1], 10);
        const reporterHash = await getClientOnlyHash(request, env);

        const targetRow = await env.DB.prepare(
          'SELECT author_hash, ip_hash FROM comments WHERE id = ?'
        ).bind(commentId).first();

        if (!targetRow || !targetRow.author_hash) {
          return jsonResponse(request, { error: 'ההערה לא נמצאה' }, 404);
        }
        if (targetRow.author_hash === reporterHash) {
          return jsonResponse(request, { error: 'לא ניתן לדווח על עצמך' }, 400);
        }

        const now = Date.now();
        await env.DB.prepare(
          'INSERT OR IGNORE INTO user_reports (target_hash, reporter_hash, created_at) VALUES (?, ?, ?)'
        ).bind(targetRow.author_hash, reporterHash, now).run();

        const cntRow = await env.DB.prepare(
          'SELECT COUNT(*) AS cnt FROM user_reports WHERE target_hash = ?'
        ).bind(targetRow.author_hash).first();
        const reportCount = Number(cntRow?.cnt) || 0;

        let banned = false;
        if (reportCount >= USER_BAN_THRESHOLD) {
          banned = true;
          await env.DB.prepare(
            'INSERT OR REPLACE INTO banned_users (user_hash, report_count, banned_at) VALUES (?, ?, ?)'
          ).bind(targetRow.author_hash, reportCount, now).run();
          if (targetRow.ip_hash) {
            await env.DB.prepare(
              'INSERT OR REPLACE INTO banned_users (user_hash, report_count, banned_at) VALUES (?, ?, ?)'
            ).bind(targetRow.ip_hash, reportCount, now).run();
          }
          // הסתרה אוטומטית של כל ההערות של המשתמש שנחסם
          await env.DB.prepare(
            'UPDATE comments SET hidden = 1 WHERE author_hash = ?'
          ).bind(targetRow.author_hash).run();
        }

        return jsonResponse(request, { ok: true, banned, reportCount });
      }

      // 7. DELETE /api/comments/:id — מחיקה ע"י כותב ההערה או מנהל (ADMIN_KEY)
      const delMatch = path.match(/^\/api\/comments\/(\d+)$/);
      if (request.method === 'DELETE' && delMatch) {
        const commentId = parseInt(delMatch[1], 10);
        const adminKey = request.headers.get('X-Admin-Key') || '';
        const isAdmin = Boolean(env.ADMIN_KEY && adminKey && adminKey === env.ADMIN_KEY);

        if (isAdmin) {
          await env.DB.prepare('UPDATE comments SET hidden = 1 WHERE id = ?').bind(commentId).run();
          return jsonResponse(request, { ok: true, deletedBy: 'admin' });
        }

        const authorHash = await getClientOnlyHash(request, env);
        const res = await env.DB.prepare(
          'UPDATE comments SET hidden = 1 WHERE id = ? AND author_hash = ?'
        ).bind(commentId, authorHash).run();

        if ((res?.meta?.changes || 0) === 0) {
          return jsonResponse(request, { error: 'אין הרשאה למחוק הערה זו' }, 403);
        }
        return jsonResponse(request, { ok: true, deletedBy: 'author' });
      }

      // 8. POST /api/contact — פנייה למפתח התוסף (נשמרת ב-D1 + נשלחת למייל דרך Webhook אם מוגדר)
      if (request.method === 'POST' && path === '/api/contact') {
        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse(request, { error: 'בקשה לא תקינה' }, 400);
        }

        const category = sanitizeText(payload?.category || 'אחר', 40) || 'אחר';
        const senderName = sanitizeText(payload?.senderName || 'משתמש אנונימי', 40) || 'משתמש אנונימי';
        const replyTo = sanitizeText(payload?.replyTo || '', 80);
        const message = sanitizeText(payload?.message || '', 1000);
        const appVersion = sanitizeText(payload?.appVersion || '', 20);

        if (message.length < 5) {
          return jsonResponse(request, { error: 'נא לכתוב הודעה מפורטת יותר (לפחות 5 תווים).' }, 400);
        }
        const codeErr = detectCodeOrLink(senderName) || (/<[^>]+>|javascript:/i.test(message) ? 'לא ניתן לשלוח קוד HTML בפנייה.' : null);
        if (codeErr) {
          return jsonResponse(request, { error: codeErr }, 400);
        }

        const now = Date.now();
        const actorHash = 'contact:' + await getActorHash(request, env);
        const winStart = now - CONTACT_RATE_WINDOW_MS;
        const rlRow = await env.DB.prepare(
          'SELECT COUNT(*) AS cnt FROM rate_limits WHERE actor_hash = ? AND created_at >= ?'
        ).bind(actorHash, winStart).first();
        if ((Number(rlRow?.cnt) || 0) >= CONTACT_RATE_MAX) {
          return jsonResponse(request, { error: 'נשלחו יותר מדי פניות בשעה האחרונה. נא לנסות שוב מאוחר יותר.' }, 429);
        }

        await env.DB.prepare(
          `INSERT INTO contact_messages (category, sender_name, reply_to, message, app_version, sender_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(category, senderName, replyTo, message, appVersion, actorHash, now).run();

        await env.DB.prepare(
          'INSERT INTO rate_limits (actor_hash, created_at) VALUES (?, ?)'
        ).bind(actorHash, now).run();

        // שליחה אסינכרונית למייל דרך Google Apps Script Webhook (אם הוגדר כ-Secret)
        if (env.CONTACT_MAIL_WEBHOOK) {
          const mailPromise = fetch(env.CONTACT_MAIL_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, senderName, replyTo, message, appVersion })
          }).catch(() => {});
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(mailPromise);
          }
        }

        return jsonResponse(request, { ok: true }, 201);
      }

      return jsonResponse(request, { error: 'Not Found' }, 404);
    } catch (err) {
      return jsonResponse(request, { error: 'שגיאת שרת פנימית' }, 500);
    }
  }
};
