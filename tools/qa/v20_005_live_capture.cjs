'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const output = path.resolve(__dirname, '../../qa-results/v20-005-live');
fs.mkdirSync(output, {recursive:true});
const target='https://gburdesedev.github.io/Project-genesis-backup/v20-005/';
const issues=[], captures=[], status={target, started:new Date().toISOString(), issues,captures};
function slug(name){return path.join(output,name+'.png')}
async function grab(page,name){
  try{
    await page.screenshot({path:slug(name),fullPage:false,timeout:30000,animations:'disabled'});
    captures.push({name,url:page.url(),title:await page.title(),at:new Date().toISOString()});
    console.log('SCREENSHOT',name);
  }catch(e){issues.push('screenshot '+name+': '+e.message)}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 page.on('pageerror', e=>issues.push('JS '+e.message));
 page.on('console', m=>{if(m.type()==='error')issues.push('CONSOLE '+m.text().slice(0,500))});
 page.on('requestfailed',r=>issues.push('NETWORK '+r.url().slice(0,240)+' '+r.failure()?.errorText));
 try {
  const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:90000});
  status.httpStatus=response?.status()||null;
  await page.waitForTimeout(4500);
  status.build=await page.locator('meta[name="genesis-build"]').getAttribute('content').catch(()=>null);
  await grab(page,'01-inicio-real');
  let state=await page.evaluate(()=>({
   loading:document.querySelector('#loading')?.style.display,
   intro:document.querySelector('#prototypeIntro')?.style.display,
   professions:[...document.querySelectorAll('[data-profession]')].map(x=>({text:x.textContent?.trim().slice(0,80),visible:!!(x.offsetWidth||x.offsetHeight||x.getClientRects().length)})),
   boot:window.__genesisBoot,
   errors:window.__GENESIS_RUNTIME_ERRORS||[],
   modal:document.querySelector('#modal')?.innerText?.slice(0,300)
  }));
  status.initialState=state;
  console.log('STATE_INITIAL',JSON.stringify(state));
  if(process.env.GENESIS_CAPTURE_INTRO_ONLY==='1'){
    status.note='Real public page captured; deeper route test separated to prevent browser/GPU failure from losing photos';
    return;
  }
  if(await page.locator('[data-profession="Herrero"]').count()){
   await page.locator('[data-profession="Herrero"]').click({timeout:30000});
   status.clickedHerrero=true;
   for(let i=0;i<6;i++){
    await page.waitForTimeout(12000);
    if(i===1)await grab(page,'02-herrero-cargando');
    if(i===5)await grab(page,'03-herrero-tras-carga');
    const cur=await page.evaluate(()=>({
      loading:document.querySelector('#loading')?.style.display,
      intro:document.querySelector('#prototypeIntro')?.style.display,
      loadText:document.querySelector('#loadDetail')?.textContent?.slice(0,200),
      modal:document.querySelector('#modal')?.innerText?.slice(0,250),
      boot:window.__genesisBoot,
      errors:window.__GENESIS_RUNTIME_ERRORS?.slice(-4)
    }));
    console.log('STATE_HERRERO_'+i,JSON.stringify(cur));
    status.lastState=cur;
    if((cur.errors?.length||0)>15)break;
   }
   const dialogButtons=await page.locator('#modal button:visible').allTextContents().catch(()=>[]);
   status.dialogButtons=dialogButtons;
   const modal=page.locator('#modalLayer');
   if(await modal.isVisible().catch(()=>false)){
     for(let step=0;step<5;step++){
       const b=page.locator('#modal button:visible').first();
       if(!(await b.count()))break;
       const label=await b.innerText().catch(()=>null);
       await b.click({timeout:6000}).catch(e=>issues.push('dialog click '+e.message));
       await page.waitForTimeout(1000);
       status['dialogClick'+step]=label;
     }
     await grab(page,'04-herrero-dialogos');
   }
   const inv=page.locator('#inventoryTouch');
   status.inventoryButtonVisible=await inv.isVisible().catch(()=>false);
   if(status.inventoryButtonVisible) {
     await inv.click({timeout:5000,force:true}).catch(e=>issues.push('inventory touch '+e.message));
     await page.waitForTimeout(1500);
     await grab(page,'05-inventario-interaccion');
   }
  } else {
    status.clickedHerrero=false;
    await page.waitForTimeout(15000);
    await grab(page,'02-inicio-tras-espera');
  }
 } catch(e) {
  issues.push('FATAL '+e.stack);
  await grab(page,'99-error-browser');
 } finally {
  status.finished=new Date().toISOString();
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(status,null,2));
  await browser.close();
 }
})();
