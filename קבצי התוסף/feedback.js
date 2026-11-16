document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.onclick = () => {
      const storeUrl = document.getElementById('rateBtn')?.href || 'https://chrome.google.com/webstore';
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
