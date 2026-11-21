window.__MY_T = {
  request: o => new Promise((resolve, reject) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        return reject(new Error('שירות הרקע של התוסף אינו זמין כעת'));
      }
      chrome.runtime.sendMessage({ type: 'req', o }, r => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message || 'שגיאת תקשורת עם שירות הרקע'));
        }
        if (!r) {
          return reject(new Error('לא התקבלה תשובה משירות הרקע'));
        }
        if (r.error) {
          const err = new Error(r.error);
          err.status = r.status;
          return reject(err);
        }
        resolve(r.data);
      });
    } catch (e) {
      reject(e);
    }
  })
};
