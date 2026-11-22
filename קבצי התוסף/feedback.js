document.addEventListener('DOMContentLoaded', () => {
  const rateBtn = document.getElementById('rateBtn');
  if (rateBtn) {
    rateBtn.addEventListener('click', () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            myfam_feedback_rated: true,
            myfam_feedback_rated_at: Date.now()
          });
        }
      } catch (_) {}
    });
  }

  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.onclick = () => {
      const storeUrl = 'https://chromewebstore.google.com/detail/jccmoihhcmpgneadjmgkdccenecmpjgd?utm_source=item-share-cb';
      const text = 'היי! מומלץ בחום להתקין את תוסף "מוסיף למשנת" לקניות קלות ומהירות במשנת יוסף: ' + storeUrl;
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('shareToast');
        if (toast) {
          toast.style.display = 'block';
          setTimeout(() => toast.style.display = 'none', 3000);
        }
      }).catch(() => {
        prompt('העתק את הקישור לשיתוף:', storeUrl);
      });
    };
  }
});
