---
name: commerce-atelier
description: 根据商品实物图和已知参数，为通用电商、淘宝/天猫、拼多多、小红书或抖音电商制作商品主图与连续详情套图。用于需要整套内容规划、视觉分镜、原生图片生成及逐图复查的电商设计任务；不用于仅写商品文案或自动上架。
metadata:
  version: 2.0.0
---

# Commerce Atelier 2.0 · 完整电商视觉生产流程

执行六阶段电商视觉生产工作流，不能用简短 prompt 代替设计稿。随包 `scripts/workflow-core.cjs` 提供完整 schema、业务校验、排版校验、局部设计审查和提示词编译函数。无需外部应用、模型 API、第三方服务配置或 npm install。Node.js 仅用于本地确定性校验/编译，不承担生成；Node 不在 PATH 时用当前 Codex 提供的运行时发现工具，不能为了跳过校验改成口头“通过”。

## 不可省略的执行顺序

开始前必须明确目标电商平台。用户需求中已明确平台则记录实际消息，不重复问；未明确时先问：“这套图用于哪个平台：淘宝/天猫、拼多多、小红书、抖音电商，还是通用电商？”等待实际回答后才能开始商品规划、整套设计或生图。不得自行默认通用电商，也不得把沉默当选择。其他平台或多个平台不硬映射：先明确对应目标及分别制作或共享套图的范围，再建立有实际规则的运行记录。

必读 [平台方向与执行规则](references/platform-guidance.md)。平台参与商品叙事、文案、整套美术设计、独立审查和最终提示词；不是预览标签。将 `platform` 与脚本输出的 `platformContext` 作为 planner 和 designer 的输入，审查是否落实该方向。五项内置方向完整保留在 [平台方向表](references/platform-directions.json)。具体上架限制另核对官方规则或用户明确提供的规范，不把创意方向冒充平台合规保证。

**确认目标平台 → 原图核对与澄清 → 商品内容策略 → 完整整套设计稿 → 结构/业务/节奏校验 → 独立看图设计审查与局部修订 → 再校验 → 编译器生成逐图提示词 → 首图生成/复查 → 逐图生成/复查 → 前两张实图反馈后续未生成分镜 → 整套复查。**

先阅读 [执行与记录合同](references/workflow-contract.md) 和 [授权/错误恢复](references/decisions-and-recovery.md)。每阶段按下列路由加载各阶段完整指令，不只读本入口总结：

1. 商品理解/内容规划：读 [规划指令](references/planning-instructions.md)。查看真实商品原图；关键身份/SKU/用途/目标/参数冲突阻塞时返回 NEEDS_INPUT，具体问清，等待实际回答。不能边问关键产品需求边自行补卖点/生图。明确“按现有已知信息继续”只能省略未知，不能猜关键事实。默认4主图+6详情，V3 常规范围3–10主图、4–20详情；保留用户已确认3+4等合法数目。越界请求需明确另设范围，不能暗自减图或放松本 V3 合同。
2. 完整视觉设计：读 [设计指令](references/director-instructions.md)、[schema](references/schemas.json) 的 design。设计 ALL 指定图片，保存顶层完整 artDirection 与每张完整生产分镜/文字排版。先验证 plan，不能直接从用户参数表写生图提示词。
3. 独立设计审查：读 [审查指令](references/designReview-instructions.md)，以 reviewer 角色重新看商品和风格原图，再审整套稿。保存完整 inputDirection、review、局部改稿和输出摘要；问题解决后才进入生成。审查与设计是两个独立工作阶段，不得用设计者一句“方案合理”替代。
4. 生成前编译：运行本地 ready 校验和 compile。逐图 prompt 必须来自随包编译器，不许另写短提示词、漏字段、只用标题+背景+文案。调用工具前运行 generate 校验，出现任何 error 必须先解决或暂停反馈。
5. 逐图原生生成：用当前会话实际可用的原生 image_gen 工具，一图一任务；不选 DS/Artflow 等模型、不索要 Key、不切外部 API。身份图和风格图严格分角色。HERO 1:1，DETAIL 3:4；不能自行改成2:3。先做首图、保存实际版本、查看并给用户反馈，再推进。
6. 逐图/整套复查：读 [逐图审查指令](references/imageReview-instructions.md) 和 [实图反馈闭环](references/actual-output-loop.md)。每张当前版本必须实际查看，包含独立 distinctness 检查；承认相似不能仍记 PASS 或推迟到整套末尾。首图关口、HERO/DETAIL 各组前两张实图反馈关口、整套审查缺一不可。

不附带内置示例图库。风格参考仅使用用户提供的实际素材，最多两张；未提供时使用空列表，仍完成全套美术设计与审查。商品身份图始终必需。

## 完整排版规范

保留 textBlocks、typography、typesetting 及全部 schema/排版校验；每张至多6个文字块、具体分行/坐标/字号/字重/行距/对齐、字体关系与手机可读性约束仍生效。6块不等于最多6行参数；相关参数可组织在一块表格中，所有必要字段/数值/单位/尺码行列必须保留。同步模块 textBlockIndexes，不以截断数组/删参数绕过检查。

V3 允许纯摄影、没有强制标题，并允许局部改写或合并 AI 文案。保持这种创作自由，不额外放宽完整设计合同或用随意文案替代每张的信息职责。用户指定原文、商品标识、真实规格/步骤条件继续锁定。

## 能力与修改边界

- 分析、设计、生成和复查使用 Codex 原生能力，各阶段必须保存对应产物并完成检查。
- 成图发现具体问题必须先报告，记录 WAITING_REVIEW_DECISION；不自动修或重新生成。用户决定改某张、保留继续或暂停。已有明确修订授权按其范围执行，新版再次实际检查并反馈。整套制作授权不等于自动修所有图。
- 未渲染方案的结构修复、独立审查局部补丁可自动执行，不能改用户事实或删图。前两张实图提示重复时可修改未生成分镜，独立审查并重新编译；不能借此改已生成图片。需要改变用户信息要求时先问。

## 本地命令与必须产物

任务记录放当前工作区 `work/commerce-atelier/<runId>/run.json`，用户图片和报告放用户指定目录/工作区 outputs；禁止写进安装的 Skill 或覆盖旧图片。

```text
node <skill>/scripts/pipeline.cjs platform <run.json>
node <skill>/scripts/pipeline.cjs references <run.json>
node <skill>/scripts/pipeline.cjs check <run.json> --stage plan
node <skill>/scripts/pipeline.cjs check <run.json> --stage design
node <skill>/scripts/pipeline.cjs apply-review <run.json> --review <review-input.json> --out <audited-design.json>
node <skill>/scripts/pipeline.cjs check <run.json> --stage ready
node <skill>/scripts/pipeline.cjs compile <run.json> --out <compiled-prompts.json>
node <skill>/scripts/pipeline.cjs check <run.json> --stage generate --section <sectionId>
node <skill>/scripts/pipeline.cjs coverage <run.json> --section <sectionId>
node <skill>/scripts/pipeline.cjs adapt <run.json> --review <adaptive-review-input.json> --out <adaptive-design.json>
node <skill>/scripts/pipeline.cjs check <run.json> --stage delivery
```

把 compiler 的完整输出原样存入 run.compiledPrompts，不能手工改 frames.prompt。编译成功仅证明结构/业务规则通过，不证明真实设计审查、看图或用户授权发生；这些记录必须对应实际操作。缺运行时、素材或审查结论时暂停，不能伪造字段绕关。

图全部生成≠质量通过≠用户接受。保留结果、问题及用户决定；全部真实检查通过才 QUALITY_PASSED，用户接受问题图为 DELIVERED_WITH_FINDINGS，缺图为 PARTIAL。不自动上架或发布。

## 完成后的桌面整理

整套图片齐全、逐图和整套复查已反馈后，简单问一次：“需要我把这套图整理到桌面文件夹吗？”仍有问题时先说明问题，整理不代表质量通过或用户接受缺陷。此前已明确授权桌面整理则直接执行，不重复询问。未回答不能当作同意。

用户同意后，解析当前系统的实际桌面位置，创建以商品名称命名的独立文件夹；同名目录存在则用日期或序号创建新目录，不覆盖旧内容。复制当前交付版本，按设计顺序命名为主图01、主图02、详情01等并保留文件格式；不移动或删除原文件，不混入旧版本、失败稿或内部运行记录。用户仅要求文件夹时不额外压缩，明确要求 ZIP 时再压缩。确认文件齐全、可读取后告知实际文件夹路径；桌面无法访问则说明限制并询问替代位置，不假称完成。

旧版简化 run.json 不能直接授权生图；恢复既有任务时保留已有图与事实，补齐完整设计和审查，不自动重新生成。
