const {chromium}=require('C:/Users/vinic/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.join(process.env.TEMP,'edutrack-auth-refine'),results=[];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 for(const theme of ['light','dark'])for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[320,568],[375,667],[768,600],[1366,600]]){
  const page=await browser.newPage({viewport:{width,height}});await page.addInitScript(t=>localStorage.setItem('edutrack.theme',t),theme);
  let status=409;await page.route('**/auth/**',r=>{
   if(!/^\/(api\/)?auth\//.test(new URL(r.request().url()).pathname))return r.continue();
   return r.fulfill({status,headers:status===429?{'Retry-After':'60'}:{},contentType:'application/json',body:JSON.stringify({error:{code:status===409?'EMAIL_CONFLICT':status===401?'INVALID_CREDENTIALS':'AUTH_RATE_LIMITED'}})});
  });
  for(const mode of ['login','register']){
   await page.goto(`http://127.0.0.1:5173/acesso?mode=${mode}&account=updated&google=conflict`);
   const tab=page.getByRole('tab',{name:mode==='login'?'Entrar':'Criar conta',exact:true});await tab.focus();await page.keyboard.press('ArrowRight');
   await page.getByRole('heading',{name:mode==='login'?'Crie sua conta':'Entre na sua conta',exact:true}).waitFor();
   await page.keyboard.press('ArrowLeft');await page.getByRole('heading',{name:mode==='login'?'Entre na sua conta':'Crie sua conta',exact:true}).waitFor();
   if(await tab.getAttribute('aria-selected')!=='true')throw Error('Tabs keyboard selection');
   await page.getByLabel('E-mail',{exact:true}).fill('student@example.com');await page.getByLabel('Senha',{exact:true}).fill('long-enough-password');
   for(status of [mode==='login'?401:409,429]){
    await page.getByRole('button',{name:mode==='login'?'Entrar':'Criar conta',exact:true}).click();
    await page.getByRole('alert').last().filter({hasText:status===409?'Não foi possível usar este e-mail.':status===401?'E-mail ou senha inválidos.':'Aguarde 60 segundos'}).waitFor();
    const data=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));
    if(data.scrollWidth>width+1||(height>=768&&width>=1366&&data.scrollHeight>height+1))throw Error(JSON.stringify({theme,mode,status,...data}));
    const id=`${theme}-${width}x${height}-${mode}-http${status}`;results.push({id,...data});await page.screenshot({path:path.join(out,id+'.png'),fullPage:true});
   }
  }
  await page.close();
 }
 await browser.close();fs.writeFileSync(path.join(out,'errors.json'),JSON.stringify(results,null,2));console.log(`${results.length} exact HTTP error and keyboard cases passed`);
})().catch(e=>{console.error(e);process.exit(1)});
