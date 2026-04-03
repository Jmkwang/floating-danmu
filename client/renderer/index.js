(function() {
  const mainContainer = document.getElementById('mainContainer');
  const capsuleContainer = document.getElementById('capsuleContainer');
  const danmuInput = document.getElementById('danmuInput');
  const sendBtn = document.getElementById('sendBtn');
  const closeBtn = document.getElementById('closeBtn');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const resultText = document.getElementById('resultText');
  const capsuleStatus = document.getElementById('capsuleStatus');

  let currentPageInfo = null;
  let currentCookies = null;
  let isCapsuleMode = false;

  function updateStatus(text, type) {
    statusText.textContent = text;
    statusIndicator.className = 'status-indicator';

    if (type === 'connected') {
      statusIndicator.classList.add('connected');
    } else if (type === 'live') {
      statusIndicator.classList.add('live');
    }

    updateCapsuleStatus(type);
  }

  function updateCapsuleStatus(type) {
    capsuleStatus.className = 'capsule-status';

    if (type === 'live') {
      capsuleStatus.classList.add('live');
      capsuleStatus.textContent = '●';
    } else if (type === 'connected') {
      capsuleStatus.classList.add('connected');
      capsuleStatus.textContent = '●';
    } else {
      capsuleStatus.textContent = '●';
    }
  }

  function showResult(text, type) {
    resultText.textContent = text;
    resultText.className = type;

    setTimeout(() => {
      resultText.textContent = '';
      resultText.className = '';
    }, 3000);
  }

  function setMode(mode) {
    isCapsuleMode = mode === 'capsule';

    if (isCapsuleMode) {
      mainContainer.style.display = 'none';
      capsuleContainer.style.display = 'flex';
    } else {
      mainContainer.style.display = 'block';
      capsuleContainer.style.display = 'none';
    }
  }

  async function sendDanmaku() {
    const content = danmuInput.value.trim();
    if (!content) {
      showResult('请输入弹幕内容', 'error');
      return;
    }

    if (!currentCookies || !currentCookies.SESSDATA) {
      showResult('未检测到登录状态', 'error');
      return;
    }

    if (!currentPageInfo) {
      showResult('未检测到B站页面', 'error');
      return;
    }

    sendBtn.disabled = true;
    showResult('发送中...', '');

    try {
      const result = await window.electronAPI.sendDanmaku(content);

      if (result.success) {
        showResult('✓ 已发送', 'success');
        danmuInput.value = '';
      } else {
        showResult('✗ ' + (result.error || '发送失败'), 'error');
      }
    } catch (err) {
      showResult('✗ ' + err.message, 'error');
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

  // 胶囊点击展开 - 使用 mousedown 来区分拖拽和点击
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
    // 如果拖拽时间很短且没有明显移动，认为是点击
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
      setMode(mode);
    });
  }

  updateStatus('等待B站页面...', '');
})();
