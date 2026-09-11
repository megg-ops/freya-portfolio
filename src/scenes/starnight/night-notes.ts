/**
 * 星夜内容。事实来源：`website/docs/content/content-draft-260907.md` §四「星空页 /stars」（2026-09-07 用户定稿）。
 *
 * 口径约束：
 * - 星空讲过程与经历，不重复日光模式的项目成品清单。
 * - 名次与结果按定稿原文，不上调、不补写未确认的奖项。
 * - `body` 为用户确认过的原文，不得为了排版改写。
 */
export interface StarNote {
  id: string;
  /** 所属星座名，短笺标注的前半 */
  category: string;
  title: string;
  /** 展示用日期，短笺标注的后半 */
  time: string;
  /** machine-readable，用于 <time dateTime> */
  dateTime: string;
  /** 赛事 / 项目场合 */
  venue: string;
  body: string;
}

export interface Galaxy {
  id: string;
  name: string;
  /** 星座导语，定稿原文 */
  subtitle: string;
  color: string;
  notes: readonly StarNote[];
}

export const GALAXIES: readonly Galaxy[] = [
  {
    id: "sprint",
    name: "限时交付",
    subtitle: "三次限时交付：单日、两天、48 小时。",
    color: "#d8e9fa",
    notes: [
      {
        id: "one-day",
        category: "限时交付",
        title: "一天做完一件事",
        time: "2026.06.14",
        dateTime: "2026-06-14",
        venue: "lev0 长沙一人黑客松",
        body: "单日黑客松，做了个把旅行截图整理成地图的小工具。全程没用大模型，纯规则实现——这也是后来把它推翻、重做成截图知识库的原因。",
      },
      {
        id: "two-days",
        category: "限时交付",
        title: "两天，一只柴犬",
        time: "2026.05",
        dateTime: "2026-05",
        venue: "抖音 AI 创变者计划黑客松 · 湖南大学站",
        body: "两天一夜，从设计系统一路写到 Vercel 上线，做了一只会陪人说话的 AI 柴犬。那套设计系统我一直留到现在。",
      },
      {
        id: "forty-eight-hours",
        category: "限时交付",
        title: "四十八小时的姊妹节",
        time: "2026.08",
        dateTime: "2026-08",
        venue: "多彩贵州 · 贵客松",
        body: "48 小时里做完一个苗族姊妹节的叙事游戏 Demo，AI 只负责有资料边界的问答。它是我目前证据最完整的可玩项目。",
      },
    ],
  },
  {
    id: "external",
    name: "对外验证",
    subtitle: "把作品放进外部的评价体系，接受一次不由自己定义的判断。",
    color: "#c3daca",
    notes: [
      {
        id: "solo-brand",
        category: "对外验证",
        title: "一个人的品牌部",
        time: "2026.07",
        dateTime: "2026-07",
        venue: "FC-OPC Next iBot 大赛",
        body: "把找素材、定策略、写内容、审风险拆成四个有职责边界的角色，硬规则优先于模型自觉。12 个参赛项目里排第一，拿到赛道优胜奖。",
      },
      {
        id: "three-markets",
        category: "对外验证",
        title: "把一份资料送去三个市场",
        time: "2026.08",
        dateTime: "2026-08",
        venue: "千问「一键出海」",
        body: "一份中文商品资料，产出三语文案与图片视频共 11 个文件。难的不是翻译，是绝不能改动尺寸、材质、认证这些客观事实。429 支队伍里最终第 23，入围 Top 30 专家评审。",
      },
      {
        id: "repoloop",
        category: "对外验证",
        title: "谁改的，谁验的",
        time: "2026.08",
        dateTime: "2026-08",
        venue: "GOAI 世界人工智能开源大赛",
        body: "给开源维护设计一套可检查的协作规则：提修复的角色不能给自己盖章通过。最终排在前 300。",
      },
    ],
  },
  {
    id: "teaching",
    name: "从学员到助教",
    subtitle: "四个月，从举手提问的人，走到答疑的人。",
    color: "#efdab7",
    notes: [
      {
        id: "classroom",
        category: "从学员到助教",
        title: "回到课堂",
        time: "2026.07",
        dateTime: "2026-07",
        venue: "观猹 AI 产品经理共学营",
        body: "报名参加，完整结业。那段时间在补的不是技术，是怎么把技术判断翻译成产品语言。",
      },
      {
        id: "client-brief",
        category: "从学员到助教",
        title: "甲方命题",
        time: "2026.08",
        dateTime: "2026-08",
        venue: "观猹 FDE 训练营",
        body: "训练营的甲方大作业：给一只保温杯批量出电商图。真正的难点在出图之前——价格、周期、禁用词、画布比例先过一遍，异常的直接停下来交给人。",
      },
      {
        id: "assistant",
        category: "从学员到助教",
        title: "从提问的人到答疑的人",
        time: "2026.08",
        dateTime: "2026-08",
        venue: "Datawhale AI 夏令营 · Agent Infra",
        body: "这一次不是学员，是 Agent Infra 方向的助教：群里答疑、评选优秀作业，最后拿到优秀助教。四个月前，我还在问同样的问题。",
      },
    ],
  },
];
