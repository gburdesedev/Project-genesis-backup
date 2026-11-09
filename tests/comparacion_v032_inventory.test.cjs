/* V014.032: pruebas de dominio independientes del navegador. */
const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");

const window={
 GenesisPrototypeEngines:{recipes:{
  espada_hierro:{name:"Espada de hierro",mechanic:"damage"},
  espada_acero:{name:"Espada de acero",mechanic:"damage"},
  escudo_hierro:{name:"Escudo de hierro",mechanic:"protection"}
 }}
};
let lastHTML="";
const root={querySelectorAll:()=>[],querySelector:()=>null};
const document={querySelector:()=>root};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../genesis_comparacion_v032.js"),"utf8"),{window,document,console,Intl,Number,String,Array,Set,Map,RegExp});
const api=window.GenesisComparacionV032;
const swordA={recipe:"espada_hierro",name:"Espada A",rarity:"Bueno",channels:[["Daño",24],["Fuego",12],["Hielo",6]]};
const swordB={recipe:"espada_acero",name:"Espada B",rarity:"Excelente",channels:[["Daño",29],["Fuego",9],["Rayo",17]]};
const shield={recipe:"escudo_hierro",name:"Escudo",rarity:"Común",channels:[["Protección",12],["Tierra",8]]};
const nav={renderMenu(){},renderWorkspace(){},close(){}};
function ctx(items){
 return {getItems:()=>items,renderAsset:item=>'<img src="assets/playcanvas/approved/equipment/espada_v03_hierro_v175_v12b_cycles_hdri32.png">',modal:html=>{lastHTML=html},profession:"Herrero"};
}
test("La nueva Comparacion V5 no toca ni inventa items",()=>{
 const a=[swordA,swordB,shield];const before=JSON.stringify(a);
 const c=ctx(a);assert.equal(api.render(c,nav),true);
 assert.equal(JSON.stringify(a),before);
 assert.match(lastHTML,/Arrastrá aquí una fabricación/);
 assert.match(lastHTML,/Pestana_Comparacion\.png/);
 assert.match(lastHTML,/01_Base\.png/);
 assert.match(lastHTML,/08_Rayo\.png/);
 assert.doesNotMatch(lastHTML,/PROJECT GENESIS/);
});
test("Una vitrina vacia no muestra ninguna espada preseleccionada",()=>{
 const c=ctx([swordA,swordB]);api.render(c,nav);
 assert.equal(c.__genesisComparisonV032.a,null);
 assert.equal(c.__genesisComparisonV032.b,null);
 assert.match(lastHTML,/Vacío/);
});
test("Sin fabricaciones tampoco inventa espadas",()=>{
 const c=ctx([]);api.render(c,nav);
 assert.match(lastHTML,/Todavía no fabricaste objetos/);
 assert.equal((lastHTML.match(/class="gCmpSlot is-empty"/g)||[]).length,20);
});
test("Solo objetos de la misma familia son compatibles",()=>{
 assert.equal(api.familyOf(swordA),"Espadas");
 assert.equal(api.familyOf(swordB),"Espadas");
 assert.equal(api.familyOf(shield),"Escudos");
 assert.equal(api.compatible(swordA,swordB),true);
 assert.equal(api.compatible(swordA,shield),false);
 assert.equal(api.compatible(swordA,swordA),false);
});
test("Base reconoce daño y proteccion; no convierte ausencia en cero",()=>{
 const a=api.channelMap(swordA),s=api.channelMap(shield);
 assert.equal(a.get("Base").value,24);
 assert.equal(s.get("Base").value,12);
 assert.equal(a.has("Tierra"),false);
});
test("Canales dinamicos respetan el orden y las diferencias reales",()=>{
 const rows=api.rowsFor(swordA,swordB);
 assert.deepEqual(Array.from(rows,x=>x.name),["Base","Fuego","Hielo","Rayo"]);
 assert.equal(rows[0].delta,5);
 assert.equal(rows[1].delta,-3);
 assert.equal(rows[2].delta,null);
 assert.equal(rows[3].delta,null);
 assert.equal(rows[2].vb,null);
});
test("Dos fabricaciones elegidas muestran valores sin inventar ausencias",()=>{
 const c=ctx([swordA,swordB,shield]);
 c.__genesisComparisonV032={family:"Espadas",a:0,b:1,info:""};
 api.render(c,nav);
 assert.match(lastHTML,/(\+5|>5<)/);
 assert.match(lastHTML,/(\-3|>−3<)/);
 assert.match(lastHTML,/data-cmp-channel="Hielo"/);
 assert.doesNotMatch(lastHTML,/data-cmp-channel="Tierra"/);
 assert.equal(lastHTML.includes("escudo_hierro"),false);
});
test("El cambio de familia invalida selecciones incompatibles",()=>{
 const c=ctx([swordA,swordB,shield]);c.__genesisComparisonV032={family:"Escudos",a:0,b:1,info:""};
 api.render(c,nav);assert.equal(c.__genesisComparisonV032.a,null);assert.equal(c.__genesisComparisonV032.b,null);
});
test("La vista opera con las diez casillas por cada lado",()=>{
 const c=ctx([swordA,swordB]);api.render(c,nav);
 assert.equal((lastHTML.match(/class="gCmpSlot is-empty"/g)||[]).length,16);
 assert.equal((lastHTML.match(/data-cmp-side="a"/g)||[]).length,2);
 assert.equal((lastHTML.match(/data-cmp-side="b"/g)||[]).length,2);
});
