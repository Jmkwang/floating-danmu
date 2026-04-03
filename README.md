# Floating Danmu 💬

一款专为 B 站用户设计的弹幕发送辅助工具。当你在观看直播或视频时，无需切换回浏览器窗口，直接通过桌面悬浮窗即可快速发送弹幕。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## 💡 项目用途

**解决什么问题？**

在 B 站【听】直播时，经常遇到这样的情况：

- 浏览器最小化或放在后台，想发弹幕却要切回去
- 一边做其他事情一边听直播，发弹幕很麻烦
- 全屏游戏或工作时，错过互动时机

**Floating Danmu 让你：**

- ✅ 浏览器最小化也能发弹幕
- ✅ 桌面悬浮窗口，随时待命
- ✅ 支持收起为胶囊，不占空间
- ✅ 自动识别直播间/视频页

## ✨ 功能特性

| 功能                   | 说明                                      |
| ---------------------- | ----------------------------------------- |
| 🎯**悬浮发送**   | 桌面悬浮窗口，浏览器最小化也能发弹幕      |
| 🔴**状态指示**   | 🟡 黄点=未连接 / 🟢 绿点=已连接，一目了然 |
| 💊**胶囊模式**   | 支持收起为透明胶囊，更隐蔽不占空间        |
| 🖱️**自由拖拽** | 窗口位置自由调整，放在顺手的位置          |
| 📺**直播+视频**  | 同时支持 B 站直播间和视频页发弹幕         |
| 🔒**安全登录**   | 自动读取浏览器 Cookie，无需额外登录       |

## 📸 界面预览

```
展开状态:                    胶囊模式:
┌──────────────────────┐    ┌──────────────┐
│ 直播间: xxx  − ×     │    │ 等待B站页面  │
├──────────────────────┤    └──────────────┘
│ [输入弹幕... ] [发送] │
└──────────────────────┘
```

## 🚀 快速开始

### 1. 安装桌面客户端

```bash
cd client
npm install
npm start
```

### 2. 安装浏览器插件

1. 打开 Chrome/Edge，进入 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension` 文件夹

### 3. 开始使用

1. 启动桌面客户端（会显示在系统托盘）
2. 在浏览器打开 B 站直播间或视频页
3. 悬浮窗口自动显示页面状态（绿点表示已连接）
4. 输入弹幕内容，按 Enter 或点击发送

**操作说明：**

- 点击 `−` 收起为胶囊模式
- 点击 `×` 隐藏到系统托盘
- 拖拽窗口调整位置
- 点击胶囊展开窗口

## 📁 项目结构

```
floating-danmu/
├── extension/          # 浏览器插件（Chrome/Firefox/Edge）
│   ├── manifest.json   # 插件配置
│   ├── background.js   # 后台脚本：监听页面变化
│   └── content.js      # 内容脚本：提取页面信息
├── client/             # Electron 桌面客户端
│   ├── main.js         # 主进程：HTTP服务、弹幕发送
│   ├── preload.js      # 预加载脚本：安全桥接
│   ├── package.json    # 项目依赖
│   └── renderer/       # 渲染进程：悬浮窗口UI
│       ├── index.html
│       ├── index.css
│       └── index.js
├── README.md           # 项目说明
├── LICENSE             # MIT 许可证
└── .gitignore          # Git 忽略配置
```

## 🛠️ 技术架构

### 通信流程

```
┌─────────────┐      HTTP        ┌─────────────┐
│ 浏览器插件   │  ◄────────────►  │ 桌面客户端   │
│             │  localhost:34567 │             │
│ - 检测B站页面│                  │ - 悬浮窗口   │
│ - 读取Cookie │                 │ - 发送弹幕   │
└─────────────┘                  └─────────────┘
```

### 技术栈

- **浏览器插件**: Manifest V3
- **桌面客户端**: Electron
- **通信方式**: HTTP (localhost:34567)
- **UI 样式**: 原生 CSS

### 实现路径

#### 浏览器插件（extension/）

| 文件              | 实现方式                   | 功能说明                                                           |
| ----------------- | -------------------------- | ------------------------------------------------------------------ |
| `manifest.json` | Manifest V3 配置           | 定义插件权限、content script 匹配规则、background service worker   |
| `content.js`    | DOM 解析                   | 检测 B 站直播间/视频页，提取 roomId、bvid、标题等信息              |
| `background.js` | Service Worker + Fetch API | 监听页面变化，读取登录 Cookie，通过 HTTP POST 发送数据到桌面客户端 |

#### 桌面客户端（client/）

| 文件                    | 实现方式         | 功能说明                                                                             |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------ |
| `main.js`               | Electron 主进程  | 创建 BrowserWindow（透明、置顶、无边框）、HTTP 服务器（Node.js http 模块）、系统托盘      |
| `preload.js`            | contextBridge   | 安全桥接主进程与渲染进程，暴露 `sendDanmaku`、`onPageInfoUpdated` 等 API                 |
| `renderer/index.html`   | HTML 结构        | 展开状态（标题栏 + 输入区）和胶囊状态（横向药丸）的容器结构                               |
| `renderer/index.css`    | CSS 样式         | 毛玻璃效果（backdrop-filter）、动态边框、横向胶囊布局                                   |
| `renderer/index.js`     | 前端逻辑         | 用户交互处理、窗口模式切换、发送结果反馈                                                 |

#### 通信协议

```
POST http://localhost:34567/api/message

// 请求体
{
  "type": "page-update",
  "pageInfo": {
    "type": "live" | "video",
    "roomId": "直播间ID",
    "bvid": "视频BV号",
    "title": "页面标题"
  },
  "cookies": {
    "SESSDATA": "xxx",
    "bili_jct": "xxx"
  }
}
```

#### B站API调用

| 场景         | API 端点                                    | 请求方式  | 关键参数                               |
| ------------ | ------------------------------------------- | -------- | -------------------------------------- |
| 发送直播弹幕  | `https://api.live.bilibili.com/msg/send`    | POST     | roomid, msg, csrf_token, bubble, color |
| 发送视频评论  | `https://api.bilibili.com/x/v2/reply/add`   | POST     | oid, type=1, message, csrf_token       |

## 🔧 开发说明

### 浏览器插件权限

- `activeTab` - 获取当前标签页信息
- `tabs` - 监听标签页变化
- `cookies` - 读取 B 站登录状态
- `storage` - 本地存储

### 数据安全

- 插件只读取必要的登录 Cookie（SESSDATA、bili_jct）
- Cookie 仅用于本地发送弹幕，不会上传到任何第三方服务器
- 所有通信都在本地 localhost 完成

## 📝 注意事项

1. **端口占用**: 客户端默认使用 34567 端口，如果被占用请同时修改：

   - `client/main.js` 中的 `CLIENT_PORT`
   - `extension/background.js` 中的 `CLIENT_PORT`
2. **首次使用**: 确保浏览器已登录 B 站账号，插件会自动读取登录状态
3. **浏览器权限**: 安装插件时请允许所有权限，以确保能正常读取 B 站页面信息和登录状态

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

Made with ❤️ for Bilibili users
