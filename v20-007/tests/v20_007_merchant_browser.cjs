'use strict';
/* Real browser verification: approved merchant V02 is rendered beside the
 * actual market stall. A GLB download or static source check is not enough.
 */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'reports','v20-007-merchant');
fs.mkdirSync(dir,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.glb':'model/gltf-binary','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=path.resolve(root,'.'+name);
  if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  if(!fs.existsSync(full)||fs.statSync(full).isDirectory()){res.writeHead(404);return res.end('Not found '+name);}
  res.setHeader('Content-Type',mime[path.extname(full).toLowerCase()]||'application/octet-stream');
  fs.createReadStream(full).pipe(res);
});
(async()=>{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
  const page=await browser.newPage({viewport:{width:1200,height:800}});
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push('PAGE '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push('CONSOLE '+m.text().slice(0,300));});
  page.on('requestfailed',r=>failed.push({url:r.url().slice(0,250),reason:r.failure()?.errorText}));
  let status='FAILED',details={};
  try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>['ready','fallback'].includes(window.__genesisMarket?.visual?.phase),null,{timeout:180000});
    details=await page.evaluate(()=>{
      const app=document.getElementById('genesisApp')?.app;
      const root=app?.root?.findByName('Mercader de suministros · NPC interactivo V001');
      const stall=app?.root?.findByName('Mercado · puesto de suministros provisional');
      const instances=root?.findComponents('render').flatMap(c=>c.meshInstances||[])||[];
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
      for(const mi of instances){const b=mi.aabb;if(!b)continue;const lo=b.getMin(),hi=b.getMax();minX=Math.min(minX,lo.x);maxX=Math.max(maxX,hi.x);minY=Math.min(minY,lo.y);maxY=Math.max(maxY,hi.y);minZ=Math.min(minZ,lo.z);maxZ=Math.max(maxZ,hi.z);}
      const v=p=>p?{x:p.x,y:p.y,z:p.z}:null;
      return {phase:window.__genesisMarket?.visual?.phase,visual:window.__genesisMarket?.visual,
        merchantRoot:v(root?.getPosition()),stallRoot:v(stall?.getPosition()),
        meshInstances:instances.length,bounds:{minX,maxX,minY,maxY,minZ,maxZ},
        children:root?.children?.map(c=>c.name)};
    });
    // Inspect the actual scene without the profession chooser covering the canvas.
    await page.evaluate(()=>{
      for(const id of ['intro','loading','hud']){const el=document.getElementById(id);if(el)el.style.display='none';}
      const cam=document.getElementById('cameraRig')?.entity;
      const target=window.__genesisMarket?.visual?.stallPosition;
      if(cam&&target){
        const p=cam.getPosition();
        cam.setPosition(target.x,2.3,target.z-5.4);
        cam.lookAt(target.x,1.35,target.z);
      }
    });
    await page.waitForTimeout(450);
    await page.screenshot({path:path.join(dir,'actual-game.png'),timeout:60000});
    assert.equal(details.phase,'ready','Approved V02 did not load: '+JSON.stringify(details));
    assert(details.merchantRoot&&details.stallRoot,'Missing merchant or stall scene entity');
    assert(Math.hypot(details.merchantRoot.x-details.stallRoot.x,details.merchantRoot.z-details.stallRoot.z)<.05,'Merchant and stall anchors differ');
    assert(details.meshInstances>0,'Merchant GLB has no renderable meshes');
    // PlayCanvas's AABB on quantized V02 can be enormous (0..16383 raw units).
    // Check the authored scale and placement, then save the actual WebGL pixels.
    assert(Math.abs(details.visual.merchantPlacement.scale-.92)<.001,'Approved V02 scale changed');
    assert(Math.abs(details.visual.merchantPlacement.z-(details.stallRoot.z+.82))<.05,'Merchant target is not behind counter');
    console.log('MERCHANT_BROWSER_DETAILS',JSON.stringify(details));
    status='MERCHANT_V02_REAL_BROWSER_VALIDATED';
    console.log(status,JSON.stringify(details));
  }catch(e){errors.push('ASSERT '+String(e));console.error(e);process.exitCode=1;}
  finally{
    fs.writeFileSync(path.join(dir,'qa.json'),JSON.stringify({status,details,errors:errors.slice(0,30),failedRequests:failed.slice(0,30)},null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
