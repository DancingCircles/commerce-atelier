# 实际生成反馈闭环

## 引用组装

1. 使用最多8张实际商品身份图。原SKU/比例/配件/包装色/标签保留，背景、场景、机位可重设计。未知后部/内部特征不可发明。
2. 风格图来自用户提供、由frameReferences逐张选择的最多两项；没有提供则不附风格图，明确ONLY photography/palette/layout、不同商品、不得继承其事实、字、价格、标记或水印。
3. V3 HERO不默认引用上一张已生成HERO作为统一样板。确实要借配色只描述共享美术系统；不能让上一张完整画面变成后续构图模板。参考图的机位/背景不是商品身份约束。
4. DETAIL查detailSeamsFor。上一张实际成图提供连续语境，再取其底部2%边缘作为精确接缝参考，原图身份优先。计划HEX只是没有实际邻图时的fallback。不能复制邻图对象、文字或布局；边缘过渡不画空白/色条。必要时用reference-edge.py做确定性裁切，仅供引用，不改成品；无可用裁切/实际像素则明确暂停，不能假装用了边缘图。

## 首图关口

首HERO生成后实际查看、检查、反馈，记录firstHeroGate={sectionId,assetId,passed,reason,at}。发现实质问题由用户决定修改或保留继续。不能以未通过首图作为后续style锚点。首图缺失/未知时保留该slot；是否继续其他图按用户明确选择。

## 每张独立复查

读取当前文件/工具结果、真实decoded尺寸、商品原图、所选风格图、此前最近两张实际成图、相关DETAIL邻图与边缘。CURRENT必须明确。原imageReview指令判断缩略图、完整尺寸、375px宽可读性；不要从截图显示宽度猜输出像素。

检查信息/商品之外，判断与实际此前图的摆放、裁切、距离、主体比例、负空间、画面证明和阅读路径是否不同。camera、expression、macro等名字不同不是证据。任何失败写具体位置、实际缺陷、影响和局部建议；不要为了个人审美意见触发付费重生。

复查后立即向用户展示图片与检查结果。FINDINGS/任何false：报告而不自动修改，进入WAITING_REVIEW_DECISION。用户选修此图、保留继续初稿、暂停；此前明确授权“先报告继续初稿最后选改哪些”可继续初稿，但不自动修成图。每次修图后重新检查当前版本。仅自主修未渲染草稿。

## 前两张实际效果反馈关口（HERO/DETAIL分别执行）

每组前两张已生成并实际检查后、第三张工具请求前，记录adaptations.heroes或.details，basis必须为前两张实际artifactId。

- 无实际重复：status=skipped，具体reason说明差异依据，sectionIds=[]。
- 发现distinctness=false或实际重复问题：收集尚未尝试、state=pending、无asset/attemptKey/retry、correctionCount=0的eligibleIds。不能改已生成或已尝试图。
- 用reviewFlexible的adaptive语义重新看实际前两张、原图/风格和当前分镜，提交flexibleReviewSchema的review，调用pipeline adapt应用到eligibleIds；保留全套风格、信息职责、必要参数、原文和seams。
- 保存status=applied、basis、reason、sectionIds、审查及局部变更；重新完成designAudit/ready/compile，才生成后续图。不能只是口头说“第三张不同”而没有可校验改稿。
- adapt 输入还要给 group=heroes/details、reason、viewedAssetIds 和完整 review。保留命令返回的完整 adaptation：当时全部槽位的 imageSnapshot/snapshotDigest、at、eligibleIds、inputDirection/outputDirection、inputDigest/outputDigest、contextDigest 和实际看过的来源 ID。校验用这个历史快照重放补丁，不以之后已完成的图片状态倒推当时可编辑范围；后续稿仍须单独 ready/compile。
- 适配最多尝试一次：claimed遇中断转failed，不悄悄无限重试。失败向用户报告；保留有效分镜，但是否沿用已知重复稿由用户明确决定，记录keep_unrendered_plan。

只有两张的组也做比较和报告，缺第三张不会免除distinctness检查。区别HERO的独立购买问题与DETAIL连续边缘关系。

## 整套实际审查

所有图片槽位齐全后，实际查看gallery顺序及DETAIL竖向拼接：覆盖、缩略图冲击、变化、材质/光线、文字层级和全部实际接缝。记录当前assetIds和具体问题。已审查且版本未变可以复用；当前图变了不可用旧setReview。失败仅报告/等用户，不触发第二轮自动生图。
