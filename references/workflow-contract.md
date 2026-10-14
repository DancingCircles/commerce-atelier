# 执行合同 2.0

## 运行记录

platform={id,sourceRef,confirmedAt} 必填：id 为平台方向表中的允许值，sourceRef 对应用户明确平台选择的实际消息，confirmedAt 为实际确认时间。没有选择则 NEEDS_INPUT，禁止默认通用电商。运行 platform 命令取 platformContext，将其同时传给商品规划和整套设计，独立审查也核对同一平台方向。平台变更使旧方案审查和旧编译失效，不自动重生已完成图片。

顶层 schemaVersion="2.0"、runId、status、stage；task 用 schemas.json.input 规定字段（idempotencyKey, language, quality, heroCount, detailCount, mode="create", instruction）；description 是实际用户资料/约束原文，不合成假的 sourceQuote。productAssets 为 id/role="identity"/locator，sourceInspection 为 viewedAssetIds/at；原图信息不足就 questions/answers 记录并 NEEDS_INPUT，不运行 plan/生图。

questions 为 id/text/blocking/requiresImage/affectedSectionIds/reason/options；answers 为 questionId/response/resolved/authorizationRef。答案引用真实问题与真实用户消息；按存储顺序对应 user_answer_N。plan.evidence 的 sourceRef 只用实际原图 id、user_description、user_answer_N，不用事实ID/引用文字冒充。

Plan 使用 schemas.json.plan V3 intentPlanSchema：version=3、productName、facts、category、audience、positioning、requirements、productInformation、sellingPoints、evidence、sections。每张保留 kind/title/role/contentKind/buyerQuestion/objective/factIds/sellingPointIds。卖点需 buyerNeed/feature/benefit/basis/factIds/claimBoundary，1–6条；参数1–12项、label/value/factIds，已提供尺码表所有单元格保留。未知事实省略，关键未知先澄清。旧 need/buyerValue 等简化字段不代替完整合同。

本地通过 plan 后建立 targets：按全部 HERO 后全部 DETAIL 顺序，{id,kind} 数量/类别与 plan.sections 逐项对应。ID稳定。不得一边仅设计第一张一边开始生成，design 必须提交完整所有 targets。

## 风格参考选择与实际像素

不附带内置风格图库，也不自动选择示例图。用户提供风格参考时，最多两张，记录 id/source="upload"/title/reason/locator；不要把 productAsset 放 styleReferences。没有风格图时 styleReferences=[]，各张 referenceUses=[]，根据真实商品、已确认需求和完整美术方案设计，不虚构参考图片或缺失路径。references 命令仅返回 run.json 中已选择的参考记录。

没有风格图不免除完整设计与独立审查；designInputInspection 仍记录 at，viewedReferenceIds=[]。用户要求严格匹配具体参考但没有提供素材时，先请求对应素材，不自行挑固定模板。

styleReferences 保存完整列表，designer 实际查看这些图并记 designInputInspection={at,viewedReferenceIds}。每张 referenceUses 按 design schema，id 只能取允许的风格 ID，purpose=photography/palette/layout；photo不借排版。原图背景不锁定商品场景。

## 完整设计稿

artDirection/designDraft 使用 schemas.json.design flexibleDirectionSchema（version=3/layoutVersion=1/viewVersion=1）。全套 concept/rationale/palette/headlineStyle/bodyStyle/motif/lighting/recipeId/detailSeams 等不可用短 visualDirection 字符串替代。每张完整 expression/expressionReason/compositionBrief/viewpoint/camera/subjectPlacement/productScale/density/background/lighting/graphicDevice/typography/referenceUses/requirementIds/textBlocks/continuity/production。字段允许值/长度/数量从 schema 获取，不凭印象改。

production 九项齐全：buyerTakeaway、narrativeLink、visualProof、layoutBlueprint、materialTreatment、interaction、copyArchitecture、differenceFromPrevious、supportingModules。中景完整瓶子不因写了macro就成为微距；必须落实机位、裁切、主体比例、局部证据和阅读路径。差异是画面实际变化，不是换标题。

保留 typography 与 typesetting：规定的字体选择、坐标/字号/行距/分行、文字同步与越界检查全部生效。新文字块必须给具体 typesetting；photo 的 textBlocks=[]、typography=null、graphicDevice=null、supportingModules=[]。DETAIL 只给相邻DETAIL共享HEX缝，不把HERO算进去。所有文字块最多6个，规格可多行合并，不能漏已知参数。

## 独立审查记录：生成的硬关口

设计完成后切换 reviewer 阶段，重新看同一组原图及角色，不沿用设计者自评。designAudit 保存：

- role="independent_design_review"、at、viewedAssetIds（包含商品及风格图）。
- inputDirection：实际被审查的完整稿。
- inputDigest：pipeline.digest(inputDirection)；contextDigest绑定当前platform/平台方向/plan/targets/原图/参考角色/资料/回答，outputDigest绑定实际输出。使用脚本计算，不能自己编写。
- review：schemas.json.designReview flexibleReviewSchema，passed/issues/changes。
- outputDigest：applyFlexibleReview 应用实际补丁后的最终稿摘要，匹配 artDirection。

先把实际review写入独立review-input.json（review/at/viewedAssetIds），运行 `node <skill>/scripts/pipeline.cjs apply-review <run.json> --review <review-input.json> --out <audited-design.json>`，将返回的artDirection和designAudit存回run，随后运行ready。脚本仅应用你实际提交的审查，不能替代看图。

问题必须引用真实 sectionId；changes仅替换受影响完整section，有reason及依据factIds，保持图数、必要信息及字面原文。校验不通过或审查还有未解决问题时不可生成。若没有问题，review={passed:true,issues:[],changes:[]}；这必须是实际审查结果，不是为填合同伪造。未渲染格式修复有限两轮，失败给字段路径/预期/允许值/限制，保存稿后暂停。

运行 ready 强制检查schema、业务规则、节奏校验、补丁应用结果以及审查前后稿一致性。修改 artDirection、plan、targets 或参考后，旧审查和旧编译均失效，必须审受影响稿并重新compile。

## 提示词编译

compile 返回 platformContext/platformDigest/planDigest/designDigest/frames。frames使用 compileCreativePrompt，包含买家上下文、购买理由与边界、源事实、模块/生产分镜、最终文字及实际typesetting、视觉节奏、参考用途和衔接。只能给原生生图工具添加实际参考图片绑定/工具要求的封装，最终 prompt 保留完整设计提示词，并附明确目标平台、对应创意方向、语言和比例。不改编译文字，不凭“同风格”省字段。

compiledPrompts存完整编译产物。每次工具请求前 generate 检查该稿/审查/编译、首图关口、未解决问题、重复请求、组内反馈关口和修改授权。已有成图无授权不得重生。

## 执行与复查记录

images 每项：sectionId/title/state(pending/generating/generated/checked/uncertain)、attemptKey/correctionCount、artifact或null。artifact含artifactId/version/locator{kind=local/tool/url,value}。当前review含assetId/version/passed/inspectedAt/feedbackMessageId、decoded dimensions{width,height}、preview375Checked、visualQuality及informationCoverage、issues、decision/authorizationRef/revisionScope。

visualQuality 必须 hierarchy/composition/lighting/typography/referenceStyle/distinctness/continuity；typography为true/false，photo用not_applicable。商品身份、事实、文字/参数和原文仍单独核对；informationCoverage每项id/status(VERIFIED/MISSING/UNVERIFIED)/location/observation，覆盖本图信息任务、参数、用户原文与尺码单元格。复查不能仅检查字对不对，也检查真实camera/scale/crop/interaction/reading path。报告“接近”同时distinctness=true需要实际可辨认差异证据，不能空issues全PASS。

setReview含passed/issues/assetIds/inspectedAt/feedbackMessageId，实际看完整gallery和连续详情，绑定当前版本；任意版本更新使有关复查/整体报告失效。QUALITY_PASSED不能有任何未解决实质问题，用户接受缺陷用DELIVERED_WITH_FINDINGS，不改为通过。

逐图先运行 `node <skill>/scripts/pipeline.cjs coverage <run.json> --section <sectionId>` 得到本图应核对的准确 id/expected。原样保留 expected，并逐项填写 status/location/observation，不能只放任意非空列表。ID包括 identity、task、copy、requirement；最后详情还包括 parameter 和尺码表的列/单元格。VERIFIED必须来自当前成图的实际观察；漏项、当前预期值不符或未验证不能记 passed=true。

脚本只验证合同/摘要/规则和文件存在，不证明实际看图、事实真实或用户确实批准；Codex仍必须做这些动作。状态必须真实。
