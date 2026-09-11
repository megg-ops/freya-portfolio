/**
 * 履历与联系方式内容模块。
 *
 * 事实来源：`website/content-anon.md`（匿名版 v1.0）§3、§5–§9。
 * 公开口径：不写姓名全称、不写学校全名（用 985 / 211）、不写实习单位品牌、
 * 不写手机号与学号。联系邮箱经用户 2026-09-05 确认可公开。
 */

export interface TimelineEntry {
  period: string;
  kind: "教育" | "实习" | "项目" | "奖项" | "校内";
  title: string;
  detail?: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  period: string;
  facts: readonly string[];
}

export interface ExperienceEntry {
  org: string;
  role: string;
  period: string;
  points: readonly string[];
  boundaries?: readonly string[];
}

export interface SkillGroup {
  domain: string;
  items: readonly string[];
}

export const PROFILE = {
  name: "Freya",
  role: "AI 产品",
  status: "应用统计硕士在读 · 2027 届",
  statement:
    "我把模糊的需求，种成可以验证的东西。做 AI 应用时我关心的始终是同一件事：模型处理开放语义，程序守住确定事实，用户掌握关键决策。",
} as const;

export const EDUCATION: readonly EducationEntry[] = [
  {
    school: "985 高校",
    degree: "应用统计 · 硕士（推免）",
    period: "2025.09 – 至今",
    facts: ["GPA 3.83 / 4.0", "专业排名 1 / 35", "院研究生会科创部骨干"],
  },
  {
    school: "211 高校",
    degree: "金融工程 · 学士",
    period: "2021.09 – 2025.06",
    facts: [
      "GPA 3.89 / 4.0",
      "专业排名 4 / 60",
      "优秀毕业生",
      "校公益社团策划部部长",
    ],
  },
];

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    org: "MCN 机构",
    role: "数据运营实习生",
    period: "2026.03 – 2026.04",
    points: [
      "把原有的人工打标环节改造成 LLM 自动打标流水线：合并多源营销数据、判定达人类型、对齐互动/曝光/报价字段，再由大模型完成内容打标并写回协作表。",
      "自动化后每周可处理 1000+ 条数据。",
    ],
    boundaries: [
      "基础采集脚本非本人原创，原创部分是 LLM 打标改造。",
      "约 80% 的打标准确率为口头反馈，无书面佐证，仅作参考。",
    ],
  },
];

export const AWARDS: readonly string[] = [
  "全国大学生统计建模大赛 省赛二等奖（队长，2026）",
  "FC-OPC Next iBot 大赛「一人公司效率提升 Agent」赛道优胜奖（2026）",
  "全国大学生数学竞赛 省赛二等奖 ×2",
  "本科/研究生学业一等奖学金",
  "CET-6 536 · 研究生英语免修",
];

/** 统计建模作品单列：它是研究成果，不作为首屏项目入口。 */
export const RESEARCH = {
  title: "生成式 AI 对青年就业入口的影响",
  period: "2026.03 – 2026.06",
  role: "队长",
  award: "全国大学生统计建模大赛 省赛二等奖",
  points: [
    "主回归样本量 1,001,160。",
    "自建 AIME 岗位暴露度指标（E0–E3），用两段 Prompt 约束任务拆解、权重与 JSON 评分输出。",
    "核心结论：高 AI 暴露岗位的青年招聘相对收缩 11.5%（p = 0.006）。",
  ],
} as const;

export const SKILLS: readonly SkillGroup[] = [
  {
    domain: "LLM 工程",
    items: [
      "Prompt 设计与版本化",
      "JSON 结构化输出",
      "两阶段 Prompt",
      "缓存与退避重试",
      "Agent 状态机",
      "人工门禁",
      "MCP Server",
      "LLM 批量打标",
    ],
  },
  {
    domain: "产品",
    items: [
      "PRD",
      "闭环与收口",
      "降级 fallback",
      "证据可追溯",
      "设计系统",
      "用真实数据验证需求",
    ],
  },
  {
    domain: "数据与统计",
    items: [
      "Python",
      "Pandas",
      "SQL",
      "Playwright",
      "Selenium",
      "DID",
      "事件研究法",
      "时间序列",
      "Logistic",
      "聚类",
    ],
  },
  {
    domain: "开发",
    items: [
      "FastAPI",
      "SQLAlchemy",
      "Alembic",
      "React",
      "TypeScript",
      "Vite",
      "SSE",
      "Docker",
      "Git",
    ],
  },
  {
    domain: "AI 工具链",
    items: ["Claude Code", "Codex", "OpenCode"],
  },
];

export const TIMELINE: readonly TimelineEntry[] = [
  { period: "2021.09 – 2025.06", kind: "教育", title: "211 高校 · 金融工程本科" },
  { period: "2022.06 – 2023.06", kind: "校内", title: "校公益社团策划部部长" },
  { period: "2025.09 – 至今", kind: "教育", title: "985 高校 · 应用统计硕士（推免）" },
  { period: "2025.09 – 至今", kind: "校内", title: "院研究生会科创部骨干" },
  { period: "2026.03 – 2026.04", kind: "实习", title: "MCN 机构 · 数据运营实习" },
  {
    period: "2026.03 – 2026.06",
    kind: "奖项",
    title: "全国统计建模大赛 省赛二等奖",
    detail: "队长",
  },
  { period: "2026.04", kind: "项目", title: "empirical-paper 实证论文 Agent 流水线" },
  { period: "2026.04", kind: "项目", title: "柴愈 AI 情感陪伴应用" },
  { period: "2026.05", kind: "项目", title: "Ready2Apply 求职准备工作台" },
  {
    period: "2026.07",
    kind: "项目",
    title: "Solo Brand 一人品牌部",
    detail: "赛道优胜奖",
  },
  {
    period: "2026.08",
    kind: "项目",
    title: "锦囊 L10N 商品本地化素材生成",
    detail: "千问比赛 23 / 429",
  },
  {
    period: "2026.08",
    kind: "项目",
    title: "RepoLoop 开源维护协作方案",
    detail: "GOAI 前 300，未入围复赛",
  },
  {
    period: "2026.08",
    kind: "项目",
    title: "她的姊妹节 AI 文化叙事游戏 Demo",
    detail: "贵客松参赛，未获奖",
  },
];

export const CONTACT = {
  email: "freya223@agent.qq.com",
  github: { label: "megg-ops", href: "https://github.com/megg-ops" },
  mailSubject: "来自你的作品集网站",
  mailBody:
    "你好 Freya，\n\n我是（姓名 / 公司 / 岗位）：\n想聊的事：\n\n",
} as const;
