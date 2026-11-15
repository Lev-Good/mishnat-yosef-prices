window.__MY_T = {
  request: o => chrome.runtime.sendMessage({ type: 'req', o }).then(r => {
    if (!r || r.error) throw new Error(r && r.error);
    return r.data;
  })
};