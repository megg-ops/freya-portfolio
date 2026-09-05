/**
 * 网站统一项目内容模块。
 *
 * 事实来源：`materials/website_content_anon.md`（匿名版 v1.0，含 2026-09-05 增补）
 * 与 `materials/recent_projects_20260905.md`（核实日期 2026-09-05）。
 * 本文件只保留可公开的叙述与已核实的结果，不含本地路径、凭据或内部日志。
 * 每个项目的 `boundaries` 是对外明示的能力边界，不得为了好看删改。
 */

export interface ProjectEvidence {
  /** 展示文案 */
  label: string;
  /** 公开可访问地址；2026-09-05 实测均返回 200 */
  href: string;
  kind: "repo" | "live" | "doc";
}

export interface ProjectSection {
  heading: string;
  items: readonly string[];
}

export interface Project {
  id: string;
  name: string;
  /** 根系入口上的一行定位 */
  tagline: string;
  /** machine-readable，用于 <time dateTime> 与排序 */
  dateTime: string;
  dateLabel: string;
  /** 亮点项目在首屏放大显示 */
  highlight: boolean;
  /** 结果/状态标签，例如比赛名次；没有就留空 */
  status?: string;
  /** 详情页开头的一段话 */
  summary: string;
  /** 问题与用户 */
  problem: string;
  /** 本人角色 */
  role: string;
  /** 关键产品决策 */
  decisions: readonly string[];
  /** 工作流程 */
  process: readonly string[];
  /** 成果 */
  outcomes: readonly string[];
  /** 实际边界 */
  boundaries: readonly string[];
  tech: readonly string[];
  evidence: readonly ProjectEvidence[];
  /** 可选封面图，public 下的路径 */
  cover?: { src: string; alt: string };
}

/** 按时间升序排列，呼应首屏「从根部往上生长」的叙事。 */
export const PROJECTS: readonly Project[] = [
  {
    id: "empirical-paper",
    name: "empirical-paper",
    tagline: "实证论文 Agent 流水线",
    dateTime: "2026-04",
    dateLabel: "2026 · 04",
    highlight: true,
    status: "开源 · Claude Code Skill",
    summary:
      "让模型负责语义，让脚本守住事实。一套面向经管类实证研究的 AI 工作流：确定性脚本审计数据、核验数字和文档，模型聚焦研究判断与写作，人机边界处设置确认门禁。",
    problem:
      "当 AI 参与实证论文写作时，最大的风险不是写不出来，而是把模型「看起来合理」的输出误当成数据事实。使用者是需要自己跑实证、又要对每个数字负责的研究者。",
    role:
      "独立完成。定义人机责任边界、设计分阶段编排与门禁机制、实现校验链路与产出规范。",
    decisions: [
      "把「客观事实」与「开放语义」分开：行列数、缺失值、重复值、唯一性、数值分布和连接质量由脚本全量计算，模型不能覆盖客观画像。",
      "受限语义映射：模型可以补充变量含义与角色，但必须标记依据、置信度与确认状态。",
      "设置人工阻断卡点：主分析表、关键变量、连接方式存在歧义时流程停下来等用户确认，而不是让模型自己选一个。",
      "单一数字真源：论文里的关键实证数字统一来自 results.json，不允许模型二次转述。",
      "质量门禁输出机器可读 JSON，而不是让模型读一份报告后自我判断是否通过。",
    ],
    process: [
      "Stage 0–6 多阶段编排，routing map 控制每个阶段的最小上下文加载，避免整份历史被塞进模型。",
      "run_id 隔离工作区，配合 user_confirmed.flag 做人工门禁。",
      "一致性校验链路：verify_consistency → validate_docx → final_quality_gate。",
      "会话中断时依据阶段状态与已有产物恢复执行，不必从头再来。",
    ],
    outcomes: [
      "交付物不只是一篇论文，还包括数据审计报告、可复现分析代码、结果表图、Word 成品与机器可读的验收证据。",
      "已开源为 Claude Code Skill；GitHub star 数 8（2026-08-17 历史快照，当前值未刷新）。",
      "小红书传播数据：曝光 3,785、点赞 357、收藏 375、转发 84。",
    ],
    boundaries: [
      "传播数据只说明内容被多少人看到，不等于需求已被充分验证，也没有真实用户留存或学术采纳证据。",
      "star 数是 2026-08-17 的历史快照，本轮未联网刷新。",
      "质量门禁校验的是数字一致性与文档完整性，不代表研究设计本身正确。",
    ],
    tech: ["Claude Code Skill", "Python", "pandoc", "多阶段编排", "结构化质量门禁"],
    evidence: [
      {
        label: "GitHub 仓库",
        href: "https://github.com/megg-ops/empirical-paper",
        kind: "repo",
      },
    ],
    cover: {
      src: "/assets/projects/empirical-paper-cover.webp",
      alt: "empirical-paper 封面：检验台上的表格纸张、确认压章与上锁的证据柜",
    },
  },
  {
    id: "chaiyu",
    name: "柴愈",
    tagline: "AI 情感陪伴 · 心情日记",
    dateTime: "2026-04",
    dateLabel: "2026 · 04",
    highlight: false,
    status: "已上线 Demo",
    summary:
      "一只 AI 柴犬负责陪你说话，一本心情日记负责留下痕迹。做数字疗愈方向的一次产品尝试：先让人愿意开口，再谈功能。",
    problem:
      "情绪低落的时候，人往往不想面对一个「专业」的界面。用户需要的是低门槛、无评判、随时可退出的陪伴对象，而不是一份问卷。",
    role: "独立完成。产品定位、设计系统、对话体验与 LLM 后端。",
    decisions: [
      "用宠物人格而不是助手人格承载对话，降低倾诉门槛。",
      "四种宠物性格，配合状态、昵称与历史记录动态拼装 Prompt，让对话有连续性而不是每次重来。",
      "模型调用失败时给出预设 fallback 回复，宁可回答得普通，也不让陪伴对象突然消失。",
      "先做完整的 DESIGN.md 设计系统再写界面，保证视觉语言统一。",
    ],
    process: [
      "定义宠物性格与对话语气边界，写进 Prompt 模板。",
      "前端 React 应用 + Serverless 对话后端，部署在 Vercel。",
      "心情日记与对话共享同一份状态，作为下一轮 Prompt 的上下文。",
    ],
    outcomes: [
      "可访问的线上 Demo，四种性格与心情日记主线可完整走通。",
      "一份完整的 DESIGN.md 设计系统文档。",
    ],
    boundaries: [
      "这是一次产品尝试，不是心理医疗产品，不做诊断也不替代专业帮助。",
      "没有真实用户量、留存或情绪改善效果的证据。",
    ],
    tech: ["React", "DeepSeek", "Vercel Serverless", "设计系统"],
    evidence: [
      {
        label: "线上体验",
        href: "https://pet-companion-six.vercel.app/",
        kind: "live",
      },
    ],
  },
  {
    id: "ready2apply",
    name: "Ready2Apply",
    tagline: "本地化 LLM 求职准备工作台",
    dateTime: "2026-05",
    dateLabel: "2026 · 05",
    highlight: true,
    status: "开源 · 全栈",
    summary:
      "把「我够不够格投这个岗位」拆成可以逐条检查的东西：解析 JD、盘点自己的项目、找出差距、给出补齐计划，再判断投递就绪度。",
    problem:
      "求职者面对一份 JD 时，通常只有模糊的自我感觉。真正需要的是：这份 JD 到底要什么、我手上的项目能对上哪几条、差的那几条要花多久补、现在投出去合不合适。",
    role:
      "独立完成。产品定义、后端架构、LLM 调用层、前端页面与工程质量门禁。",
    decisions: [
      "自研 LLMClient 而不是直接裸调接口：Prompt 用 SHA256 版本化，配合缓存、tenacity 退避重试与线程池并发，让每次输出都能追溯到具体 Prompt 版本。",
      "反虚构护栏：模型不能凭空生成用户没有的经历；任务层再加一层防自我欺骗校验，避免「就绪度」被模型自己抬高。",
      "领域拆分为 jd / project / gap / plan / resume / interview / readiness 七个模块，每个模块产出结构化 JSON，而不是一大段文字。",
      "长任务用 SSE 流式反馈进度，让用户看得到过程而不是盯着转圈。",
      "用 185 条自采真实 JD（3 城 × 12 关键词）校准归类口径，而不是凭想象定义标签体系。",
    ],
    process: [
      "自建 51job 爬虫采集 JD，做 embedding 后用于口径校准。",
      "FastAPI 后端 + SQLAlchemy/Alembic 迁移，配 event_bus 与 task_runner 支撑异步任务。",
      "React + TypeScript + Vite 前端 8 个页面，配套设计系统。",
      "CI 门禁：后端 100% 覆盖率，Alembic 迁移做回滚测试。",
    ],
    outcomes: [
      "可运行的全栈产品：后端约 4.6k 行、6 个 Prompt 模板、53 个测试文件，前端 8 页。",
      "后端测试覆盖率 100% 作为合并门禁；Alembic 迁移全部通过回滚测试。",
      "185 条真实 JD 支撑的归类口径。",
    ],
    boundaries: [
      "覆盖率 100% 是工程门禁，不等于产品逻辑必然正确。",
      "目前是本地运行的工作台，没有公网多用户运营记录，也没有求职结果转化数据。",
    ],
    tech: [
      "FastAPI",
      "SQLAlchemy",
      "Alembic",
      "React",
      "TypeScript",
      "DeepSeek",
      "SSE",
    ],
    evidence: [
      {
        label: "GitHub 仓库",
        href: "https://github.com/megg-ops/Ready2Apply",
        kind: "repo",
      },
    ],
  },
  {
    id: "solopr",
    name: "SoloPR",
    tagline: "一人公司的品牌运营 Agent",
    dateTime: "2026-07",
    dateLabel: "2026 · 07",
    highlight: true,
    status: "赛道优胜奖",
    summary:
      "技术型一人公司没有公关部。SoloPR 把「搜集素材 → 定策略 → 写内容 → 审风险」拆成四个有职责边界的 Agent，让一个人也能稳定地对外发声。",
    problem:
      "独立开发者要对外表达，却既没有时间也没有品控。用 LLM 直接写稿的问题是：它会编数字、会踩禁语、会把没有来源的说法写得很确信。",
    role: "独立完成。角色拆分、状态机设计、硬规则体系与 MCP 工具封装。",
    decisions: [
      "四个 Agent 顺序编排：scout（找素材）→ strategist（定策略）→ director（写内容）→ auditor（审风险），每个角色只拿它该拿的上下文。",
      "硬规则优先于 LLM：禁语、无来源数字、风险表达由确定性规则拦截，不交给模型自觉。",
      "证据约束防幻觉：内容中的事实必须能指回 ingest 到的素材，指不回就不写。",
      "GitHub ingest 走白名单，并对抓取内容做密钥正则扫描后丢弃，避免把凭据写进对外稿件。",
      "封装成 MCP Server 而不是一个封闭应用，让它能接进已有的 Agent 工作流。",
    ],
    process: [
      "7 态状态机驱动四个 Agent 的顺序流转与失败回退。",
      "FastAPI + FastMCP 提供 6 个 MCP 工具接口。",
      "Docker 化部署配置。",
    ],
    outcomes: [
      "FC-OPC Next iBot 大赛「一人公司效率提升 Agent」赛道**优胜奖**。",
      "可运行的 4-Agent 编排 Demo，含 PRODUCT.md、MVP-SPEC 与设计系统文档。",
    ],
    boundaries: [
      "获奖对应的是比赛 Demo，不是长期运营中的品牌账号。",
      "没有真实企业客户使用记录或传播效果数据。",
      "本页沿用不展示该项目仓库入口的口径。",
    ],
    tech: ["FastAPI", "FastMCP", "Python", "多 Agent 编排", "Docker"],
    evidence: [],
  },
  {
    id: "jinnang-l10n",
    name: "锦囊 L10N",
    tagline: "跨境商品本地化素材生成",
    dateTime: "2026-08",
    dateLabel: "2026 · 08",
    highlight: true,
    status: "千问比赛 23 / 429",
    summary:
      "输入一份中文商品资料，输出 11 个文件：英语、韩语、巴西葡语三份文案，主图 1 张、详情图 5 张、视频 1 份、策略说明 1 份。配一个能看见全过程的工作台。",
    problem:
      "跨境卖家上架一个商品，要为每个市场重做一整套素材。难点不在翻译，而在于既要贴合当地表达，又绝不能改动商品的客观事实——尺寸、材质、认证写错就是事故。",
    role:
      "独立完成。素材交付标准定义、七阶段流水线、事实约束机制、工作台与评测迭代。",
    decisions: [
      "先定义「完整素材包」到底是哪 11 个文件，再倒推流水线，而不是让模型自由发挥。",
      "类目与属性不让模型自由填：结合属性字典与完整类目树关键词检索生成候选，模型只能从候选中选；属性名与枚举值再经代码校验，不合法直接丢弃。",
      "源信息与映射结果组成「事实块」注入 Prompt，明确禁止虚构尺寸、认证、材质，并附机器可读字段供后续校验。",
      "本地化不只是换语言：按美国、韩国、巴西分别设定语言风格、尺码与单位表达。",
      "长任务必须可见：工作台用 SSE 输出日志与阶段进度，用户能看到卡在哪一步。",
      "全链路降级：文本配置四模型逐级回退、空正文判失败、连续失败熔断；视频优先图生视频，失败切文生视频；6 图线程池并发，缺图再补一轮。",
    ],
    process: [
      "七阶段：数据解析 → 类目与属性映射 → 实拍视觉分析 → 三语文案 → 图片 → 视频 → 策略说明。",
      "视觉模型先分析实拍图，再把结果作为生图上下文。",
      "FastAPI + 原生 HTML/CSS/JS 工作台：注册登录、游客看示范案例、选品、单并发排队、SSE 日志、三语对照、图片视频预览、买家视角详情页、历史运行与补图。",
      "运行按 owner 区分访问权限，示范案例只读共享；密钥由用户当次输入，经内存队列注入子进程环境，归档元信息不含该字段。",
      "依据评测反馈多轮迭代，并逐次检查分数变化的归因是否成立。",
    ],
    outcomes: [
      "千问「一键出海：商品素材全自动生成」比赛**最终 23 / 429**。",
      "可运行的 Agent 流水线 + 本地工作台，含 Dockerfile、Compose 与部署指南。",
      "本地记录：两件真实商品各产出 11/11 产物、单次约 7 分钟。",
    ],
    boundaries: [
      "上面的 11/11 与 7 分钟是历史小样本记录，不是平均耗时或稳定达成率。",
      "同一版本包记录过 87.26 / 86.97 / 82.68 三次评分，分数存在波动；不把提升全部归因于某一项优化，也不把本地推测写成官方结论。",
      "Agent 允许局部生成失败后继续执行，退出码成功不等于 11 个产物全部完整合格。",
      "密钥经子进程环境隔离，属于进程隔离，不等于安全沙箱。",
      "当前形态是本地工作台与容器化部署配置，公网未上线；没有商家使用量、提效或营收证据。",
    ],
    tech: [
      "FastAPI",
      "多模型回退",
      "视觉模型",
      "图生视频",
      "SSE",
      "Docker",
    ],
    evidence: [],
  },
  {
    id: "sisters-festival",
    name: "她的姊妹节",
    tagline: "AI 文化叙事游戏 Demo",
    dateTime: "2026-08",
    dateLabel: "2026 · 08",
    highlight: false,
    status: "贵客松参赛 Demo",
    summary:
      "陪一位贵州台江施洞的苗族女孩过完姊妹节的一天：做姊妹饭、穿盛装、向外婆打听物件的来历，再去歌场赠饭。AI 只负责有资料边界的问答。",
    problem:
      "地方节俗常被讲成一段介绍文字，读完就忘。想让人真的理解一个节日，得让他亲手参与其中的一件件小事——而不是看一段科普。",
    role: "独立完成。选题、玩法设计、资料整理与边界定义、实现与部署。",
    decisions: [
      "只做一地一节，把深度做够，而不是泛泛讲「苗族文化」。",
      "把文化知识转成玩法节点：做饭分段、盛装分层换装、物件做成可点击热点，知识跟着动作出现。",
      "AI 只放在「问外婆」这一个交互节点：按 objectId 选定知识条目，把事实、边界与问题一起给模型，回答附带该条目来源。",
      "离线预设保障主线完整：服务端 5800ms 超时，失败或无凭据时返回 offline 状态与预设回答；前端识别 file:// 直接跳过网络。现场断网也能完整演示。",
      "文化资料逐条记录公开来源与「待当地复核」状态；Prompt 要求无依据时承认不确定。",
    ],
    process: [
      "主线：家屋探索 → 姊妹饭制作 → 盛装穿戴 → 向外婆询问物件 → 歌场赠饭 → 生成与选择关联的记忆卡。",
      "单文件原生 HTML/CSS/JS 实现任务状态、分段做饭、分层换装、物件热点、对话与结尾。",
      "Vercel Serverless Function 转发 OpenAI 兼容模型调用。",
      "配套 PRD、实现版剧情、设计系统、素材清单与演示视频。",
    ],
    outcomes: [
      "可游玩的完整 Demo，已部署上线。",
      "多彩贵州·贵客松「开放创新」赛道参赛作品；项目文档声明在赛事 48 小时窗口内从零完成。",
      "结构化的文化资料库，每条标注公开来源与复核状态。",
    ],
    boundaries: [
      "参赛**未获奖**，不列入获奖经历。",
      "问答是按物件选择结构化资料后提供上下文，**没有向量检索**，不是向量 RAG 系统。",
      "回答附的是所选知识条目的来源，并未实现逐句证据验证；不能说「彻底杜绝幻觉」。",
      "对歌中的回声意象是预置的当代文案，不是实时生成的传统苗歌。",
      "公开资料整理不等于已通过当地文化专家或传承人审核。",
      "没有玩家数量、留存或文化传播效果数据。",
    ],
    tech: [
      "原生 HTML/CSS/JS",
      "Vercel Serverless",
      "qwen3-max",
      "离线降级",
    ],
    evidence: [
      {
        label: "线上试玩",
        href: "https://her-sisters-festival.vercel.app/",
        kind: "live",
      },
      {
        label: "GitHub 仓库",
        href: "https://github.com/megg-ops/her-sisters-festival",
        kind: "repo",
      },
    ],
  },
  {
    id: "repoloop",
    name: "RepoLoop",
    tagline: "开源维护协作方案 · Mock 验证",
    dateTime: "2026-08",
    dateLabel: "2026 · 08",
    highlight: false,
    status: "方案 / Mock 案例",
    summary:
      "给开源维护设计一套可检查的协作规则：把分诊、修复、独立验证和下游沟通拆成有职责边界的角色，再用 Mock 工具网关演示权限、状态与主张追溯怎么落地。",
    problem:
      "开源维护的断裂点不在于没人写代码，而在于「谁改的、谁验的、改动会影响谁」说不清楚。多 Agent 如果不划权限，只会把这件事变得更糊。",
    role: "独立完成。角色与权限契约、维护闭环设计、Mock 工具网关实现。",
    decisions: [
      "修复与验证必须分工：提修复的角色不能给自己盖章通过。",
      "用工具权限约束行动，而不是靠提示词请求模型守规矩——写操作依权限表校验，工具层根本不提供 merge / publish / delete 接口。",
      "参考答案路径直接返回 403，堵住绕过流程直接读预埋答案的路。",
      "ClaimTrace 抓手检查声明中的 PR / commit 是否真实存在，并列出无映射的主张。",
      "把维护者、下游使用者、潜在企业付费方分别定义，发布沟通围绕变更影响与升级决策来写。",
    ],
    process: [
      "维护闭环：Issue 分诊 → 根因定位 → 修复提案 → 独立验证 → 发布提案与人工批准 → 开发者/用户沟通 → 复盘。",
      "8 个 Worker 的职责/权限/交互契约，12 项 Skill 契约与 Team 调度方案。",
      "Python 标准库实现的 Mock 网关：29 个工具接口分属 10 个命名空间，模拟 Issue、代码、Git 历史、PR、CI、发布草稿、公告、文档、知识库与共享阶段状态；支持幂等键重放与状态版本冲突响应。",
      "随包 27 项 smoke 检查，覆盖接口场景、权限、幂等、模拟 CI、主张映射、状态冲突与审计。",
    ],
    outcomes: [
      "完整的方案与角色契约文档、29 接口 Mock 网关、27 项 smoke 检查。",
      "GOAI 世界人工智能开源大赛「新智基座」赛道**前 300**。",
    ],
    boundaries: [
      "前 300 **未入围复赛**，不是奖项，也不能写成「复赛项目」。",
      "网关跑的是 fixture 与内存状态：ci_trigger 依据补丁字符串生成模拟测试结果，**没有执行真实 CI 或 pytest**。",
      "X-Agent-Token 在 Mock 中只是角色名，不是生产级身份认证。",
      "ClaimTrace 检查的是引用是否存在，不等于验证每句主张确实被该 PR 内容支持。",
      "没有真实仓库维护、真实 PR 修复或真实发布的运行记录；27 项检查 README 记录历史全过，本轮未重跑。",
    ],
    tech: [
      "Python 标准库",
      "多 Agent 角色契约",
      "权限模型",
      "Mock 工具网关",
    ],
    evidence: [],
  },
];

export const PROJECT_MAP = new Map(PROJECTS.map((p) => [p.id, p]));
