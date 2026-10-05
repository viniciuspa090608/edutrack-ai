const {chromium}=require('C:/Users/vinic/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.join(process.env.TEMP,'edutrack-auth-refine');fs.mkdirSync(out,{recursive:true});
const results=[];
const generic='Se houver uma conta com senha local, enviaremos um código. Você também pode entrar com Google.';
const sizes=[[1366,768],[1440,900],[1920,1080],[320,568],[375,667],[768,600],[1366,600]];
async function run(context,theme,width,height,zoom){
 const page=await context.newPage();
 await page.addInitScript(t=>localStorage.setItem('edutrack.theme',t),theme);
 await page.emulateMedia({reducedMotion:'reduce'});
 let response={status:204},pending;
 await page.route('**/auth/**',async route=>{
  if(!new URL(route.request().url()).pathname.replace(/^\/api/, '').startsWith('/auth/'))return route.continue();
  const r=response;
  if(r.busy){pending=route;return;}
  if(r.network)return route.abort('failed');
  return route.fulfill({status:r.status,headers:r.headers,contentType:'application/json',body:r.status===204?'':JSON.stringify(r.body||{error:{code:r.code}})});
 });
 const snap=async(name,exception=false)=>{
  if(!response.busy)await page.locator('form[aria-busy="true"]').waitFor({state:'detached'});
  await page.evaluate(()=>document.fonts.ready);
  const data=await page.evaluate(()=>{
   const d=document.documentElement;
   const nodes=[...document.querySelectorAll('.auth-layout input,.auth-layout button,.auth-layout a,.auth-layout h1,.auth-layout [role="alert"],.auth-layout [role="status"]')].filter(e=>e.getBoundingClientRect().width);
   const rects=nodes.map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY};});
   const internals=[...document.querySelectorAll('.auth-layout,.auth-story,.auth-form-region,.auth-surface,.auth-form-content,form,[role="alert"],[role="status"]')].filter(e=>e.getBoundingClientRect().width).filter(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1).map(e=>({class:e.className,overflowX:getComputedStyle(e).overflowX,overflowY:getComputedStyle(e).overflowY}));
   return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollHeight:d.scrollHeight,scrollWidth:d.scrollWidth,rects,internals,theme:document.documentElement.classList.contains('dark')?'dark':'light',bodyZoom:getComputedStyle(document.body).zoom};
  });
  const desktop=zoom===1&&height>=768&&width>=1366&&!exception;
  const failures=[];
  if(data.theme!==theme)failures.push('theme');
  if(data.scrollWidth>data.width+1)failures.push('horizontal');
  if(desktop&&data.scrollHeight>data.height+1)failures.push('vertical');
  if(data.rects.some(r=>r.left< -1||r.right>data.width+1||r.top< -1||r.bottom>data.scrollHeight+1))failures.push('bounds');
  if(data.internals.some(e=>['hidden','clip','scroll','auto'].includes(e.overflowY)||['hidden','clip','scroll','auto'].includes(e.overflowX)))failures.push('internal scroll/clip');
  const id=`${theme}-${width}x${height}-z${zoom}-${name}`;
  results.push({id,desktop,exception,...data,failures});
  if(zoom===1)await page.screenshot({path:path.join(out,id+'.png'),fullPage:true});
  else {
   const capture=await context.newCDPSession(page);
   const {data:png}=await capture.send('Page.captureScreenshot',{captureBeyondViewport:true,clip:{x:0,y:0,width:data.width*zoom,height:data.scrollHeight*zoom,scale:1}});
   fs.writeFileSync(path.join(out,id+'.png'),Buffer.from(png,'base64'));await capture.detach();
  }
  fs.writeFileSync(path.join(out,'matrix.json'),JSON.stringify(results,null,2));
  if(failures.length)throw Error(id+': '+failures.join(',')+' '+data.scrollHeight);
 };
 const error=code=>response={status:code==='INVALID_CREDENTIALS'?401:code==='EMAIL_CONFLICT'?409:code.includes('RATE_LIMITED')?429:400,code,headers:code.includes('RATE_LIMITED')?{'Retry-After':'60'}:undefined};
 const click=async name=>page.getByRole('button',{name,exact:true}).click();
 const finishBusy=async()=>{await pending.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:'INVALID_CODE'}})});pending=null;await page.getByRole('alert').waitFor();};
 const keyboard=async name=>{
  await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
  for(let i=0;i<14;i++){
   await page.keyboard.press('Tab');
   const focus=await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,visible:r.width>0&&r.top>=-1&&r.bottom<=innerHeight+1,outline:s.outlineStyle};});
   if(!['BODY','HTML'].includes(focus.tag)&&!focus.visible)throw Error('Keyboard invisible '+name+JSON.stringify(focus));
  }
  for(let i=0;i<14;i++)await page.keyboard.press('Shift+Tab');
 };
 for(const mode of ['login','register']){
  response={status:401,code:'INVALID_CREDENTIALS'};
  await page.goto(`http://127.0.0.1:5173/acesso?mode=${mode}`);await page.getByRole('tab',{name:'Entrar',exact:true}).waitFor();
  await snap(mode+'-initial');await keyboard(mode);
  await click(mode==='login'?'Entrar':'Criar conta');await snap(mode+'-required');
  await page.getByLabel('E-mail',{exact:true}).fill('invalid');await page.getByLabel('Senha',{exact:true}).fill('short');await click(mode==='login'?'Entrar':'Criar conta');await snap(mode+'-invalid');
  await page.getByLabel('E-mail',{exact:true}).fill('student@example.com');await page.getByLabel('Senha',{exact:true}).fill('long-enough-password');
  response={busy:true};await click(mode==='login'?'Entrar':'Criar conta');await page.getByRole('button',{name:'Aguarde…'}).waitFor();await snap(mode+'-busy');await finishBusy();
  for(const code of [mode==='login'?'INVALID_CREDENTIALS':'EMAIL_CONFLICT','AUTH_RATE_LIMITED']){error(code);await click(mode==='login'?'Entrar':'Criar conta');await page.getByRole('alert').waitFor();await snap(mode+'-'+code);}
  response={network:true};await click(mode==='login'?'Entrar':'Criar conta');await page.getByRole('alert').waitFor();await snap(mode+'-network');
  for(const google of ['failed','conflict']){
   await page.goto(`http://127.0.0.1:5173/acesso?mode=${mode}&account=updated&google=${google}`);
   await page.getByLabel('E-mail',{exact:true}).fill('student@example.com');await page.getByLabel('Senha',{exact:true}).fill('long-enough-password');
   error(mode==='login'?'INVALID_CREDENTIALS':'EMAIL_CONFLICT');await click(mode==='login'?'Entrar':'Criar conta');await page.getByRole('alert').last().waitFor();await snap(mode+'-combined-'+google);
  }
  const google=page.getByRole('link',{name:'Continuar com Google',exact:true});
  const href=await google.getAttribute('href');if(!href.includes('/auth/google/start?returnTo=%2Fapp'))throw Error('Google destination');
  const session=await context.newCDPSession(page);
  await session.send('DOM.enable');await session.send('CSS.enable');
  const {root}=await session.send('DOM.getDocument');const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.auth-google'});
  for(const state of ['rest','hover','focus-visible','active']){
   await session.send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:state==='rest'?[]:[state]});
   const colors=await google.evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,border:s.borderColor,outline:s.outlineStyle,shadow:s.boxShadow};});
   if(colors.background!=='rgb(255, 255, 255)'||colors.color!=='rgb(31, 31, 31)')throw Error('Google colors '+JSON.stringify(colors));
   await snap(mode+'-google-'+state);
  }
  await session.detach();
  if(width===1366&&height===768){await page.getByRole('alert').last().evaluate(e=>e.textContent='Mensagem excepcional. '.repeat(40)+'x'.repeat(200));await snap(mode+'-long',true);await keyboard(mode+'-long');}
 }
 await page.goto('http://127.0.0.1:5173/confirmar-email');await page.getByRole('heading',{name:'Confirme seu e-mail'}).waitFor();await snap('verification-initial');await keyboard('verification');
 await page.getByLabel('Código de confirmação').fill('123');await click('Confirmar e-mail');await snap('verification-invalid');await page.getByLabel('Código de confirmação').fill('123456');
 response={busy:true};await click('Confirmar e-mail');await page.getByRole('button',{name:'Verificando…'}).waitFor();await snap('verification-busy');await finishBusy();await snap('verification-error');
 response={network:true};await click('Confirmar e-mail');await page.getByRole('alert').waitFor();await snap('verification-network');
 response={busy:true};await click('Enviar outro código');await snap('verification-resend-busy');await finishBusy();
 response={status:429,code:'EMAIL_RATE_LIMITED',headers:{'Retry-After':'60'}};await click('Enviar outro código');await page.getByRole('button',{name:/Reenviar em/}).waitFor();await snap('verification-429');
 await page.goto('http://127.0.0.1:5173/confirmar-email');response={status:204};await click('Enviar outro código');await page.getByRole('button',{name:/Reenviar em/}).waitFor();await snap('verification-resend-success');
 if(width===1366&&height===768){await page.getByRole('status').evaluate(e=>e.textContent='Mensagem excepcional. '.repeat(40)+'x'.repeat(200));await snap('verification-long',true);}
 await page.getByLabel('Código de confirmação').fill('123456');await click('Confirmar e-mail');await page.getByRole('button',{name:'Entrar',exact:true}).waitFor();await snap('verification-done');
 await page.goto('http://127.0.0.1:5173/recuperar-senha');await page.getByLabel('E-mail').waitFor();await snap('request-initial');await keyboard('request');
 await click('Enviar código');await snap('request-required');await page.getByLabel('E-mail').fill('invalid');await click('Enviar código');await snap('request-invalid');await page.getByLabel('E-mail').fill('student@example.com');
 response={busy:true};await click('Enviar código');await page.getByRole('button',{name:'Aguarde…'}).waitFor();await snap('request-busy');await finishBusy();await snap('request-error');
 response={network:true};await click('Enviar código');await page.getByRole('alert').waitFor();await snap('request-network');
 response={status:202,body:{message:generic}};await click('Enviar código');await page.getByLabel('Código de recuperação').waitFor();await snap('code-initial');await keyboard('code');
 await page.getByLabel('Código de recuperação').fill('123');await click('Validar código');await snap('code-invalid');await page.getByLabel('Código de recuperação').fill('123456');
 response={busy:true};await click('Validar código');await page.getByRole('button',{name:'Aguarde…'}).waitFor();await snap('code-busy');await finishBusy();await snap('code-error');
 response={network:true};await click('Validar código');await page.getByRole('alert').waitFor();await snap('code-network');
 response={busy:true};await click('Enviar outro código');await snap('code-resend-busy');await finishBusy();await snap('code-resend-error');
 response={status:202,body:{message:generic}};await click('Enviar outro código');await page.getByRole('alert').waitFor({state:'detached'});await snap('code-resend-success');await page.getByLabel('Código de recuperação').fill('123456');
 response={status:204};await click('Validar código');await page.getByLabel('Nova senha').waitFor();await snap('password-initial');await keyboard('password');
 await page.getByLabel('Nova senha').fill('short');await click('Redefinir senha');await snap('password-invalid');await page.getByLabel('Nova senha').fill('long-enough-password');
 response={busy:true};await click('Redefinir senha');await page.getByRole('button',{name:'Aguarde…'}).waitFor();await snap('password-busy');await finishBusy();
 error('INVALID_RESET_GRANT');await click('Redefinir senha');await page.getByRole('alert').waitFor();await snap('password-expired');
 response={network:true};await click('Redefinir senha');await page.getByRole('alert').waitFor();await snap('password-uncertain');
 if(width===1366&&height===768){await page.getByRole('alert').evaluate(e=>e.textContent='Mensagem excepcional. '.repeat(40)+'x'.repeat(200));await snap('password-long',true);await keyboard('password-long');}
 response={status:204};await click('Redefinir senha');await page.getByRole('heading',{name:'Senha redefinida',exact:true}).waitFor();await snap('done');await keyboard('done');
 await page.close();
 console.log(`Passed ${theme} ${width}x${height} zoom ${zoom}: ${results.length} states total`);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 for(const theme of ['light','dark'])for(const [width,height] of sizes){const c=await browser.newContext({viewport:{width,height}});await run(c,theme,width,height,1);await c.close();}
 await browser.close();
 for(const theme of ['light','dark'])for(const [width,height] of sizes.slice(0,3)){
  const profile=fs.mkdtempSync(path.join(process.env.TEMP,'auth-zoom-'));fs.mkdirSync(path.join(profile,'Default'));
  fs.writeFileSync(path.join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}));
  const c=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:null,args:[`--window-size=${width+26},${height+93}`]});
  await run(c,theme,width,height,2);await c.close();
 }
 console.log(`All ${results.length} states passed. ${out}`);
})().catch(e=>{console.error(e);process.exit(1);});
