(() => {
  if (window.__myfamHooked) return;
  window.__myfamHooked = true;
  const abs = u => { try { return new URL(u, location.href).href; } catch { return String(u); } };
  const want = u => /\/api\//.test(abs(u)) && /mishnatyosef\.org/.test(abs(u));
  let coreReady = false;
  const earlyQueue = [];
  const emit = d => {
    setTimeout(() => {
      try {
        const serialized = JSON.stringify(d);
        if (!coreReady) {
          earlyQueue.push(serialized);
          if (earlyQueue.length > 40) earlyQueue.shift();
          return;
        }
        window.dispatchEvent(new CustomEvent('myfam-api', { detail: serialized }));
      } catch (e) {}
    }, 0);
  };
  window.addEventListener('myfam-core-ready', () => {
    if (coreReady) return;
    coreReady = true;
    while (earlyQueue.length) {
      const payload = earlyQueue.shift();
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('myfam-api', { detail: payload })); } catch (e) {}
      }, 0);
    }
  });

  const origFetch = window.fetch;
  const capturedHeaders = {};

  window.fetch = async function (input, init) {
    const res = await origFetch.apply(this, arguments);
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || String(input);
      if (want(url)) {
        const method = (init && init.method) || (input && input.method) || 'GET';
        const body = init && typeof init.body === 'string' ? init.body : null;
        let auth = null;
        try {
          if (init && init.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((v, k) => { capturedHeaders[k.toLowerCase()] = v; });
            } else if (Array.isArray(init.headers)) {
              init.headers.forEach(([k, v]) => { capturedHeaders[k.toLowerCase()] = v; });
            } else if (typeof init.headers === 'object') {
              Object.keys(init.headers).forEach(k => { capturedHeaders[k.toLowerCase()] = init.headers[k]; });
            }
            auth = capturedHeaders['authorization'] || null;
          }
        } catch (e) {}
        res.clone().json()
          .then(json => emit({ url: abs(url), method: method.toUpperCase(), body, auth, headers: { ...capturedHeaders }, status: res.status, json }))
          .catch(() => {});
      }
    } catch (e) {}
    return res;
  };

  const X = XMLHttpRequest.prototype, oOpen = X.open, oSend = X.send, oSetHeader = X.setRequestHeader;
  X.open = function (m, u) { 
    this.__m = m; 
    this.__u = String(u); 
    this.__headers = {};
    return oOpen.apply(this, arguments); 
  };
  X.setRequestHeader = function (header, value) {
    try {
      if (!this.__headers) this.__headers = {};
      this.__headers[header.toLowerCase()] = value;
      capturedHeaders[header.toLowerCase()] = value;
      if (/^authorization$/i.test(header)) this.__auth = value;
    } catch (e) {}
    return oSetHeader.apply(this, arguments);
  };
  X.send = function (b) {
    this.addEventListener('load', function () {
      try {
        if (!want(this.__u)) return;
        const self = this;
        setTimeout(() => {
          try {
            let json;
            try { json = self.responseType === 'json' ? self.response : JSON.parse(self.responseText); } catch (e) { return; }
            emit({ 
              url: abs(self.__u), 
              method: String(self.__m).toUpperCase(), 
              body: typeof b === 'string' ? b : null, 
              auth: self.__auth || capturedHeaders['authorization'] || null, 
              headers: { ...capturedHeaders, ...(self.__headers || {}) },
              status: self.status, 
              json 
            });
          } catch (e) {}
        }, 0);
      } catch (e) {}
    });
    return oSend.apply(this, arguments);
  };

  /* פונקציית עזר לשליפת טוקן התחברות ממגוון מקורות אפשריים באתר */
  function extractSiteToken() {
    const directKeys = [
      'token', 'access_token', 'accessToken', 'auth_token', 'authToken',
      'jwt', 'mishnat_token', 'bearer_token', 'user_token'
    ];
    for (const st of [localStorage, sessionStorage]) {
      if (!st) continue;
      for (const k of directKeys) {
        try {
          const val = st.getItem(k);
          if (val && typeof val === 'string' && val.length > 8 && val !== 'null' && val !== 'undefined') {
            return val.replace(/^Bearer\s+/i, '').trim();
          }
        } catch (_) {}
      }
      try {
        for (let i = 0; i < st.length; i++) {
          const k = st.key(i);
          if (!k) continue;
          const raw = st.getItem(k);
          if (!raw || typeof raw !== 'string') continue;
          if (raw.charCodeAt(0) === 123 && (raw.includes('token') || raw.includes('Token') || raw.includes('jwt'))) {
            try {
              const obj = JSON.parse(raw);
              const cand = obj.token || obj.accessToken || obj.access_token || obj.authToken || obj.auth_token || obj.jwt || obj?.user?.token || obj?.auth?.token || obj?.data?.token;
              if (cand && typeof cand === 'string' && cand.length > 8) {
                return cand.replace(/^Bearer\s+/i, '').trim();
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
    try {
      const m = document.cookie.match(/(?:^|;\s*)(?:token|access_token|jwt|auth)=([^;]+)/i);
      if (m && m[1]) {
        return decodeURIComponent(m[1]).replace(/^Bearer\s+/i, '').trim();
      }
    } catch (_) {}
    return '';
  }

  function getXsrfToken() {
    try {
      const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/i);
      if (m && m[1]) return decodeURIComponent(m[1]);
    } catch (_) {}
    return '';
  }

  /* גשר לקריאות ישירות מעולם הדף (עוקף לחלוטין בעיות CORS ובידוד) */
  window.addEventListener('myfam-call-api', async ev => {
    let req;
    try { req = JSON.parse(ev.detail); } catch (e) { return; }
    
    // שליפת טוקן ההתחברות ישירות מ-localStorage או ממאגרי הסשן של האתר
    const token = (req.auth ? req.auth.replace(/^Bearer\s+/i, '').trim() : '') || extractSiteToken();
    const xsrf = getXsrfToken();

    // הגדרת כותרות מדויקות כמו של ה-Axios של משנת יוסף
    const hdrs = {
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest'
    };
    if (req.body) {
      hdrs['Content-Type'] = 'application/json';
    }
    if (token) {
      hdrs['Authorization'] = 'Bearer ' + token;
    }
    if (xsrf) {
      hdrs['X-XSRF-TOKEN'] = xsrf;
    }
    if (capturedHeaders['authorization'] && !hdrs['Authorization']) {
      hdrs['Authorization'] = capturedHeaders['authorization'];
    }
    if (capturedHeaders['x-xsrf-token'] && !hdrs['X-XSRF-TOKEN']) {
      hdrs['X-XSRF-TOKEN'] = capturedHeaders['x-xsrf-token'];
    }
    if (req.headers && typeof req.headers === 'object') {
      Object.assign(hdrs, req.headers);
    }

    // ניסיון ראשון: fetch מתוך עולם הדף
    try {
      const resp = await origFetch(req.url, {
        method: req.method || 'GET',
        headers: hdrs,
        credentials: 'include',
        body: req.body || undefined
      });
      let json = null;
      try { json = await resp.json(); } catch (e) {}

      if (resp.ok && json && /\/api\/(add_item|update_item|remove_item)/.test(req.url)) {
        emit({ url: abs(req.url), method: (req.method || 'GET').toUpperCase(), body: req.body, headers: hdrs, status: resp.status, json });
      }

      window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
        detail: JSON.stringify({ id: req.id, status: resp.status, json, ok: resp.ok })
      }));
      return;
    } catch (fetchErr) {
      // אם fetch בדף נכשל, ננסה XHR כגיבוי
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(req.method || 'GET', req.url);
      xhr.withCredentials = true;
      Object.keys(hdrs).forEach(h => {
        try { xhr.setRequestHeader(h, hdrs[h]); } catch (_) {}
      });
      xhr.onload = function () {
        let json = null;
        try { json = JSON.parse(xhr.responseText); } catch (e) {}
        if (xhr.status >= 200 && xhr.status < 300 && json && /\/api\/(add_item|update_item|remove_item)/.test(req.url)) {
          emit({ url: abs(req.url), method: (req.method || 'GET').toUpperCase(), body: req.body, status: xhr.status, json });
        }
        window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
          detail: JSON.stringify({ id: req.id, status: xhr.status, json, text: xhr.responseText, ok: xhr.status >= 200 && xhr.status < 300 })
        }));
      };
      xhr.onerror = function () {
        window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
          detail: JSON.stringify({ id: req.id, error: 'Network error (xhr)' })
        }));
      };
      xhr.send(req.body || null);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
        detail: JSON.stringify({ id: req.id, error: String(err) })
      }));
    }
  });
})();
