# AGENTS.md

## 项目概览

专业塔罗解读 Web 应用（Next.js 16 + React 19 + TypeScript）。用户输入问题、选择牌阵、抽取塔罗牌，由 LLM 按固定章节输出完整解读（SSE 流式渲染）。

## 技术栈

- **Next.js 16 (App Router)**，源码位于 `src/`
- **React 19 / TypeScript 5 / Tailwind CSS 4**
- **UI**: shadcn/ui 组件库（`src/components/ui/`）
- **LLM 集成**: `coze-coding-dev-sdk`（后端专用，禁用于客户端）

## 关键目录

```
src/
├── app/
│   ├── api/reading/route.ts   # SSE 流式解读接口（唯一后端入口）
│   ├── layout.tsx             # 根布局（global 主题）
│   └── page.tsx               # 首页（渲染 TarotApp）
├── components/
│   ├── tarot-app.tsx          # 主流程编排（问题→牌阵→抽牌→生成→结果）
│   ├── draw-board.tsx         # 抽牌/洗牌/正逆位切换
│   └── reading-result.tsx     # 解读结果分段展示 + 打字机渲染
└── lib/
    ├── tarot-data.ts          # 78 张塔罗牌数据 + 牌阵定义
    └── prompt.ts              # LLM 系统提示词与用户消息构建
```

## 常用命令（仅 pnpm）

- 安装依赖：`pnpm install`
- 新增依赖：`pnpm add <pkg>`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint:build`
- 构建：`pnpm build`

## 核心逻辑与契约

### 数据结构
- `TarotCard`: `id / name / en / arcana / suit / number / element / upright[] / reversed[] / meaning / reversedMeaning`
- 确保 78 张牌 id 全局唯一（含 22 大阿卡纳 + 56 小阿卡纳）。

### 接口契约
`POST /api/reading`，请求体：
```json
{
  "question": "string",
  "spreadId": "string",
  "draws": [{ "cardId": "string", "reversed": boolean }]
}
```
- `draws.length` 必须等于所选牌阵的位置数。
- 返回 `text/event-stream`：`data: {"t":"文本块"}` 累积即完整解读；`event: done` 结束；`event: error` 出错。

### 解读规范（prompt.ts 中约束）
固定输出五个章节：【整体能量】【逐牌解析】【综合洞察】【行动建议】【一句话收束】。
- 语气温暖客观，禁止宿命论与「一定会/绝对」措辞。
- 强调用户选择权；健康/法律/投资议题提示咨询专业人士。

## 设计与主题

见 `DESIGN.md`。全局主色「墨蓝夜空 + 鎏金」，样式集中在 `globals.css` 的 `:root` 变量与 `.panel-glass/.gold-grad-text/.starfield/.reveal-*` 等自定义类中。

## 注意事项

- 后端只读 `process.env.DEPLOY_RUN_PORT`，禁止硬编码端口。
- LLM 调用必须用 `HeaderUtils.extractForwardHeaders` 转发请求头。
- 修改 `/api/reading` 或 `prompt.ts` 时，勿破坏五章节输出契约与流式格式。