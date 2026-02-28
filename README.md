<div align="center">

# PocketClaw

**A high-performance, cross-platform AI desktop assistant powered by ZeroClaw Engine**

基于 ZeroClaw 引擎的高性能跨平台 AI 桌面助手

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.87+-orange?logo=rust)](https://rustup.rs)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Zero overhead. Zero compromise. 100% Rust & React.

[English](#-overview) | [中文](#-项目简介)

</div>

---

## Overview

PocketClaw is the official desktop frontend for the [ZeroClaw Engine](https://github.com/zeroclaw-labs/zeroclaw) — a high-performance Rust AI agent runtime. Built with **Tauri 2.0**, it connects to the ZeroClaw core via **direct IPC** (not HTTP wrappers), delivering millisecond-level responsiveness with native system integration.

> **Note**: This project is under active development. Some backend features from the ZeroClaw Engine do not yet have matching frontend UI — contributions are very welcome! See [Contributing](#-contributing--贡献指南) for details.

---

## 项目简介

PocketClaw 是 [ZeroClaw Engine](https://github.com/zeroclaw-labs/zeroclaw) 的官方桌面前端，将高性能 Rust AI 编排内核与现代 React 界面深度融合。通过 **Tauri IPC 直连** ZeroClaw 内核，实现毫秒级响应与原生系统集成。

> **提示**：本项目正在积极开发中，ZeroClaw 引擎的部分后端能力尚未在前端 UI 中实现。非常欢迎社区贡献，请参阅 [贡献指南](#-contributing--贡献指南)。

---

## Features / 核心功能

### AI Chat Engine / AI 对话引擎
- Full ZeroClaw Agent runtime with multi-turn conversation and tool calling
- **Streaming output** — token-by-token rendering, no waiting for full responses
- 15+ model providers: OpenAI, Anthropic, Deepseek, Google Gemini, Ollama (local), and more
- **Drag & drop** files into chat for context injection

### Long-Term Memory / 长期记忆管理
- Visual **memory panel** with list view, semantic search, and category filters
- **Knowledge injection** — manually write facts into the agent's long-term memory
- Forget specific entries to keep the memory store clean and accurate

### Skill Hub / 本地技能插件系统
- Browse and one-click install from the `open-skills` community repository
- Install from any Git URL or local directory for private skills
- Built-in `SKILL.md` editor — create and edit skills without leaving the app
- Skills extend agent prompts, tool sets, and automation workflows

### Security Sandbox / 安全沙箱
- **System Keyring** storage — API keys encrypted via OS native keychain (Windows CNG / macOS Keychain / libsecret), never written to disk
- **Human approval** prompts before executing sensitive operations (shell commands, etc.)
- **Tool call visualization** — real-time display of which tool the agent is invoking, with parameters and results

### Multi-Provider & Multi-Channel / 多提供商 & 多通道
- **Providers panel** — unified management of API keys and endpoints for all LLM providers
- **Channels panel** — configure Telegram, Discord, Slack, and 15+ messaging platforms

### Settings / 丰富的设置面板
- Agent orchestration, autonomy levels, memory backends, security policies
- Network (proxy, retry), cost limits, model routing, runtime adapters
- Integrations with external services

### Headless Server Mode / 无头服务器模式
- Launch as an Axum HTTP backend with `--server` flag
- Docker-ready with included `Dockerfile`

---

## Architecture / 技术架构

```
┌─────────────────────────────────────────────┐
│            React 19 Frontend                │
│    Tailwind CSS + Framer Motion + Lucide    │
└──────────────────┬──────────────────────────┘
                   │  Tauri IPC (invoke / events)
┌──────────────────▼──────────────────────────┐
│           Tauri 2.0 Rust Bridge             │
│   AppState · AuthManager · TauriObserver    │
└──────────────────┬──────────────────────────┘
                   │  Path dependency
┌──────────────────▼──────────────────────────┐
│         ZeroClaw Engine Core (Rust)         │
│   Agent · Memory · Providers · Tools        │
│   Skills · Security · Observability         │
└─────────────────────────────────────────────┘
```

| Layer | Tech |
|---|---|
| Desktop Framework | Tauri 2.0 |
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling & Animation | Tailwind CSS 3.4 + Framer Motion 12 |
| State Management | Zustand |
| Rust Backend Bridge | Tokio + Axum |
| AI Engine | [zeroclaw-engine](https://github.com/zeroclaw-labs/zeroclaw) v0.1.6 |
| Secret Storage | `keyring` (OS-native keychain) |

---

## Getting Started / 快速开始

### Prerequisites / 环境要求

- [Rust](https://rustup.rs/) 1.87+
- [Node.js](https://nodejs.org/) 20+
- [Git](https://git-scm.com/)

### Clone & Run / 克隆与运行

```bash
# Clone the repository
git clone https://github.com/Ei-Ayw/PocketClaw.git
cd PocketClaw

# Install frontend dependencies
npm install

# Start dev server (launches both Vite and Tauri)
npm run tauri dev
```

On first launch, the **Onboarding wizard** will guide you through API key setup.

### Build Release / 构建发布版本

```bash
npm run tauri build
```

Output at `src-tauri/target/release/bundle/`:
- Windows: `.msi` / `.exe`
- macOS: `.app` / `.dmg`
- Linux: `.AppImage` / `.deb`

### Docker (Headless)

```bash
docker build -t pocketclaw .
docker run -p 8080:8080 pocketclaw
```

---

## Project Structure / 项目结构

```
PocketClaw/
├── src/                        # React frontend
│   ├── App.tsx                 # Root component & routing
│   ├── store.ts                # Zustand state management
│   ├── main.tsx                # Entry point
│   └── components/
│       ├── Dashboard.tsx       # Main layout & view switching
│       ├── Sidebar.tsx         # Navigation sidebar
│       ├── MemoryView.tsx      # Memory management panel
│       ├── ToolsView.tsx       # Skills & tools explorer
│       ├── ProvidersView.tsx   # LLM provider configuration
│       ├── ChannelsView.tsx    # Multi-channel setup
│       ├── SettingsDialog.tsx  # Global settings dialog
│       ├── WorkspaceView.tsx   # Workspace management
│       ├── StatusView.tsx      # System status monitor
│       ├── ProfileView.tsx     # User profile
│       ├── Titlebar.tsx        # Custom window titlebar
│       ├── ToastContainer.tsx  # Notification toasts
│       └── settings/           # Settings sub-panels
│           ├── AgentTab.tsx        # Agent orchestration
│           ├── AutonomyTab.tsx     # Permission & approval rules
│           ├── MemoryTab.tsx       # Memory backend config
│           ├── SecurityTab.tsx     # Sandbox & OTP
│           ├── NetworkTab.tsx      # Proxy & retry policies
│           ├── CostTab.tsx         # Cost limits
│           ├── IntegrationsTab.tsx # External services
│           ├── RuntimeTab.tsx      # Runtime adapters
│           ├── ToolsTab.tsx        # Tool configuration
│           ├── RoutingTab.tsx      # Model routing
│           ├── AdvancedTab.tsx     # Advanced tuning
│           └── GeneralTab.tsx      # Basic settings
├── src-tauri/                  # Rust backend (Tauri)
│   ├── src/
│   │   ├── lib.rs              # Tauri commands & business logic
│   │   ├── main.rs             # Window init, menu, tray
│   │   └── error.rs            # Error types
│   └── Cargo.toml
├── Dockerfile                  # Headless server container
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Current Status / 当前状态

> **Important / 重要提示**

PocketClaw is in **early active development** (v0.1.0). The ZeroClaw Engine backend provides many powerful capabilities, but **not all of them have corresponding frontend UI yet**. Here's a summary:

PocketClaw 目前处于**早期活跃开发阶段** (v0.1.0)。ZeroClaw 引擎后端提供了许多强大功能，但**并非所有功能都已在前端实现对应 UI**。以下是概览：

| Feature / 功能 | Frontend Status / 前端状态 |
|---|---|
| AI Chat (streaming, multi-turn) | Implemented |
| Memory management | Implemented |
| Skill Hub (install, edit, browse) | Implemented |
| Provider management | Implemented |
| Channel configuration | Implemented |
| Settings (12 tabs) | Implemented |
| Tool call visualization | Implemented |
| System status monitor | Implemented |
| RAG knowledge base | Not yet |
| Multi-agent orchestration UI | Not yet |
| Cron/scheduled tasks UI | Not yet |
| Hardware peripherals UI | Not yet |
| Audit log viewer | Not yet |
| Observability dashboard (Prometheus/OTel) | Not yet |

We are actively working on closing these gaps. **Contributions are very welcome!**

我们正在积极推进这些功能的前端实现，**非常欢迎社区贡献！**

---

## Roadmap / 开发路线图

- [x] Core architecture, UI framework, Rust secure integration
- [x] Official ZeroClaw engine integration & event streaming
- [x] Tool chain visualization & sandbox permission control
- [x] Memory management panel
- [x] Local skill plugin system (Skill Hub)
- [x] UI refinement & final build verification
- [ ] Custom RAG knowledge base integration / 自定义 RAG 知识库接入
- [ ] Multi-agent collaboration orchestration / 多 Agent 协作编排
- [ ] Cron task management UI / 定时任务管理界面
- [ ] Hardware peripherals dashboard / 硬件外设控制面板
- [ ] Audit & observability UI / 审计与可观测性界面
- [ ] Mobile (iOS / Android) / 移动端支持

---

## Contributing / 贡献指南

**We warmly welcome Issues and Pull Requests!** Whether it's building UI for unmatched backend features, fixing bugs, improving UX, or adding translations — all contributions matter.

**热烈欢迎提交 Issue 和 Pull Request！** 无论是为尚未匹配的后端功能构建 UI、修复 Bug、改善用户体验，还是添加多语言支持，每一份贡献都很重要。

### Guidelines

1. Follow existing code style — Tailwind + Framer Motion for frontend, idiomatic Rust for backend
2. Avoid `unwrap()` / `expect()` in Rust code — use `?` for error propagation
3. Keep components focused and composable
4. Test your changes before submitting

### Areas That Need Help / 需要帮助的方向

- Frontend UI for backend features listed as "Not yet" in the status table above
- i18n / multi-language support
- Accessibility improvements
- Documentation and examples
- Cross-platform testing (especially macOS & Linux)

---

## License / 许可证

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

本项目基于 **MIT License** 开源。

---

<div align="center">

**PocketClaw** — Your AI, local and fast.

[Report Bug](https://github.com/Ei-Ayw/PocketClaw/issues) · [Request Feature](https://github.com/Ei-Ayw/PocketClaw/issues) · [Contribute](https://github.com/Ei-Ayw/PocketClaw/pulls)

</div>
