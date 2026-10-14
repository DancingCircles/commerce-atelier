#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('./workflow-core.cjs');
const platformDirections=require('../references/platform-directions.json');
function platformContext(run){const id=run.platform?.id,policy=platformDirections[id];return policy?{id,label:policy.label,direction:`Target platform: ${id}. Creative direction (not a guarantee of platform compliance): ${policy.direction}`} : null;}
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function error(fieldPath,message,code='CONTRACT_ERROR',extra={}){return {code,fieldPath,message,...extra};}
function parse(schema,value,label,errors){const r=schema.safeParse(value);if(r.success)return r.data;for(const i of r.error.issues)errors.push(error(label+'.'+i.path.join('.'),i.code,'SCHEMA_ERROR',{expectedType:i.expected,allowedValues:i.values,constraint:{minimum:i.minimum,maximum:i.maximum}}));return null;}
function references(run){return Array.isArray(run.styleReferences)?run.styleReferences:[];}
function normalize(raw){const p=core.normalizeIntentPlan(raw);p.sections=[...p.sections.filter(s=>s.kind==='HERO'),...p.sections.filter(s=>s.kind==='DETAIL')];return p;}
function shared(run){const errors=[];if(run.schemaVersion!=='2.0')errors.push(error('schemaVersion','Expected 2.0; v1 records cannot authorize generation'));
 if(!run.runId)errors.push(error('runId','Required'));
 if(!platformContext(run)||!run.platform?.sourceRef||!run.platform?.confirmedAt)errors.push(error('platform','Ask which platform and wait for actual user selection before planning; explicit general ecommerce selection is allowed','NEEDS_INPUT',{allowedValues:Object.keys(platformDirections)}));
 if(!Array.isArray(run.productAssets)||!run.productAssets.length)errors.push(error('productAssets','Original product imagery is required'));
 if(!Array.isArray(run.questions)||!Array.isArray(run.answers))errors.push(error('questions/answers','Both are required arrays'));
 const qs=run.questions||[],answers=run.answers||[];
 for(const q of qs)if(q.blocking&&!answers.some(a=>a.questionId===q.id&&a.resolved===true&&a.response?.trim()&&a.authorizationRef))errors.push(error('questions.'+q.id,'Wait for an actual resolving user answer','NEEDS_INPUT'));
 for(const a of answers)if(!qs.some(q=>q.id===a.questionId))errors.push(error('answers.'+a.questionId,'Answer refers to unknown question'));
 const assets=run.productAssets||[];for(const a of assets){if(!a.id||!a.locator||a.role!=='identity')errors.push(error('productAssets','Actual identity locator and stable ID required'));}
 const viewed=new Set(run.sourceInspection?.viewedAssetIds||[]);if(assets.some(a=>!viewed.has(a.id))||!run.sourceInspection?.at)errors.push(error('sourceInspection','Inspect original pixels before planning; no text-only substitution'));
 return errors;}
function checkPlan(run){const errors=shared(run);const task=parse(core.detailRunInputSchema,run.task,'task',errors);let plan=null;
 const raw=parse(core.intentPlanSchema,run.plan,'plan',errors);if(raw){plan=normalize(raw);
 const answers=(run.answers||[]).map(a=>a.response||'');
 const assets=(run.productAssets||[]).map(a=>a.id);
 for(const m of [...core.validateCommercePlan(plan,assets,run.description||'',answers),...core.validateCommercialTasks(plan)])errors.push(error('plan',m,'BUSINESS_RULE'));
 if(task&&(plan.sections.filter(s=>s.kind==='HERO').length!==task.heroCount||plan.sections.filter(s=>s.kind==='DETAIL').length!==task.detailCount))errors.push(error('plan.sections','Exact requested HERO/DETAIL counts required'));
 if(run.selectedCategory&&run.selectedCategory!=='auto'&&plan.category!==run.selectedCategory)errors.push(error('plan.category','Must preserve user-selected category or clarify conflict'));
 }
 return {errors,task,plan};}
function checkDesign(run){const state=checkPlan(run);const {errors,plan}=state;
 const targets=run.targets;
 if(!Array.isArray(targets)||!plan||targets.length!==plan.sections.length){errors.push(error('targets','Stable ordered target ID for every planned section required'));return state;}
 const ids=targets.map(t=>t.id);if(new Set(ids).size!==ids.length||targets.some((t,i)=>!t.id||t.kind!==plan.sections[i].kind))errors.push(error('targets','Unique IDs and ordered HERO/DETAIL mapping required'));
 const refs=references(run);if(refs.length>2||new Set(refs.map(r=>r.id)).size!==refs.length)errors.push(error('styleReferences','At most two unique references per set'));
 const inspected=new Set(run.designInputInspection?.viewedReferenceIds||[]);
 if(!run.designInputInspection?.at||refs.some(r=>!r.locator||!inspected.has(r.id)))errors.push(error('designInputInspection','Designer must inspect actual selected style pixels and role labels'));
 const art=parse(core.flexibleDirectionSchema,run.artDirection||run.designDraft,'artDirection',errors);
 if(art){for(const m of [...core.validateFlexibleDirection(art,targets,plan,refs),...core.rhythmWarnings(art)])errors.push(error('artDirection',m,'BUSINESS_RULE'));
 // Project instructions demand concrete typesetting in new designs even though legacy schema allowed omission.
 for(const section of art.sections)if(section.expression!=='photo'&&section.textBlocks.some(b=>!b.typesetting))errors.push(error('artDirection.sections.'+section.sectionId+'.textBlocks','New designs must supply typesetting for every visible block'));
 }
 return {...state,art};}
function reviewContext(run,plan){return digest({platform:run.platform,platformContext:platformContext(run),plan,targets:run.targets,styleReferences:references(run),productAssets:run.productAssets,description:run.description,answers:run.answers});}
function checkReady(run){const state=checkDesign(run);const {errors,plan,art}=state;if(!plan||!art)return state;
 const audit=run.designAudit;if(!audit||audit.role!=='independent_design_review'){errors.push(error('designAudit','Separate design-review pass and saved review result required','DESIGN_REVIEW_MISSING'));return state;}
 const input=parse(core.flexibleDirectionSchema,audit.inputDirection,'designAudit.inputDirection',errors);
 const review=parse(core.flexibleReviewSchema,audit.review,'designAudit.review',errors);
 const viewed=new Set(audit.viewedAssetIds||[]);
 for(const id of [...(run.productAssets||[]).map(a=>a.id),...references(run).map(r=>r.id)])if(!viewed.has(id))errors.push(error('designAudit.viewedAssetIds','Independent review must inspect source identity and style pixels'));
 if(audit.contextDigest!==reviewContext(run,plan))errors.push(error('designAudit.contextDigest','Review context changed or was not bound to facts, targets, and reference roles','STALE_DESIGN_REVIEW'));
 if(!audit.at)errors.push(error('designAudit.at','Required'));
 if(input&&review){const result=core.applyFlexibleReview(input,review,plan,run.targets,references(run));
 for(const m of result.errors)errors.push(error('designAudit.review',m,'BUSINESS_RULE'));
 if(result.issues.some(i=>!i.resolved))errors.push(error('designAudit.review','Unresolved factual/copy/typography/design findings block generation'));
 if(audit.inputDigest!==digest(input)||audit.outputDigest!==digest(art)||digest(result.direction)!==digest(art))errors.push(error('designAudit','Input, patches, output, and saved design digests disagree','STALE_DESIGN_REVIEW'));
 }
 return state;}
function compile(run){const state=checkReady(run);if(state.errors.length)return {valid:false,errors:state.errors};
 const {plan,art}=state;const frames=run.targets.map((t,i)=>{const section=art.sections.find(s=>s.sectionId===t.id);return {sectionId:t.id,kind:t.kind,aspectRatio:t.kind==='HERO'?'1:1':'3:4',prompt:[core.compileCreativePrompt(plan,plan.sections[i],art,section),platformContext(run).direction,`Language for planned added copy only: ${run.task.language}. Aspect ratio: ${t.kind==='HERO'?'1:1':'3:4'}.`].join('\n'),productAssetIds:run.productAssets.slice(0,8).map(a=>a.id),styleReferences:core.frameReferences(art,section,references(run)).map(x=>({id:x.reference.id,purpose:x.purpose,locator:x.reference.locator})),detailSeams:core.detailSeamsFor(art,t.id)};});
 return {valid:true,schemaVersion:'2.0',runId:run.runId,platformContext:platformContext(run),platformDigest:digest(run.platform),planDigest:digest(plan),designDigest:digest(art),frames};}
function expectedCoverage(run,sectionId){
 const plan=normalize(run.plan),art=core.flexibleDirectionSchema.parse(run.artDirection||run.designDraft);const index=run.targets.findIndex(t=>t.id===sectionId),section=art.sections.find(a=>a.sectionId===sectionId);const rows=[{id:'identity:'+sectionId,expected:'Original SKU, proportions, parts, colors and labels'},{id:'task:'+sectionId,expected:plan.sections[index].objective}];
 section.textBlocks.forEach((b,i)=>rows.push({id:'copy:'+sectionId+':'+i,expected:b.text}));
 for(const id of section.requirementIds||[]){const r=plan.requirements.find(r=>r.id===id);if(r)rows.push({id:'requirement:'+id,expected:r.text});}
 const lastDetail=run.targets.filter(t=>t.kind==='DETAIL').at(-1);
 if(lastDetail?.id===sectionId&&!core.specificationPageOmitted(plan)){plan.productInformation.parameters.forEach((r,i)=>rows.push({id:'parameter:'+i,expected:r.label+' = '+r.value}));const chart=plan.productInformation.sizeChart;if(chart){chart.columns.forEach((v,i)=>rows.push({id:'sizeChart:column:'+i,expected:v}));chart.rows.forEach((r,i)=>r.cells.forEach((v,j)=>rows.push({id:'sizeChart:'+i+':'+j,expected:v})));}}
 return rows;
}
function inspectRecord(run,image,errors){const p='images.'+image.sectionId;const a=image.artifact,r=image.review;
 if(!r||r.assetId!==a?.artifactId||r.version!==a?.version||!r.inspectedAt||!r.feedbackMessageId){errors.push(error(p+'.review','Current actual artifact/version, inspection time, and per-image user feedback required','IMAGE_REVIEW_MISSING'));return {failed:true};}
 if(typeof r.passed!=='boolean')errors.push(error(p+'.review.passed','Actual boolean result required'));
 const q=parse(core.artReviewCriteria.extend({typography:core.z.union([core.z.boolean(),core.z.literal('not_applicable')]),referenceStyle:core.z.boolean(),distinctness:core.z.boolean(),continuity:core.z.boolean()}),r.visualQuality,p+'.review.visualQuality',errors);
 if(!r.dimensions||!Number.isInteger(r.dimensions.width)||!Number.isInteger(r.dimensions.height)||r.dimensions.width<1||r.dimensions.height<1||!r.preview375Checked)errors.push(error(p+'.review','Actual decoded dimensions and mobile preview check required'));
 const section=(run.artDirection||run.designDraft).sections.find(s=>s.sectionId===image.sectionId);if(q&&(section?.expression==='photo'?q.typography!=='not_applicable':q.typography==='not_applicable'))errors.push(error(p+'.review.typography','Result must match expression'));
 if(!Array.isArray(r.issues)){errors.push(error(p+'.review.issues','Concrete issue array required'));return {failed:true};}
 const coverage=Array.isArray(r.informationCoverage)?r.informationCoverage:[];const ids=new Set();for(const row of coverage){if(!row||typeof row.id!=='string'||ids.has(row.id))errors.push(error(p+'.review.informationCoverage','Unique coverage IDs required'));else ids.add(row.id);}
 let missing=false;for(const expected of expectedCoverage(run,image.sectionId)){const row=coverage.find(c=>c?.id===expected.id);if(!row||!['VERIFIED','MISSING','UNVERIFIED'].includes(row.status)||row.expected!==expected.expected||!row.location||!row.observation){errors.push(error(p+'.review.informationCoverage','Explicit current expected value, result, location and observation required for '+expected.id,'MISSING_INFORMATION'));missing=true;}else if(row.status!=='VERIFIED')missing=true;}
 const failed=!q||r.passed!==true||r.issues.length>0||Object.values(q).some(v=>v===false)||missing;
 if(failed&&!r.issues.length)errors.push(error(p+'.review.issues','Every failed/uncertain inspection requires visible location and actionable finding','REVIEW_FINDING_MISSING'));
 if(failed&&r.decision==='accepted_with_findings'&&(!r.authorizationRef||!run.decisions?.some(d=>d.action==='keep_with_findings'&&d.sourceRef===r.authorizationRef&&d.sectionIds?.includes(image.sectionId))))errors.push(error(p+'.review.decision','Acceptance requires matching actual user decision record','USER_DECISION_REQUIRED'));
 if(r.passed===true&&failed)errors.push(error(p+'.review.passed','PASS conflicts with false quality or incomplete information','REVIEW_RESULT_CONFLICT'));
 if(image.state!=='checked')errors.push(error(p+'.state','Review must be saved as checked for this actual version'));
 return {failed};
}
function checkGeneration(run,sectionId){const state=checkReady(run);const {errors}=state;const expected=compile(run);
 const compiled=run.compiledPrompts;if(!compiled||!expected.valid||digest(compiled)!==digest(expected))errors.push(error('compiledPrompts','Run compiler and store its unedited output; handmade prompts are not accepted','PROMPT_NOT_COMPILED'));
 const target=(run.targets||[]).find(t=>t.id===sectionId);if(!target){errors.push(error('sectionId','Unknown target'));return state;}
 const images=run.images||[];const image=images.find(i=>i.sectionId===sectionId);
 if(image?.state==='generating'||image?.state==='uncertain')errors.push(error('images.'+sectionId,'Do not replay a started or uncertain request','UNCERTAIN_REQUEST'));
 if(image?.artifact&&!run.decisions?.some(d=>d.action==='revise'&&d.sectionIds?.includes(sectionId)&&d.sourceRef&&d.scope))errors.push(error('decisions','Existing image requires actual scoped user revision authorization','USER_DECISION_REQUIRED'));
 const authorizedRevision=Boolean(image?.artifact&&run.decisions?.some(d=>d.action==='revise'&&d.sourceRef&&d.scope&&d.sectionIds?.includes(sectionId)));
 const pending=images.filter(i=>i.artifact&&(!authorizedRevision||i.sectionId===sectionId)&&inspectRecord(run,i,errors).failed&&i.review?.decision!=='accepted_with_findings'&&!(authorizedRevision&&i.sectionId===sectionId));
 if(pending.length&&!run.decisions?.some(d=>d.action==='continue_initials_with_findings'&&d.sourceRef))errors.push(error('images.review','Report findings and wait for user choice before continuing','USER_DECISION_REQUIRED'));
 const first=run.targets[0];if(sectionId!==first.id){const gate=run.firstHeroGate;
 if(!gate||gate.sectionId!==first.id||!gate.assetId||!gate.at)errors.push(error('firstHeroGate','First image gate must precede later generation'));
 const firstImage=images.find(i=>i.sectionId===first.id);if(gate&&(gate.assetId!==firstImage?.artifact?.artifactId||firstImage?.review?.assetId!==gate.assetId||!firstImage?.review?.feedbackMessageId))errors.push(error('firstHeroGate','Gate must bind reviewed current first image and user feedback'));
 if(gate?.passed===false&&!run.decisions?.some(d=>d.action==='keep_with_findings'&&d.sourceRef&&d.sectionIds?.includes(first.id)))errors.push(error('firstHeroGate','User must decide how to proceed with a failed first image'));
 }
 if(!authorizedRevision)for(const kind of ['HERO','DETAIL']){const group=run.targets.filter(t=>t.kind===kind);const index=group.findIndex(t=>t.id===sectionId);if(index>=2){const basis=group.slice(0,2).map(t=>images.find(i=>i.sectionId===t.id));
 if(basis.some(i=>!i?.artifact||!i.review))errors.push(error('images','First two actual outputs and reviews required before group adaptation'));
 const repetition=basis.some(i=>i?.review?.visualQuality?.distinctness===false||i?.review?.issues?.some(s=>/重复|雷同|近似构图|repetiti|same (?:layout|composition)/i.test(typeof s==='string'?s:s.observation||'')));
 const record=run.adaptations?.[kind==='HERO'?'heroes':'details'];const current=basis.map(i=>i?.artifact?.artifactId);
 if(!record||digest(record.basis)!==digest(current))errors.push(error('adaptations','Save the first-two actual-output adaptation decision before subsequent group images','ADAPTATION_MISSING'));
 else if(!record.reason||!['applied','skipped','failed'].includes(record.status))errors.push(error('adaptations','Concrete reason and valid status required'));
 else if(!repetition&&record.status!=='skipped')errors.push(error('adaptations','No repetition: record skipped with actual differentiation basis'));
 else if(repetition&&record.status==='applied'){
 const input=parse(core.flexibleDirectionSchema,record.inputDirection,'adaptations.inputDirection',errors),output=parse(core.flexibleDirectionSchema,record.outputDirection,'adaptations.outputDirection',errors),review=parse(core.flexibleReviewSchema,record.review,'adaptations.review',errors);
 const snap=record.imageSnapshot;
 if(!Array.isArray(snap)||snap.length!==run.targets.length||run.targets.some(t=>!snap.some(i=>i.sectionId===t.id))||new Set(snap.map(i=>i.sectionId)).size!==snap.length||!record.at||record.snapshotDigest!==digest(snap))errors.push(error('adaptations.imageSnapshot','Historical adaptation must bind all original image states and time','ADAPTATION_INVALID'));
 else if(input&&output&&review){const eligible=core.adaptationEligibility(snap);const result=core.applyFlexibleReview(input,review,state.plan,run.targets,references(run),eligible);const changed=review.changes.map(c=>c.section.sectionId);const snapBasis=group.slice(0,2).map(t=>snap.find(i=>i.sectionId===t.id));const requiredViews=[...current,...run.productAssets.map(a=>a.id),...references(run).map(r=>r.id)];
 if(snapBasis.some((i,n)=>i?.state!=='checked'||i.assetId!==current[n])||requiredViews.some(id=>!record.viewedAssetIds?.includes(id))||!changed.length||digest(changed)!==digest(record.sectionIds||[])||digest(eligible)!==digest(record.eligibleIds||[])||record.inputDigest!==digest(input)||record.outputDigest!==digest(output)||digest(result.direction)!==digest(output)||result.errors.length||result.issues.some(i=>!i.resolved)||record.contextDigest!==reviewContext(run,state.plan))errors.push(error('adaptations','applied must bind actual historical eligible patches, review, references and input/output/context digests','ADAPTATION_INVALID'));
 }
 }
 else if(repetition&&record.status!=='applied'&&!run.decisions?.some(d=>d.action==='keep_unrendered_plan'&&d.sourceRef&&d.sectionIds?.includes(sectionId)))errors.push(error('adaptations','Repetition requires reviewed local revision to unrendered drafts or explicit user decision'));
 }}
 return state;}
function checkDelivery(run,recordPath){const state=checkReady(run);const {errors,art}=state;const images=run.images||[];const ids=[];
 for(const t of run.targets||[]){const im=images.find(i=>i.sectionId===t.id);const p='images.'+t.id;
 if(!im?.artifact){errors.push(error(p,'Image missing','PARTIAL'));continue;}const a=im.artifact;ids.push(a.artifactId);const r=im.review;
 if(a.locator?.kind==='local'){const f=path.isAbsolute(a.locator.value)?a.locator.value:path.resolve(path.dirname(recordPath),a.locator.value);if(!fs.existsSync(f))errors.push(error(p+'.artifact','File missing'));}
 if(!a.artifactId||!a.version||!a.locator?.value)errors.push(error(p+'.artifact','Actual versioned artifact and locator required'));
 inspectRecord(run,im,errors);
 if(!r||r.assetId!==a.artifactId||r.version!==a.version||!r.inspectedAt||!r.feedbackMessageId){errors.push(error(p+'.review','Actual current-version review and per-image user feedback required'));continue;}
 const q=parse(core.artReviewCriteria.extend({typography:core.z.union([core.z.boolean(),core.z.literal('not_applicable')]),referenceStyle:core.z.boolean(),distinctness:core.z.boolean(),continuity:core.z.boolean()}),r.visualQuality,p+'.review.visualQuality',errors);
 const section=art?.sections.find(s=>s.sectionId===t.id);if(q&&(section?.expression==='photo'?q.typography!=='not_applicable':q.typography==='not_applicable'))errors.push(error(p+'.review.typography','Typography result must match expression'));
 if(!r.dimensions||!Number.isInteger(r.dimensions.width)||!Number.isInteger(r.dimensions.height)||!r.preview375Checked)errors.push(error(p+'.review','Record decoded actual dimensions and actual mobile preview inspection'));
 if(!Array.isArray(r.informationCoverage)||!r.informationCoverage.length)errors.push(error(p+'.review.informationCoverage','Explicit per-frame task/parameter/user-copy coverage required'));
 if(!Array.isArray(r.issues)){errors.push(error(p+'.review.issues','Array required'));continue;}
 if(!q)continue;const failed=r.issues.length||Object.values(q).some(v=>v===false)||r.informationCoverage.some(x=>x.status!=='VERIFIED');
 if(failed&&(!r.issues.length||r.decision!=='accepted_with_findings'||!r.authorizationRef))errors.push(error(p+'.review','Concrete findings and actual user decision required','USER_DECISION_REQUIRED'));
 if(failed&&run.status==='QUALITY_PASSED')errors.push(error('status','User acceptance cannot turn quality findings into PASS'));
 }
 if(!['QUALITY_PASSED','DELIVERED_WITH_FINDINGS'].includes(run.status))errors.push(error('status','Final delivery status required'));
 if(!run.setReview||digest(run.setReview.assetIds||[])!==digest(ids)||!run.setReview.inspectedAt||!run.setReview.feedbackMessageId)errors.push(error('setReview','Actual whole gallery/continuous detail review matching current artifacts required'));
 if(run.status==='QUALITY_PASSED'&&(!run.setReview?.passed||run.setReview?.issues?.length))errors.push(error('setReview','Quality pass requires resolved set findings'));
 for(const a of run.attempts||[])if(a.operation==='edit'&&!run.decisions?.some(d=>d.action==='revise'&&d.sourceRef===a.authorizationRef&&d.sectionIds?.includes(a.sectionId)&&d.scope))errors.push(error('attempts.'+a.attemptId,'Unauthorized image correction','USER_DECISION_REQUIRED'));
 return state;}
function selectReferences(category,direction,uploads=[]){return uploads.slice(0,2);}
function adapt(run,input){
 const state=checkReady(run);if(state.errors.length)return {valid:false,errors:state.errors};const snapshot=run.targets.map(t=>{const i=(run.images||[]).find(i=>i.sectionId===t.id);return {sectionId:t.id,state:i?.state||'pending',assetId:i?.artifact?.artifactId,attemptKey:i?.attemptKey,retryRequested:i?.retryRequested,correctionCount:i?.correctionCount||0};});const eligible=core.adaptationEligibility(snapshot);
 const review=core.flexibleReviewSchema.parse(input.review);const result=core.applyFlexibleReview(state.art,review,state.plan,run.targets,references(run),eligible);const errors=[...result.errors];
 const kind=input.group==='heroes'?'HERO':input.group==='details'?'DETAIL':null;const group=run.targets.filter(t=>t.kind===kind);const first=group.slice(0,2).map(t=>(run.images||[]).find(i=>i.sectionId===t.id));const basis=first.map(i=>i?.artifact?.artifactId);const views=[...basis,...run.productAssets.map(a=>a.id),...references(run).map(r=>r.id)];
 if(!kind||first.length!==2||first.some(i=>!i?.artifact||i.state!=='checked')||views.some(id=>!input.viewedAssetIds?.includes(id)))errors.push('Adaptive review requires named group, first two actual checked images and source/reference inspection');
 const valid=!errors.length&&!result.issues.some(i=>!i.resolved);return {valid,errors,eligibleIds:eligible,direction:result.direction,review,issues:result.issues,adaptation:{status:'applied',at:new Date().toISOString(),basis,reason:input.reason,viewedAssetIds:input.viewedAssetIds,imageSnapshot:snapshot,snapshotDigest:digest(snapshot),inputDirection:state.art,outputDirection:result.direction,inputDigest:digest(state.art),outputDigest:digest(result.direction),contextDigest:reviewContext(run,state.plan),eligibleIds:eligible,sectionIds:review.changes.map(c=>c.section.sectionId),review}};
}
module.exports={core,platformContext,digest,reviewContext,expectedCoverage,inspectRecord,normalize,checkPlan,checkDesign,checkReady,compile,checkGeneration,checkDelivery,selectReferences,adapt};
if(require.main===module){try{const [command,file,...rest]=process.argv.slice(2);const option=k=>rest[rest.indexOf(k)+1];let result;
 if(command==='references'){const record=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));result=selectReferences(null,null,references(record));}
 else{const run=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
 if(command==='platform')result={platformContext:platformContext(run),errors:shared(run).filter(e=>e.fieldPath==='platform')};
 else if(command==='check'){const stage=option('--stage')||'ready';const s=stage==='plan'?checkPlan(run):stage==='design'?checkDesign(run):stage==='delivery'?checkDelivery(run,file):stage==='generate'?checkGeneration(run,option('--section')):checkReady(run);result={valid:!s.errors.length,stage,errors:s.errors};}
 else if(command==='compile')result=compile(run);
 else if(command==='coverage')result=expectedCoverage(run,option('--section'));
 else if(command==='digest')result={digest:digest(run)};
 else if(command==='apply-review'){const st=checkDesign(run);const audit=JSON.parse(fs.readFileSync(option('--review'),'utf8'));if(st.errors.length)result={valid:false,errors:st.errors};else {const review=core.flexibleReviewSchema.parse(audit.review);const patched=core.applyFlexibleReview(st.art,review,st.plan,run.targets,references(run));result={valid:!patched.errors.length&&!patched.issues.some(i=>!i.resolved),errors:patched.errors,unresolved:patched.issues.filter(i=>!i.resolved),artDirection:patched.direction,designAudit:{role:'independent_design_review',at:audit.at,viewedAssetIds:audit.viewedAssetIds,inputDirection:st.art,inputDigest:digest(st.art),contextDigest:reviewContext(run,st.plan),review,outputDigest:digest(patched.direction)}};}}
 else if(command==='adapt')result=adapt(run,JSON.parse(fs.readFileSync(option('--review'),'utf8')));
 else throw Error('Commands: check, compile, references, digest, adapt');}
 const out=rest.includes('--out')?option('--out'):null;const body=JSON.stringify(result,null,2);if(out){if(result.valid===false)throw Error('Refusing to write failed compiled output');fs.writeFileSync(out,body+'\n');}else process.stdout.write(body+'\n');if(result.valid===false)process.exitCode=1;
 }catch(e){process.stdout.write(JSON.stringify({valid:false,errors:[error('$',e instanceof core.z.ZodError?'Malformed schema input':e.message,'EXECUTION_ERROR')]})+'\n');process.exitCode=1;}}
