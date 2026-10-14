# Commerce Atelier

面向 Codex 的电商视觉制作 skill：从商品资料和实物参考图出发，完成内容规划、整套视觉分镜、设计审查、提示词编译、逐图生成与复查，交付商品主图和连续详情套图。

支持通用电商、淘宝 / 天猫、拼多多、小红书和抖音电商方向。平台方向会影响卖点表达、构图和文字层级；具体上架规则需要另行核对。

## 案例展示

### 通用电商 · 阿玛尼寄情 EDT

**2 张主图 + 4 张详情图**。以海洋清新、香调层次、日常使用场景和产品规格串起购买信息。画面使用海岸岩石、水光和柑橘花木，中文衬线标题配合简洁正文。

![阿玛尼寄情 EDT 通用电商套图预览](examples/armani-acqua-di-gio/preview.webp)

| 主图 | 详情图 |
| --- | --- |
| [01 · 海洋清新](examples/armani-acqua-di-gio/images/hero-01.png) | [01 · 清新有海意](examples/armani-acqua-di-gio/images/detail-01.png) |
| [02 · 香调层次](examples/armani-acqua-di-gio/images/hero-02.png) | [02 · 三段香气](examples/armani-acqua-di-gio/images/detail-02.png) |
| | [03 · 日常适用场景](examples/armani-acqua-di-gio/images/detail-03.png) |
| | [04 · 产品规格](examples/armani-acqua-di-gio/images/detail-04.png) |

### 拼多多 · Biodance Hydro Cera-Nol

**2 张主图 + 3 张详情图**。主图分别呈现补水修护定位和水凝胶质地；详情依次说明核心成分、日间 / 隔夜用法与规格。冰川蓝包装、米白背景和深蓝大字形成统一视觉，兼顾手机端快速阅读。

![Biodance Hydro Cera-Nol 拼多多套图预览](examples/biodance-pinduoduo/preview.webp)

| 主图 | 详情图 |
| --- | --- |
| [01 · 补水修护](examples/biodance-pinduoduo/images/hero-01.png) | [01 · 核心成分](examples/biodance-pinduoduo/images/detail-01.png) |
| [02 · 水凝胶质地](examples/biodance-pinduoduo/images/hero-02.png) | [02 · 使用方法](examples/biodance-pinduoduo/images/detail-02.png) |
| | [03 · 规格参数](examples/biodance-pinduoduo/images/detail-03.png) |

主图原文件为 **1254 × 1254（1:1）**，详情原文件为 **1086 × 1448（3:4）**。预览仅用于展示，点击上方链接查看原始 PNG。

以上为已完成的精简套图案例。当前随包校验器的常规范围为 **3–10 张主图、4–20 张详情图**，默认 **4 + 6**。少于该范围的请求需要显式定义对应的运行合同；案例展示不代表原版校验器已直接支持 2 + 3 或 2 + 4。

## 安装与使用

将本仓库克隆到本地技能目录下名为 `commerce-atelier` 的文件夹，保持 `SKILL.md`、`agents/`、`references/`、`scripts/` 的相对位置不变。

macOS / Linux：

```bash
git clone https://github.com/DancingCircles/commerce-atelier.git ~/.codex/skills/commerce-atelier
```

Windows PowerShell：

```powershell
git clone https://github.com/DancingCircles/commerce-atelier.git "$env:USERPROFILE\.codex\skills\commerce-atelier"
```

如果目标目录已经安装了同名 skill，先保留已有版本，再选择新目录进行对比，避免覆盖个人修改。设置了自定义技能目录时，使用该目录。

在支持原生 `image_gen` 工具的 Codex 环境中，上传商品实物图和已知参数，再明确平台和图片数量：

```text
使用 $commerce-atelier，为这款商品制作拼多多套图，4 张主图 + 6 张详情图。
附件是实物正面图，以下是已确认的规格和使用方法：……
```

商品身份图必需；风格参考可选，最多两张。用户已明确平台时不会重复询问。图片生成使用宿主原生工具，校验和编译在本地完成，无需另外配置模型 API Key。

## 工作方式

```text
平台与商品核对
  → 内容策略
  → 完整整套分镜与文字排版
  → 本地校验
  → 独立设计审查
  → 编译逐图提示词
  → 首图生成与检查
  → 逐图生成、手机预览与差异检查
  → 前两张实图反馈后续分镜
  → 整套复查与交付
```

- 商品身份图与风格图分开使用，避免把参考中的商品、文字或价格带进新画面。
- 先完成整套分镜，再生成首图；每张有具体构图、机位、材质、文案、排版和信息职责。
- 主图采用 1:1，详情采用 3:4；最后一张详情通常呈现已知规格。
- 使用随包编译器产生完整提示词，并保存事实、审查、图片版本与用户决定的运行记录。
- 每张检查信息覆盖、手机可读性和与前图的实际差异；详情同时检查相邻边缘衔接。
- 不编造价格、促销、参数或功效证据。成图发现具体问题后先报告，图片修改由用户决定。
- 整套制作不自动授予上架、发布或覆盖已有图片的权限。

## 文件结构

```text
commerce-atelier/
├── SKILL.md                 技能入口与阶段路由
├── agents/openai.yaml       名称、描述与默认调用提示
├── references/              平台方向、阶段指令与数据合同
├── scripts/
│   ├── pipeline.cjs         校验、审查应用、提示词编译与覆盖检查
│   ├── workflow-core.cjs    随包核心逻辑与 schema 库
│   └── reference-edge.py    详情边缘参考裁切
└── examples/                两组完成案例、预览和原始图片
```

本地脚本需要 Node.js；可选边缘裁切脚本需要 Python 和 Pillow。核心 JavaScript 已包含校验依赖，无需 `npm install`。脚本不会独立完成图像生成，实际生图能力由宿主提供。

详细执行规则见 [SKILL.md](SKILL.md)，运行记录字段见 [workflow-contract.md](references/workflow-contract.md)。

## 许可与素材说明

技能代码与说明采用 [MIT 许可证](LICENSE)。随包第三方代码许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

案例图片用于展示生成效果，不适用本仓库的代码许可。图片中的品牌名称、标识及产品包装属于各自权利人；展示不代表品牌官方合作、认可或实际上架效果，也不授予相关商标或包装的使用许可。
