(function() {
  function getPageInfo() {
    const info = { type: null, roomId: null, bvid: null, title: '' };

    info.title = document.title.replace('_哔哩哔哩 (゜-゜)つロ 干杯~-bilibili', '').trim();

    const liveMatch = window.location.href.match(/live\.bilibili\.com\/(\d+)/);
    if (liveMatch) {
      info.type = 'live';
      info.roomId = liveMatch[1];
      return info;
    }

    const videoMatch = window.location.href.match(/bilibili\.com\/video\/([A-Za-z0-9]+)/);
    if (videoMatch) {
      info.type = 'video';
      info.bvid = videoMatch[1];
      return info;
    }

    return null;
  }

  const pageInfo = getPageInfo();
  if (pageInfo) {
    chrome.runtime.sendMessage({
      type: 'page-detected',
      pageInfo: pageInfo
    });
  }
})();
