# 用户决策、恢复与工程边界

关键需求不明确必须NEEDS_INPUT：描述所缺/冲突信息及影响，一次最多三项关键问题，实际回答后才解除。非关键机位/风格可创作判断；SKU/用途/能力/核心信息不靠猜。用户实际明确允许“按现有已知信息制作”则范围化省未知，仍保留所有已知必需参数、用户原文和尺码表。身份不能辨认或核心用途仍未知则继续暂停。

保存questions/answers及实际授权来源，不能把沉默/超时/自评当用户选择。明确回答与user_answer_N顺序绑定。字段错误返回fieldPath/expectedType/allowedValues/min/max，保留原草稿和反馈，只修坏字段。业务/设计校验失败记录具体issues与受影响ID；不改事实、不删任务、不加假数来通过。

任何已生成图片修改都需明确用户授权，记录decisions={id,sourceRef,action="revise",sectionIds,scope,at}，attempts={attemptId,sectionId,operation="edit",authorizationRef,...}。用户已授权范围无需重复确认，新版本仍逐图反馈。用户选择保留问题图为accepted_with_findings，不把差异失败/参数错误改成PASS。

已明确授权修改某张图时，可以先修这张图，不必等其他图片的问题全部处理完。这个授权仅释放指定图片的修改，不释放其他仍待用户决定的初稿生成；继续其他初稿仍需对应的用户选择和生成关口。

requests started/uncertain不可自动重发。先核对原生工具结果和已保存文件；确认未生成或用户明确retry_uncertain才新attempt。不能无限生成、修图或审查。保留失败slot及所有完成版本，不偷偷重编号。已完成图不会因恢复运行再次生成。

设计草稿改动、plan参数变动、reference变动必须使相关审查/编译失效；记录changeRequests及影响。用户需求变化只能更新受影响槽位，不直接替换其他成图。跨SKU run隔离事实/原图/参数，允许共享获准风格。规则和 schema 有明确适用范围；新模式需显式定义，不能假装当前合同已经覆盖。

能力使用：Codex原生分析/生成/看图，不配置文本/图片模型或Key。pipeline.cjs完全本地；workflow-core.cjs已包含所需schema库，不npm install。缺Node时发现宿主runtime；裁切辅助需要宿主已提供的Pillow，缺时先发现可用运行时，不擅自安装依赖。缺原生生图或必需素材暂停相应阶段。

初始生成authorizationRef指真实用户制作请求；修图、接受问题、继续初稿、重试不确定请求分别记录真实选择。整体完成授权不能涵盖自动修所有图。整套完成并反馈后，按 SKILL.md 简短询问是否整理到桌面文件夹；实际同意或此前已有明确授权后执行文件复制。桌面整理不授予修图、接受缺陷、上架或账号操作权限。
