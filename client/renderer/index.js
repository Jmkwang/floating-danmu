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

    if (!currentCookies || !currentCookies.SESSDATA) {
      return;
    }

    if (!currentPageInfo) {
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
      }
    } catch (err) {
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

        const typeText = info.type === 'live' ? '直播间' : '视频';
        const hasLogin = info.cookies && info.cookies.SESSDATA;

        if (hasLogin) {
          updateStatus(`${typeText}: ${info.title || '未知'}`, info.type);
        } else {
          updateStatus(`${typeText}: ${info.title || '未知'} (未登录)`, '');
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