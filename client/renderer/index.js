(function() {
  const mainContainer = document.getElementById('mainContainer');
  const capsuleContainer = document.getElementById('capsuleContainer');
  const danmuInput = document.getElementById('danmuInput');
  const sendBtn = document.getElementById('sendBtn');
  const closeBtn = document.getElementById('closeBtn');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const statusText = document.getElementById('statusText');
  const capsuleStatus = document.getElementById('capsuleStatus');
  const statusIndicator = document.getElementById('statusIndicator');

  let currentPageInfo = null;
  let currentCookies = null;
  let isCapsuleMode = false;

  function updateStatus(text, type) {
    statusText.textContent = text;
    capsuleStatus.textContent = text;

    if (type) {
      statusIndicator.classList.add('connected');
    } else {
      statusIndicator.classList.remove('connected');
    }

    mainContainer.className = 'container';
  }

  async function sendDanmaku() {
    const content = danmuInput.value.trim();
    if (!content) return;

    if (!currentPageInfo || currentPageInfo.type !== 'live') {
      updateStatus('请在直播间使用', '');
      return;
    }

    if (!currentCookies || !currentCookies.SESSDATA) {
      updateStatus('未登录，无法发送弹幕', '');
      return;
    }

    sendBtn.disabled = true;

    try {
      const result = await window.electronAPI.sendDanmaku(content);
      if (result && result.success) {
        danmuInput.value = '';
        danmuInput.classList.add('success-flash');
        setTimeout(() => {
          danmuInput.classList.remove('success-flash');
        }, 1000);
      } else {
        updateStatus(result.error || '发送失败', '');
      }
    } catch (err) {
      updateStatus('发送异常', '');
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', sendDanmaku);

  danmuInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendDanmaku();
    }
  });

  minimizeBtn.addEventListener('click', () => {
    window.electronAPI.collapseWindow();
  });

  closeBtn.addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
  });

  let isDragging = false;
  let dragStartTime = 0;

  capsuleContainer.addEventListener('mousedown', () => {
    isDragging = false;
    dragStartTime = Date.now();
  });

  capsuleContainer.addEventListener('mousemove', () => {
    isDragging = true;
  });

  capsuleContainer.addEventListener('mouseup', () => {
    const dragDuration = Date.now() - dragStartTime;
    if (!isDragging && dragDuration < 200) {
      window.electronAPI.expandWindow();
    }
  });

  if (window.electronAPI && window.electronAPI.onPageInfoUpdated) {
    window.electronAPI.onPageInfoUpdated((info) => {
      if (info) {
        currentPageInfo = info;
        currentCookies = info.cookies;

        const hasLogin = info.cookies && info.cookies.SESSDATA;

        if (info.type === 'live' && hasLogin) {
          updateStatus(`直播间: ${info.title || '未知'}`, 'live');
        } else if (info.type === 'live' && !hasLogin) {
          updateStatus(`直播间: ${info.title || '未知'} (未登录)`, '');
        } else {
          updateStatus('仅支持B站直播间', '');
        }
      }
    });
  }

  if (window.electronAPI && window.electronAPI.onWindowModeChanged) {
    window.electronAPI.onWindowModeChanged((mode) => {
      isCapsuleMode = mode === 'capsule';

      if (isCapsuleMode) {
        mainContainer.style.display = 'none';
        capsuleContainer.style.display = 'flex';
      } else {
        mainContainer.style.display = 'block';
        capsuleContainer.style.display = 'none';
      }
    });
  }

  updateStatus('等待连接...', '');
})();