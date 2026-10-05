const {chromium}=require('C:/Users/vinic/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.join(process.env.TEMP,'edutrack-auth-refine'),results=[];
async function check(context,theme,width,height,zoom){
 const p=await context.newPage();await p.addInitScript(t=>localStorage.setItem('edutrack.theme',t),theme);
 for(const mode of ['login','register']){
  await p.goto(`http://127.0.0.1:5173/acesso?mode=${mode}`);
  const link=p.getByRole('link',{name:'Continuar com Google',exact:true});await link.waitFor();
  const asset=await link.locator('img').evaluate(async e=>{await e.decode();return {naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,alt:e.alt,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,fit:getComputedStyle(e).objectFit};});
  if(asset.naturalWidth!==200||asset.naturalHeight!==204||asset.alt!==''||asset.width!==20||asset.height!==20||asset.fit!=='contain')throw Error('Google image '+JSON.stringify(asset));
  const cdp=await context.newCDPSession(p);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.auth-google'});
  for(const state of ['rest','hover','focus-visible','active']){
   if(state==='focus-visible')await link.focus();else await link.evaluate(e=>e.blur());
   await cdp.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:state==='rest'?[]:[state]});
   await link.evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})));});
   const data=await link.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,border:s.borderColor,outline:s.outlineStyle,outlineColor:s.outlineColor,shadow:s.boxShadow,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,right:r.right,left:r.left,href:e.getAttribute('href')};});
   if(data.background!=='rgb(255, 255, 255)'||data.color!=='rgb(31, 31, 31)'||data.scrollWidth>data.width+1||data.left<0||data.right>data.width+1||(zoom===1&&height>=768&&data.scrollHeight>data.height+1)||!data.href.includes('/auth/google/start?returnTo=%2Fapp'))throw Error(JSON.stringify(data));
   if(state==='focus-visible'&&data.outlineColor!=='rgb(66, 133, 244)')throw Error('Google focus color '+JSON.stringify(data));
   const id=`google-final-${theme}-${width}x${height}-z${zoom}-${mode}-${state}`;results.push({id,asset,...data});
   if(zoom===1)await p.screenshot({path:path.join(out,id+'.png'),fullPage:true});
   else {const {data:png}=await cdp.send('Page.captureScreenshot',{captureBeyondViewport:true,clip:{x:0,y:0,width:data.width*zoom,height:data.scrollHeight*zoom,scale:1}});fs.writeFileSync(path.join(out,id+'.png'),Buffer.from(png,'base64'));}
  }
  await cdp.detach();
 }
 await p.close();
}
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 for(const theme of ['light','dark'])for(const [w,h] of [[1366,768],[1440,900],[1920,1080],[320,568],[375,667],[768,600],[1366,600]]){const c=await b.newContext({viewport:{width:w,height:h}});await check(c,theme,w,h,1);await c.close();}
 await b.close();
 for(const theme of ['light','dark'])for(const [w,h] of [[1366,768],[1440,900],[1920,1080]]){
  const profile=fs.mkdtempSync(path.join(process.env.TEMP,'auth-zoom-'));fs.mkdirSync(path.join(profile,'Default'));fs.writeFileSync(path.join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}));
  const c=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:null,args:[`--window-size=${w+26},${h+93}`]});await check(c,theme,w,h,2);await c.close();
 }
 fs.writeFileSync(path.join(out,'google-final.json'),JSON.stringify(results,null,2));console.log(`${results.length} final Google asset/color/layout cases passed`);
})().catch(e=>{console.error(e);process.exit(1)});
