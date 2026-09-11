/**
 * 项目结构图数据。
 *
 * 事实来源：本文件每个节点的文字都来自 `projects.ts` 里已确认的
 * `features` / `tradeoffs` / `tech`，只做**结构还原**，不引入新事实。
 *
 * 口径约束：
 * - 节点只写内容里明确写过的环节；内容没说的顺序、模块、依赖一律不画。
 * - 分支（虚线）只用于内容里明确写了「拦下 / 丢弃 / 退回 / 兜底」的地方，
 *   分支终点用 kind "reject"，判断点本身用 "gate"。
 * - 图是叙述的可视化，不是系统架构文档；`caption` 要说清这一点的边界。
 *
 * ⚠️ 待用户复核：结构由文案推导而来，各环节的先后与依赖需要 Freya 逐个确认。
 */

export type FlowKind = "input" | "step" | "gate" | "reject" | "store" | "output";

export interface FlowNode {
  id: string;
  /** 每行一个元素，SVG 内手动换行 */
  label: readonly string[];
  col: number;
  row: number;
  kind?: FlowKind;
  /** 主链路上的序号；旁支与出入口不编号 */
  step?: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  /** branch = 被拦下 / 退回 / 兜底的方向，画成虚线 */
  kind?: "branch";
}

export interface ProjectFlow {
  caption: string;
  /** SVG 的无障碍描述 */
  summary: string;
  /** 等价文本，读屏按这个顺序读 */
  steps: readonly string[];
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
}

export const PROJECT_FLOWS: Record<string, ProjectFlow> = {
  ready2apply: {
    caption: "岗位要求与项目证据逐条对齐；现版取消数字评分，改为检查能力证据、简历与模拟面试是否全部就绪，并保留具体阻塞原因。",
    summary: "从 JD 与项目证据出发，判断覆盖情况、拆解任务，最后检查能力证据、简历和模拟面试三项就绪状态。",
    steps: [
      "输入：JD 岗位描述、你本地的项目",
      "1 拆成 P0–P3 四档，逐条匹配项目与个人条件",
      "2 判断已覆盖、薄弱、可挖掘和缺失，保留证据与理由；标签口径由 185 条真实 JD 校准",
      "3 把缺口按优先级拆成任务清单，完成后重新扫描验收证据",
      "4 三项检查：能力证据、简历与模拟面试全部就绪；P2/P3 不阻止投递",
      "三条齐了才亮「可以投了」；未达标则回到任务清单",
    ],
    nodes: [
      { id: "jd", label: ["JD 岗位描述"], col: 0, row: 0, kind: "input" },
      { id: "repo", label: ["你本地的项目"], col: 1, row: 0, kind: "input" },
      { id: "match", label: ["逐条匹配", "岗位要求与真实证据"], col: 0, row: 1, step: 1 },
      { id: "score", label: ["证据覆盖状态", "判断理由可追溯"], col: 0, row: 2, step: 2 },
      { id: "corpus", label: ["185 条真实 JD", "校准标签口径"], col: 1, row: 2, kind: "store" },
      { id: "tasks", label: ["缺口拆成任务清单", "按优先级排"], col: 0, row: 3, step: 3 },
      { id: "accept", label: ["完成后重新扫描", "证据不足则重开任务"], col: 1, row: 3, kind: "store" },
      { id: "gate", label: ["三项就绪检查", "能力证据 / 简历 / 面试"], col: 0, row: 4, kind: "gate", step: 4 },
      { id: "back", label: ["未达标：回到清单"], col: 1, row: 4, kind: "reject" },
      { id: "go", label: ["可以投了"], col: 0, row: 5, kind: "output" },
    ],
    edges: [
      { from: "jd", to: "match" },
      { from: "repo", to: "match" },
      { from: "match", to: "score" },
      { from: "corpus", to: "score" },
      { from: "score", to: "tasks" },
      { from: "accept", to: "tasks" },
      { from: "tasks", to: "gate" },
      { from: "gate", to: "back", kind: "branch", label: "未达标" },
      { from: "gate", to: "go", label: "三条齐" },
    ],
  },

  "empirical-paper": {
    caption: "思路、数据与框架由人给出，六个阶段各自只加载用得上的东西；歧义处停下来问人，论文里的实证数字只认结果文件这一个出处。",
    summary: "人给定研究问题后，流程分六段依次运行，歧义处交还给人，最后交出论文与可复现的产物。",
    steps: [
      "输入：人给出研究问题、数据处理方式与框架",
      "1 数据审计",
      "2 模型选择；主分析表、关键变量、表怎么连出现歧义时停下来问人",
      "3 代码分析",
      "4 论文写作；实证数字统一取自结果文件，模型不许转述第二遍",
      "5 最终整合",
      "6 专家审查，交出机器可读的验收结论",
      "产出：论文、数据审计报告、可复现代码、结果表图",
    ],
    nodes: [
      { id: "human", label: ["人给出：研究问题", "数据处理 / 框架"], col: 0, row: 0, kind: "input" },
      { id: "audit", label: ["数据审计"], col: 0, row: 1, step: 1 },
      { id: "model", label: ["模型选择"], col: 0, row: 2, step: 2 },
      { id: "ask", label: ["歧义就停下问人", "不自己挑一个"], col: 1, row: 2, kind: "reject" },
      { id: "code", label: ["代码分析"], col: 0, row: 3, step: 3 },
      { id: "write", label: ["论文写作"], col: 0, row: 4, step: 4 },
      { id: "results", label: ["结果文件", "实证数字唯一出处"], col: 1, row: 4, kind: "store" },
      { id: "merge", label: ["最终整合"], col: 0, row: 5, step: 5 },
      { id: "review", label: ["专家审查"], col: 0, row: 6, step: 6 },
      { id: "gatefile", label: ["机器可读的", "验收结论"], col: 1, row: 6, kind: "store" },
      { id: "out", label: ["论文 · 审计报告", "代码 · 结果表图"], col: 0, row: 7, kind: "output" },
    ],
    edges: [
      { from: "human", to: "audit" },
      { from: "audit", to: "model" },
      { from: "model", to: "ask", kind: "branch", label: "有歧义" },
      { from: "model", to: "code" },
      { from: "code", to: "write" },
      { from: "results", to: "write", label: "取数" },
      { from: "write", to: "merge" },
      { from: "merge", to: "review" },
      { from: "review", to: "gatefile" },
      { from: "review", to: "out" },
    ],
  },

  chaiyu: {
    caption: "性格档案与记忆决定它怎么说话，心情日记写完存在本地，下一次对话时再回到上下文里——「它知道你昨天不太好」是从这条回路来的。",
    summary: "挑定性格后，互动、外出与对话共同构成陪伴，心情日记存入本地并回流到下一次对话。",
    steps: [
      "输入：挑一种性格并给它起名",
      "性格档案与记忆（名字、上次聊过什么）决定说话方式",
      "投喂、丢球、陪它趴一会儿，它有自己的饿与困",
      "户外模式牵着散步，换个地方说话",
      "对话由 DeepSeek 加人格化 system prompt 驱动",
      "心情日记写入浏览器本地存储，按档案隔离",
      "下一次对话读回日记：它知道你昨天不太好",
    ],
    nodes: [
      { id: "pick", label: ["挑一种性格 · 起名"], col: 0, row: 0, kind: "input" },
      { id: "persona", label: ["性格档案 + 记忆", "名字 / 上次聊过什么"], col: 0, row: 1, step: 1 },
      { id: "care", label: ["投喂 / 丢球 / 陪趴", "它有自己的饿和困"], col: 1, row: 1, step: 2 },
      { id: "talk", label: ["对话"], col: 0, row: 2, step: 3 },
      { id: "walk", label: ["户外模式", "牵着它换个地方说"], col: 1, row: 2, step: 4 },
      { id: "diary", label: ["心情日记"], col: 0, row: 3, step: 5 },
      { id: "store", label: ["浏览器本地存储", "按档案隔离"], col: 1, row: 3, kind: "store" },
      { id: "next", label: ["下一次对话", "它知道你昨天不太好"], col: 0, row: 4, kind: "output" },
    ],
    edges: [
      { from: "pick", to: "persona" },
      { from: "persona", to: "talk" },
      { from: "care", to: "talk" },
      { from: "walk", to: "talk" },
      { from: "talk", to: "diary" },
      { from: "diary", to: "store" },
      { from: "diary", to: "next", label: "回流" },
    ],
  },

  solopr: {
    caption: "四个角色按职责边界顺序跑完，密钥扫描与风险审查是确定性规则挡在模型前面；最后留一道人工终审，不做一键发布。",
    summary: "从公开仓库取素材，经选题、生成、风险审查与人工终审后才对外发布，硬规则可以拦下但模型不能放行。",
    steps: [
      "输入：公开仓库的 README、文档与提交记录",
      "1 素材采集；密钥扫描命中就把整段丢掉",
      "2 挑角度：比较几种传播角度后才落笔",
      "3 生成文案与配图，口径来自品牌档案的定位、语气与禁用词",
      "4 风险审查：逐句核对编造数字与踩线说法，指不回素材的句子直接删掉",
      "人工终审后才对外发布，不做一键发布",
    ],
    nodes: [
      { id: "repo", label: ["公开仓库", "README / 文档 / 提交"], col: 0, row: 0, kind: "input" },
      { id: "collect", label: ["素材采集"], col: 0, row: 1, step: 1 },
      { id: "secret", label: ["密钥扫描命中", "整段丢掉"], col: 1, row: 1, kind: "reject" },
      { id: "angle", label: ["挑角度", "比较几种传播角度"], col: 0, row: 2, step: 2 },
      { id: "write", label: ["生成文案与配图"], col: 0, row: 3, step: 3 },
      { id: "brand", label: ["品牌档案", "定位 / 语气 / 禁用词"], col: 1, row: 3, kind: "store" },
      { id: "risk", label: ["风险审查", "硬规则前置"], col: 0, row: 4, kind: "gate", step: 4 },
      { id: "drop", label: ["无来源 / 踩禁语", "整句删掉"], col: 1, row: 4, kind: "reject" },
      { id: "human", label: ["人工终审"], col: 0, row: 5 },
      { id: "publish", label: ["对外发布"], col: 0, row: 6, kind: "output" },
    ],
    edges: [
      { from: "repo", to: "collect" },
      { from: "collect", to: "secret", kind: "branch", label: "命中" },
      { from: "collect", to: "angle" },
      { from: "angle", to: "write" },
      { from: "brand", to: "write", label: "口径" },
      { from: "write", to: "risk" },
      { from: "risk", to: "drop", kind: "branch", label: "不过" },
      { from: "risk", to: "human", label: "通过" },
      { from: "human", to: "publish" },
    ],
  },

  "jinnang-l10n": {
    caption: "客观事实先打包成「事实块」跟着走全程，尺寸、材质、认证禁止改写；类目属性只能从检索出的合法候选里选，代码再校验一遍，对不上就丢掉重来。",
    summary: "一份中文资料经市场映射、事实块封装、属性校验与视觉分析后，生成三语文案与图片视频共 11 个文件。",
    steps: [
      "输入：一份中文商品资料",
      "1 按市场映射：美国用英寸、韩国用厘米、巴西葡语另一套表达",
      "2 打包成事实块：尺寸、材质、认证禁止改写",
      "3 类目属性先检索出合法候选交给模型挑",
      "4 代码校验属性，不合法就丢掉重来",
      "5 视觉模型先分析实拍照片，作为后续生图依据",
      "6 生成三语文案、主图、五张详情图与视频，四模型逐级回退并带熔断",
      "产出：11 个文件与一份策略说明",
    ],
    nodes: [
      { id: "src", label: ["一份中文商品资料"], col: 0, row: 0, kind: "input" },
      { id: "map", label: ["按市场映射", "语言 / 尺码 / 单位"], col: 0, row: 1, step: 1 },
      { id: "market", label: ["美国 in · 韩国 cm", "巴西葡语"], col: 1, row: 1, kind: "store" },
      { id: "facts", label: ["打包成事实块", "客观事实原样不动"], col: 0, row: 2, step: 2 },
      { id: "attr", label: ["类目属性", "先检索合法候选"], col: 0, row: 3, step: 3 },
      { id: "check", label: ["代码校验属性"], col: 0, row: 4, kind: "gate", step: 4 },
      { id: "redo", label: ["不合法：丢掉重来"], col: 1, row: 4, kind: "reject" },
      { id: "vision", label: ["视觉模型", "先分析实拍照片"], col: 0, row: 5, step: 5 },
      { id: "gen", label: ["生成三语文案", "主图 / 详情图 / 视频"], col: 0, row: 6, step: 6 },
      { id: "fallback", label: ["四模型逐级回退", "熔断与时间预算"], col: 1, row: 6, kind: "store" },
      { id: "out", label: ["11 个文件 + 策略说明"], col: 0, row: 7, kind: "output" },
    ],
    edges: [
      { from: "src", to: "map" },
      { from: "market", to: "map" },
      { from: "map", to: "facts" },
      { from: "facts", to: "attr" },
      { from: "attr", to: "check" },
      { from: "check", to: "redo", kind: "branch", label: "对不上" },
      { from: "check", to: "vision", label: "合法" },
      { from: "vision", to: "gen" },
      { from: "fallback", to: "gen" },
      { from: "gen", to: "out" },
    ],
  },

  "sisters-festival": {
    caption: "四个章节顺着过一次节，AI 只放在外婆身上、且必须指回 knowledge.json 里的资料；服务端超时或没有凭据时走离线预设——这是主线的一部分，不是降级方案。",
    summary: "玩家依次做姊妹饭、穿盛装、问外婆、去歌场赠饭，问答受资料边界约束并有离线预设兜底。",
    steps: [
      "输入：进入台江施洞的姊妹节",
      "1 做一顿姊妹饭：上山采染饭花，把糯米染成五色",
      "2 穿一身盛装：从里到外一层层穿戴，穿到哪件讲到哪件",
      "3 问外婆：屋里的老物件都能点开问，按 objectId 从 knowledge.json 取资料",
      "4 由 qwen3-max 作答，并说清这段话出自哪份资料；超时或无凭据时走离线预设",
      "5 去歌场赠饭，按这一路的选择留下一张记忆卡",
    ],
    nodes: [
      { id: "enter", label: ["进入台江施洞", "的姊妹节"], col: 0, row: 0, kind: "input" },
      { id: "cook", label: ["做一顿姊妹饭", "采花 / 染五色 / 蒸"], col: 0, row: 1, step: 1 },
      { id: "dress", label: ["穿一身盛装", "一层层穿戴"], col: 0, row: 2, step: 2 },
      { id: "ask", label: ["问外婆", "点开屋里的老物件"], col: 0, row: 3, step: 3 },
      { id: "kb", label: ["knowledge.json", "按 objectId 取资料"], col: 1, row: 3, kind: "store" },
      { id: "llm", label: ["qwen3-max 作答", "并说清出自哪份资料"], col: 0, row: 4, step: 4 },
      { id: "offline", label: ["超时 / 无凭据", "走离线预设"], col: 1, row: 4, kind: "reject" },
      { id: "give", label: ["去歌场赠饭"], col: 0, row: 5, step: 5 },
      { id: "card", label: ["记忆卡", "按你这一路的选择"], col: 0, row: 6, kind: "output" },
    ],
    edges: [
      { from: "enter", to: "cook" },
      { from: "cook", to: "dress" },
      { from: "dress", to: "ask" },
      { from: "kb", to: "ask", label: "资料边界" },
      { from: "ask", to: "llm" },
      { from: "llm", to: "offline", kind: "branch", label: "兜底" },
      { from: "llm", to: "give" },
      { from: "give", to: "card" },
    ],
  },
};
