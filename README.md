# freya-portfolio

我的个人作品集网站。

## 本地运行

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 类型检查 + 构建 + postbuild
npm run preview    # 预览构建产物
```

## QA 套件

```bash
npm run qa           # 日光整站
npm run qa:layout    # 版式几何
npm run qa:showcase  # 项目展示区 / 详情弹层
npm run qa:stars     # 星夜模式
npm run qa:subpath   # 子路径部署（需 BASE_PATH 构建）
npm run qa:perf      # 性能
```

套件通过 CDP 驱动真实浏览器，默认访问 `http://127.0.0.1:4319`（vite preview），可用 `QA_BASE` 覆盖。

## 目录结构

| 路径 | 内容 |
| --- | --- |
| `src/` | 站点源码（React + Vite，场景、页面、内容模块） |
| `public/` | 原样部署的静态资产（图片、字体） |
| `docs/` | 项目文档：`PRODUCT.md`（产品原则）、`PROGRESS.md`(进度日志)、`DEPLOYMENT.md`（部署）、`VISUAL-MODELS.md`（模型额度） |
| `docs/content/` | 站点文案事实来源（`content-anon.md`、`content-draft-260907.md`） |
| `assets/` | 生成素材工作区：四季参考图、人物设计、提示词与生成记录 |
| `prototypes/` | 保留的原型与方案效果图 |
| `scripts/` | 构建、QA 与资产生成脚本 |

内容口径约束见 `src/content/projects.ts` 文件头注释。
