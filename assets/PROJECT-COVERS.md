# 项目封面素材来源

`public/assets/projects/` 下每张封面的出处。外部项目仓库一律只读，只复制选定的
单张公开图，不复制整仓、原始日志或运行产物目录。

| 输出文件 | 来源 | 处理 | 公开性判断 |
| --- | --- | --- | --- |
| `empirical-paper-cover.webp` | `website/assets/empirical-paper/cover-v2.webp` | 直接复制 | 本仓库自有素材，为网页展示专门生成 |
| `ready2apply-cover.webp` | `/home/freya/ready2apply-260411/homework/screenshots/仪表盘.png` | 缩到宽 ≤1280，转 WebP q82 | Freya 自己的产品界面，同款截图已在公开仓库 `megg-ops/Ready2Apply` |
| `chaiyu-cover.webp` | `/home/freya/pet-companion-260523/dist/pets/scheme_b_desktop_cropped.png` | 缩到宽 ≤1280，转 WebP q82 | Freya 自己的设计稿，柴愈 Demo 已公开上线 |
| `sisters-festival-cover.webp` | `/home/freya/gks-260828/项目封面-她的姊妹节.jpg` | 缩到宽 ≤1280，转 WebP q82 | 项目封面，仓库与 Demo 均已公开 |

## 暂未采用的候选

| 项目 | 候选素材 | 不用的原因 |
| --- | --- | --- |
| 锦囊 L10N | `workbench_runs/.../output/main_image.png` 等 | 是流水线产出的**真实商品**主图（服装实拍风），当作品集封面既看不出项目在做什么，又涉及商家商品的对外使用范围。`recent_projects_20260905.md` 也写明「示例图片的对外使用范围在选资产时核对」。需要 Freya 确认后才用 |
| 锦囊 L10N | `smoke_evidence/.../v12_frame_*.jpg` | 冒烟测试的视频帧，属内部验证证据，不适合公开展示 |
| SoloPR | `data/artifacts/*/card-01-cover.png` | 配色其实与网站高度一致，但该卡片的内容主题是 **Ready2Apply**，当 SoloPR 封面会让访客看混两个项目。若要用需换一张主题匹配的运行产物 |
| RepoLoop | — | 仓库内没有任何图片素材 |

以上三个项目在走马灯里走**排版式卡片**（大号引言 + 关键结论），不放占位图，也不拿
不相干的图充数。
