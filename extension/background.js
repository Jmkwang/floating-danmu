const BILIBILI_DOMAINS = ['.bilibili.com', '.b23.tv'];

let currentPageInfo = null;
let currentCookies = null;

const CLIENT_PORT = 34567;

function extractPageInfo(url, title) {
  const info = { url, title, type: null, roomId: null, bvid: null };

  const liveMatch = url.match(/live\.bilibili\.com\/(\d+)/);
  if (liveMatch) {
    info.type = 'live';
    info.roomId = liveMatch[1];
    return info;
  }

  const videoMatch = url.match(/bilibili\.com\/video\/([A-Za-z0-9]+)/);
  if (videoMatch) {
    info.type = 'video';
    info.bvid = videoMatch[1];
    return info;
  }

  return null;
}

async function getBilibiliCookies(tabId) {
  const cookies = {};
  const cookieNames = ['SESSDATA', 'bili_jct', 'DedeUserID', 'DedeUserID__ckMd5'];

  for (const name of cookieNames) {
    try {
      const cookie = await chrome.cookies.get({
        url: 'https://www.bilibili.com',
        name: name
      });
      if (cookie) {
        cookies[name] = cookie.value;
      }
    } catch (e) {
      console.log(`Failed to get cookie ${name}:`, e);
    }
  }

  return cookies;
}

async function sendToDesktopClient(message) {
  try {
    const response = await fetch(`http://localhost:${CLIENT_PORT}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error('Client not available');
    }

    return await response.json();
  } catch (e) {
    console.error('Failed to send to desktop client:', e);
    return { success: false, error: e.message };
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url) return;

  const isBilibili = BILIBILI_DOMAINS.some(d => tab.url.includes(d));
  if (!isBilibili) return;

  const pageInfo = extractPageInfo(tab.url, tab.title);
  if (!pageInfo) return;

  currentPageInfo = pageInfo;
  currentCookies = await getBilibiliCookies(tabId);

  await sendToDesktopClient({
    type: 'page-update',
    pageInfo: pageInfo,
    cookies: currentCookies
  });
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url) return;

  const isBilibili = BILIBILI_DOMAINS.some(d => tab.url.includes(d));
  if (!isBilibili) return;

  const pageInfo = extractPageInfo(tab.url, tab.title);
  if (!pageInfo) return;

  currentPageInfo = pageInfo;
  currentCookies = await getBilibiliCookies(activeInfo.tabId);

  await sendToDesktopClient({
    type: 'page-update',
    pageInfo: pageInfo,
    cookies: currentCookies
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'page-detected') {
    currentPageInfo = message.pageInfo;
    return true;
  }

  if (message.type === 'get-page-info') {
    sendResponse(currentPageInfo);
    return true;
  }

  if (message.type === 'send-danmaku') {
    const { content } = message;

    sendToDesktopClient({
      type: 'send-danmaku',
      content: content,
      pageInfo: currentPageInfo,
      cookies: currentCookies
    }).then(response => {
      sendResponse(response);
    });

    return true;
  }

  if (message.type === 'get-cookies') {
    sendResponse(currentCookies || {});
    return true;
  }
});
