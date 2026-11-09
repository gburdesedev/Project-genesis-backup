/* Project Genesis V014.032 — Comparacion V5, adaptador del inventario real.
 * Fuente: ctx.getItems() del juego; NO crea objetos ni modifica el inventario.
 * Arte: cuatro pestanas originales y ocho PNG originales extraidos de ORA.
 * Aprobacion: arte V5; runtime experimental, NO aprobado funcionalmente.
 */
(function (g) {
 "use strict";
 const ROOT="assets/ui/preparacion/01_Capas/Pestanas/";
 const ORA="assets/ui/resultado/oras/";
 const tabs=[["Inventario","Pestana_Inventario.png"],["Preparacion","Pestana_Preparacion.png"],["Fabricaciones","Pestana_Fabricaciones.png"],["Comparacion","Pestana_Comparacion.png"]];
 const channels=[["Base","01_Base.png"],["Luz","02_Luz.png"],["Sombra","03_Sombra.png"],["Fuego","04_Fuego.png"],["Hielo","05_Hielo.png"],["Naturaleza","06_Naturaleza.png"],["Tierra","07_Tierra.png"],["Rayo","08_Rayo.png"]];
 const validNames=new Set(channels.map(x=>x[0]));
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const safeNum=x=>typeof x==="number"&&Number.isFinite(x)?x:((typeof x==="string"&&x.trim()!=="")?Number(x):NaN);
 const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(n):"—";
 function familyOf(item){
   const rec=g.GenesisPrototypeEngines?.recipes?.[item?.recipe]||{};
   const src=String([item?.recipe,rec.id,rec.family,rec.type,rec.name,item?.type].filter(Boolean).join(" ")).toLowerCase();
   if(/espad|sword/.test(src))return "Espadas";
   if(/escud|shield/.test(src))return "Escudos";
   if(/armadur|armor/.test(src))return "Armaduras";
   if(/hacha|axe/.test(src))return "Hachas";
   if(/arco|bow/.test(src))return "Arcos";
   if(/bota|boot/.test(src))return "Botas";
   if(/casco|helmet/.test(src))return "Cascos";
   if(/guante|glove/.test(src))return "Guantes";
   return rec.family||rec.name||String(item?.recipe||"Otra familia");
 }
 function getItems(ctx){
   const items=typeof ctx?.getItems==="function"?ctx.getItems():[];
   return Array.isArray(items)?items.filter(x=>x&&typeof x==="object"&&x.recipe&&Array.isArray(x.channels)): [];
 }
 function channelMap(item){
   const map=new Map();
   const data=Array.isArray(item?.channels)?item.channels:[];
   data.forEach((c,i)=>{
     if(!Array.isArray(c)||c.length<2)return;
     let name=String(c[0]||"").trim();
     if(i===0)name="Base"; // Primer canal: dano o proteccion segun receta.
     if(!validNames.has(name)||map.has(name))return;
     const n=safeNum(c[1]);
     if(Number.isFinite(n))map.set(name,{value:n,channel:c,index:i});
   });
   return map;
 }
 function rowsFor(a,b){
   if(!a&&!b)return channels.map(([name,file])=>({name,file,va:null,vb:null,delta:null}));
   const ma=channelMap(a),mb=channelMap(b);
   const keys=[...new Set([...ma.keys(),...mb.keys()])];
   keys.sort((x,y)=>x==="Base"?-1:y==="Base"?1:0); // conserva el orden generado; Base siempre primero.
   return keys.map(name=>{
     const ca=ma.get(name),cb=mb.get(name);
     return {name,file:channels.find(x=>x[0]===name)?.[1],va:ca?.value??null,vb:cb?.value??null,delta:ca&&cb?cb.value-ca.value:null,ca,cb};
   });
 }
 function compatible(a,b){return !!a&&!!b&&a!==b&&familyOf(a)===familyOf(b);}
 // V20.006: real approved asset images, not a glyph or unrelated placeholder.
 // Thumbnail rendering must not embed model-viewer inside the small list cells.
 const SWORD_POSTER="assets/playcanvas/approved/equipment/espada_v03_hierro_v175_v12b_cycles_hdri32.png";
 const SHIELD_POSTER="assets/ui/fabricaciones_ora_v004/V015_REAL_SHIELD_ICON_RGBA.png";
 function poster(ctx,item){
   if(item?.recipe==="espada_hierro")return '<img loading="lazy" alt="Espada V175 V12B real" src="'+SWORD_POSTER+'">';
   if(item?.recipe==="escudo_hierro")return '<img loading="lazy" alt="Escudo V015 real" src="'+SHIELD_POSTER+'">';
   try{
     const asset=typeof ctx.renderAsset==="function"?String(ctx.renderAsset(item)||""):"";
     const m=asset.match(/<img\\b[^>]*\\bsrc=["']([^"']+)["']/i);
     if(m&&/^(?:\\.\\/)?assets\\//.test(m[1]))return '<img loading="lazy" alt="" src="'+esc(m[1])+'">';
   }catch(e){console.warn("[Genesis Comparacion] Miniatura no disponible",e);}
   return '<span class="gCmpSlotUnavailable" aria-label="Sin miniatura">Sin imagen</span>';
 }
 function itemAffinity(item){
   const values=[...(Array.isArray(item?.affinities)?item.affinities:[]),...(Array.isArray(item?.channels)?item.channels.slice(1):[])];
   for(const v of values){
     const n=String(Array.isArray(v)?v[0]:"").toLowerCase();
     if(n==="fuego"||n==="rayo"||n==="hielo")return n;
   }
   return "";
 }
 function hero(ctx,item){
   if(!item)return '<div class="gCmpEmpty"><span class="gCmpEmptyMark" aria-hidden="true">◇</span><span>Arrastrá aquí una fabricación</span></div>';
   let art="";
   try{art=typeof ctx.renderAsset==="function"?String(ctx.renderAsset(item)||""):"";}catch(e){console.warn("[Genesis Comparacion] Asset no disponible",e);}
   return '<div class="gCmpHeroArt" data-affinity="'+itemAffinity(item)+'">'+(art||'<span>Asset no disponible</span>')+'</div><div class="gCmpHeroCaption"><b>'+esc(item.name||item.recipe)+'</b><span>'+esc(item.rarity||"")+'</span></div>';
 }
 function render(ctx,nav){
   if(!ctx||!nav||typeof ctx.modal!=="function")return false;
   const all=getItems(ctx);
   const families=[...new Set(all.map(familyOf))];
   const state=ctx.__genesisComparisonV032||(ctx.__genesisComparisonV032={family:null,a:null,b:null,info:""});
   if(!families.includes(state.family))state.family=families.includes("Espadas")?"Espadas":(all[ctx.compareA]?familyOf(all[ctx.compareA]):(families[0]||"Espadas"));
   const pool=all.map((item,index)=>({item,index})).filter(x=>familyOf(x.item)===state.family);
   const get=id=>pool.find(x=>x.index===id)?.item||null;
   if(!get(state.a))state.a=null;
   if(!get(state.b))state.b=null;
   if(state.a===state.b)state.b=null;
   const a=get(state.a),b=get(state.b);
   const ok=compatible(a,b);
   const rows=rowsFor(a,b);
   const tabsHtml=tabs.map(([tab,png])=>'<button type="button" data-cmp-nav="'+tab+'" class="gCmpTab'+(tab==="Comparacion"?" is-active":"")+'" aria-label="'+esc(tab)+'" '+(tab==="Comparacion"?'aria-current="page"':"")+'><img src="'+ROOT+png+'" alt="'+esc(tab)+'"></button>').join("");
   const familiesHtml=(families.length?families:["Espadas"]).map(x=>'<option value="'+esc(x)+'"'+(x===state.family?" selected":"")+'>'+esc(x)+'</option>').join("");
   function list(side){
     let html="";
     const selected=side==="a"?state.a:state.b;
     const count=Math.max(10,pool.length);
     for(let i=0;i<count;i++){
       const entry=pool[i];
       if(!entry){html+='<div class="gCmpSlot is-empty" aria-hidden="true"><span class="gCmpSlotThumb"></span><span>Vacío</span></div>';continue;}
       const it=entry.item,sel=selected===entry.index;
       html+='<button type="button" class="gCmpSlot'+(sel?" is-selected":"")+'" draggable="true" data-cmp-index="'+entry.index+'" data-cmp-side="'+side+'" title="'+esc(it.name||it.recipe)+'"><span class="gCmpSlotThumb">'+poster(ctx,it)+'</span><span class="gCmpSlotText"><b>'+esc(it.name||it.recipe)+'</b><small>'+esc(it.rarity||"Fabricado")+'</small></span></button>';
     }
     return '<section class="gCmpListColumn" aria-label="Fabricaciones disponibles para '+(side==="a"?"1":"2")+'"><h3>Seleccionar fabricación</h3><label class="gCmpFamilyLabel">Familia <select data-cmp-family="'+side+'">'+familiesHtml+'</select></label><div class="gCmpSlots" role="list">'+html+'</div><small class="gCmpListCount">'+pool.length+' fabricación'+(pool.length===1?"":"es")+' de esta familia · clic o arrastrar</small></section>';
   }
   const rowsHtml=rows.length?rows.map(row=>{
     const d=row.delta;
     const dc=d===null?"":d>0?"is-positive":d<0?"is-negative":"is-neutral";
     return '<div class="gCmpChannelRow" data-cmp-channel="'+row.name+'"><output class="gCmpChannelValue">'+(row.va===null?"—":fmt(row.va)+(row.name==="Base"?"":"%"))+'</output><img class="gCmpORA" alt="'+esc(row.name)+'" src="'+ORA+row.file+'"><output class="gCmpDelta '+dc+'" aria-label="Diferencia de '+esc(row.name)+'">'+(d===null?"—":(d>0?"+":"")+fmt(d)+(row.name==="Base"?"":"%"))+'</output><output class="gCmpChannelValue">'+(row.vb===null?"—":fmt(row.vb)+(row.name==="Base"?"":"%"))+'</output></div>';
   }).join(""):'<div class="gCmpNoChannels">Estos objetos no contienen canales comparables.</div>';
   const notice=state.info||(!all.length?"Todavía no fabricaste objetos. Las casillas se llenarán con tus creaciones reales.":!a&&!b?"Seleccioná o arrastrá dos fabricaciones de la misma familia.":!ok?"Elegí un objeto diferente para la segunda vitrina.":"Comparación de canales de fabricaciones existentes; las ausencias se muestran como —.");
   const button=ctx.onComparisonContinue?'<button type="button" class="gCmpContinue" data-cmp-continue '+(ok?"":"disabled")+'>Continuar recorrido</button>':'<button type="button" class="gCmpContinue" data-cmp-inventory>Ir a Inventario</button>';
   ctx.modal('<div class="gCmpRoot" data-cmp-v="032"><nav class="gCmpNav" aria-label="Menús del artesano">'+tabsHtml+'</nav><div class="gCmpMain">'+list("a")+'<section class="gCmpViewer" data-cmp-drop="a" aria-label="Vitrina de fabricación 1"><h3>Fabricación 1</h3><div class="gCmpDrop">'+hero(ctx,a)+'</div></section><section class="gCmpCenter" aria-label="Comparación de canales"><h2>Comparación</h2><div class="gCmpChannelHeader"><span>FAB. 1</span><span>CANAL ORIGINAL</span><span>Δ</span><span>FAB. 2</span></div><div class="gCmpChannelRows" data-cmp-rows="'+rows.length+'">'+rowsHtml+'</div></section><section class="gCmpViewer" data-cmp-drop="b" aria-label="Vitrina de fabricación 2"><h3>Fabricación 2</h3><div class="gCmpDrop">'+hero(ctx,b)+'</div></section>'+list("b")+'</div><footer class="gCmpFooter"><div class="gCmpNotice" role="status" aria-live="polite">'+esc(notice)+'</div>'+button+'</footer></div>','preparationModal genesisApprovedModal gCmpV032Modal');
   const root=document.querySelector(".gCmpRoot");if(!root)return false;
   function choose(side,index){
     const found=pool.find(x=>x.index===index);
     if(!found)return;
     if(side==="a"&&state.b===index||side==="b"&&state.a===index){state.info="No se puede comparar una fabricación consigo misma.";render(ctx,nav);return;}
     state[side]=index;state.info="";render(ctx,nav);
   }
   root.querySelectorAll("[data-cmp-nav]").forEach(el=>el.addEventListener("click",()=>{const tab=el.dataset.cmpNav;if(tab==="Comparacion")return;if(tab==="Preparacion")nav.renderMenu();else nav.renderWorkspace(tab);}));
   root.querySelectorAll("[data-cmp-family]").forEach(el=>el.addEventListener("change",()=>{state.family=el.value;state.a=null;state.b=null;state.info="";render(ctx,nav);}));
   root.querySelectorAll("[data-cmp-index]").forEach(el=>{
     const idx=Number(el.dataset.cmpIndex),side=el.dataset.cmpSide;
     el.addEventListener("click",()=>choose(side,idx));
     el.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",String(idx));e.dataTransfer.effectAllowed="copy";});
   });
   root.querySelectorAll("[data-cmp-drop]").forEach(el=>{
     el.addEventListener("dragover",e=>{if(e.dataTransfer.types.includes("text/plain")){e.preventDefault();e.dataTransfer.dropEffect="copy";}});
     el.addEventListener("drop",e=>{e.preventDefault();const raw=e.dataTransfer.getData("text/plain");if(!/^\d+$/.test(raw))return;choose(el.dataset.cmpDrop,Number(raw));});
   });
   const cont=root.querySelector("[data-cmp-continue]");
   if(cont)cont.addEventListener("click",()=>{if(!compatible(get(state.a),get(state.b)))return;const done=ctx.onComparisonContinue;nav.close();if(typeof done==="function")done();});
   const inventory=root.querySelector("[data-cmp-inventory]");
   if(inventory)inventory.addEventListener("click",()=>nav.renderWorkspace("Inventario"));
   return true;
 }
 g.GenesisComparacionV032=Object.freeze({render,familyOf,channelMap,rowsFor,compatible,version:"V014.032-COMPARACION-V05"});
})(window);
