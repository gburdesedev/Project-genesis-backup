/* Project Genesis V20.007 — PlayCanvas fountain V011 runtime water correction.
 * Runtime-only PBR fallback for the approved GLB. The original GLB, textures,
 * 32-bit Blender HDRI render preset, meshes and animations remain unchanged.
 * Water normals are not albedo: rebuild only AGUA_ materials to avoid violet
 * transmission/texture artefacts when the WebGL scene has no environment IBL.
 */
import { StandardMaterial, Color, BLEND_NORMAL, CULLFACE_NONE } from 'playcanvas';

const status={phase:'waiting',waterMeshes:0,normalMaps:0,animation:'GLB',error:null};
window.__genesisFountainWater=status;

async function installFountainWater(){
  const element=document.getElementById('genesisFountainV011Model');
  const app=document.getElementById('genesisApp')?.app;
  if(!element||!app)throw new Error('Fountain model or PlayCanvas app missing');
  await element.ready();
  const root=element.contentEntity;
  if(!root)throw new Error('Fountain V011 GLB was not instantiated');
  const animated=[];
  for(const component of root.findComponents('render')){
    for(const mesh of component.meshInstances||[]){
      const original=mesh.material;
      if(!original||!/AGUA_/i.test(original.name||''))continue;
      const pool=/Estanque/i.test(original.name);
      const foam=/Espuma/i.test(original.name);
      const material=new StandardMaterial();
      material.name=original.name+'_GENESIS_V20_007_WEBGL_WATER';
      material.diffuse=pool?new Color(.095,.195,.21):foam?new Color(.65,.76,.76):new Color(.30,.52,.57);
      material.specular=new Color(.42,.47,.49);
      material.emissive=new Color(.006,.012,.014);
      material.gloss=pool?.77:foam?.38:.84;
      material.useMetalness=false;
      material.metalness=0;
      material.opacity=pool?.80:foam?.68:.76;
      material.blendType=BLEND_NORMAL;
      material.depthWrite=false;
      material.cull=CULLFACE_NONE;
      material.useLighting=true;
      if(original.normalMap){
        material.normalMap=original.normalMap;
        material.bumpiness=pool?.17:.13;
        material.normalMapTiling.set(pool?3.1:2.5,pool?3.1:2.5);
        animated.push({material,pool});
        status.normalMaps++;
      }
      material.update();
      mesh.material=material;
      status.waterMeshes++;
    }
  }
  if(!status.waterMeshes)throw new Error('No AGUA_ materials found in fountain V011 GLB');
  let elapsed=0,accumulated=0;
  if(animated.length)app.on('update',dt=>{
    elapsed=(elapsed+Math.max(0,dt))%8;
    accumulated+=dt;
    if(accumulated<.08)return;
    accumulated=0;
    for(const {material,pool} of animated){
      material.normalMapOffset.set(pool?elapsed*.125:0,pool?-elapsed*.125:elapsed*.25);
      material.update();
    }
  });
  status.phase='ready';
  console.info('Genesis fountain V011 water correction active',status);
}

installFountainWater().catch(error=>{
  status.phase='error';status.error=String(error);
  console.warn('Genesis fountain V011 water correction failed',error);
});
