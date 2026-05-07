# Huuu — 设计文档

**日期：** 2026-05-07  
**阶段：** Sprint 1

---

## 产品概述

**Huuu** 是一款面向中文用户的极简表达性写作 Web 应用，灵感来源于 flow.rest。核心理念：通过碎片化写作清空思绪，就像一声长长的呼气（Huuu～）。

- **Tagline：** *Write to breathe.*
- **目标用户：** 中文用户，需要一个无压力的思绪整理出口
- **差异化：** 中文界面、中文语音输入、本土化体验、国内访问速度

---

## Sprint 1 范围

忠实复刻 flow.rest 的核心交互体验，中文本地化，从零自写代码。

**包含：**
- 碎片化想法流（输入 + Enter 提交）
- 模糊退场效果（5分钟变只读）
- 单页无路由，按日期分组向下滚动
- 中文本地化（界面、语音、日期时间、Onboarding）
- 深色主题（默认），支持切换浅色/跟随系统
- 键盘导航（↑↓、Shift+↑↓）
- Cmd/Ctrl+F 搜索
- 中文语音输入（`lang="zh-CN"`）
- localStorage 存储，无后端
- PWA 支持（可安装到手机桌面）

**不包含（留给后续 Sprint）：**
- 用户账号 / 登录
- 云端同步
- 原生 App
- 付费功能
- Logo 设计

---

## 页面结构

**唯一页面，无路由。** 所有内容在一个可滚动的页面内，按日期分组。

```
/ (根路径)
├── Header（Logo 左，汉堡菜单右）
├── 居中内容列（max-width: 560px）
│   ├── [今天]
│   │   ├── 顶部输入框（root textarea）
│   │   ├── 分割线
│   │   └── 想法列表（ul.thoughts）
│   ├── [昨天]
│   │   └── 想法列表（只读）
│   ├── [周一] / [5月4日] ...
│   │   └── 想法列表（只读）
│   └── ... 无限向下
└── 底部渐变遮罩（fixed，引导视线向上）
```

---

## 核心交互机制

### 想法输入
- 顶部 textarea 自动扩展高度（rows=1 起）
- 占位符轮换（7条，见本地化章节）
- **Enter** → 提交当前想法，清空输入框，焦点回到输入框
- **Shift+Enter** → 插入换行，不提交
- 草稿在页面 `beforeunload` 时保存到 localStorage

### 想法退场（核心体验）
- 非焦点想法：`filter: blur(2px)` + `opacity: 0.5`，过渡动画 2s ease
- **5分钟**后变只读（`readOnly: true`）：`filter: blur(4px)` + `opacity: 0.3`
- 只读想法不可编辑，可查看，不可删除
- 活跃（焦点）想法：无模糊，完全清晰

### 键盘导航
- **↑ / ↓** → 在想法间跳转，自动 `scrollIntoView`
- **Shift+↑ / Shift+↓** → 跳跃 5 条
- **Backspace**（输入框为空时）→ 删除该想法
- 跳转到顶部时焦点回到 root textarea

### 搜索（Omnibar）
- **Cmd+F / Ctrl+F** → 打开搜索栏（覆盖在页面顶部）
- 实时过滤：匹配的想法 `unblur`，不匹配的加深模糊
- **Enter** → 跳到下一个结果，**Shift+Enter** → 上一个
- **Escape** → 关闭搜索

### 语音输入
- 输入框右侧麦克风按钮（仅支持的浏览器显示）
- 语言：`lang="zh-CN"`
- 点击切换开始/停止录音
- 识别结果追加到当前草稿

### 汉堡菜单
- 主题切换：深色 / 浅色 / 跟随系统
- 清空所有内容（危险操作，需确认）

### Onboarding（首次使用）
- 检测 `localStorage.__HUUU_HAS_ONBOARDED__`
- 首次访问显示引导屏，5条引导语逐条出现（动画）
- 用户点击继续后进入正式界面，写入 onboarded 标记

---

## 数据模型（localStorage）

```typescript
// 主数据
localStorage.__HUUU_THOUGHTS__ = JSON.stringify({
  "今天": [Thought, ...],
  "昨天": [Thought, ...],
  "周一": [Thought, ...],
  "5月4日": [Thought, ...],
})

// 草稿
localStorage.__HUUU_DRAFT__ = string

// 引导完成标记
localStorage.__HUUU_HAS_ONBOARDED__ = "true"

// 主题
localStorage.theme = "dark" | "light" | "system"

interface Thought {
  id: string           // Math.random().toString(36).substring(9)
  timestamp: string    // ISO 8601
  value: string
  readOnly: boolean
}
```

日期分组逻辑：
- 今天 → `"今天"`
- 昨天 → `"昨天"`
- 近5天 → `"周一"` / `"周二"` 等
- 更早 → `"5月4日"` 格式

---

## 中文本地化

### 输入占位符（7条轮换）
1. 你在想什么？
2. 说吧，我在听。
3. 继续…
4. 写出来，会好很多。
5. 还有呢？
6. 就这样流淌，挺好的。
7. 表达自己。

### 时间戳
- 12小时内：显示具体时间 `14:32`
- 超过12小时：显示相对时间 `3小时前` / `昨天`
- 刚刚提交：`刚刚`（阈值 44 秒）

### Onboarding 引导语（5条）
1. 欢迎来到 Huuu。
2. 通过不加修饰的写作，清空你的思绪。
3. 想法会慢慢淡出，给新的思绪腾出空间。
4. 你有5分钟来修改它，之后就让它静静留在那里。
5. 别担心，你随时可以回来读它。

### 日期格式
- 使用 `zh-CN` locale
- 近5天显示星期：`周一` `周二` ... `周日`
- 更早显示：`5月4日`

---

## 视觉设计

### 调色板（深色主题，默认）
```css
--bg: #000;
--fg: #fff;
--text-primary: #eaeaea;
--text-secondary: #666;
--divider: #1e1e1e;
--highlight: #191919;
```

### 布局
- 页面背景：`#000`
- 内容列：`max-width: 560px`，`margin: 0 auto`
- 内容上下内边距：`padding: 100px 32px`
- Header：固定在顶部，`padding: 20px 32px`，透明背景
- 底部渐变遮罩：`fixed`，高度 `120px`

### 字体
```css
font-family: "Inter", -apple-system, "PingFang SC", "Noto Sans SC",
             "Microsoft YaHei", sans-serif;
```
- Inter 负责西文和数字
- PingFang SC 负责中文（macOS/iOS）
- Noto Sans SC 负责中文（跨平台 fallback）

### 动效
- 想法提交：`framer-motion` 入场动画（opacity 0→1）
- 想法删除：exit 动画（opacity 0，x: -16，blur 3px）
- 模糊退场：CSS `transition: filter 2s ease`
- Header flow mode：写作时 Logo/菜单滑出视野

---

## 技术栈

| 层 | 技术 | 理由 |
|---|---|---|
| 框架 | Next.js 14（App Router） | 生态大，PWA 支持好，后续加后端无缝 |
| 样式 | Tailwind CSS | 极简 UI 开发效率高 |
| 动效 | Framer Motion | flow.rest 同款，想法入场/退场动画 |
| 状态 | React Context + useReducer | 轻量，无需 Redux |
| 存储 | localStorage（Sprint 1） | 零后端，专注体验 |
| 字体 | next/font（Inter + Noto Sans SC） | 自动优化，无 FOUT |
| 部署 | Vercel | 免费，一键部署 |
| PWA | next-pwa | 可安装到手机桌面 |

---

## Sprint 2 预告（不在当前范围）

- 手机号 + 验证码登录（阿里云/腾讯云短信）
- Supabase 云端存储，数据跨设备同步
- 本地数据迁移到云端
- Logo 设计
- 域名 + ICP 备案（如需）
