# Resultado de Fabricación aceptado — V016.001

Rama de rescate del módulo original de `gburdesedev/Project-genesis` / `integration/v016001-resultado-creaciones-20261109`. **No modifica `index.html` ni el flujo del juego de backup V014.029.**

## Archivos y dependencias
- `genesis_result_dynamic_v001.js`: `window.GenesisResultDynamic` con `normalize`, `html`, `decorate`, `ORDER`.
- `genesis_result_dynamic_v001.css`: layout 16:9 en modal `#modal.genesisResultModal`.
- `assets/ui/resultado/oras/01_Base.png`, `02_Luz.png`, `03_Sombra.png`, `04_Fuego.png`, `05_Hielo.png`, `06_Naturaleza.png`, `07_Tierra.png`, `08_Rayo.png` y `manifest.sha256.json`. Son los PNG que utiliza realmente el navegador. Los .ora editables NO están en el paquete runtime.
- Poster espada aprobado: `assets/playcanvas/approved/equipment/espada_v03_hierro_v175_v12b_cycles_hdri32.png` (comprobar presencia en backup); el módulo no sustituye el GLB original por conceptos.

## Flujo NGE
En `performCraft()`: `raw=engine.fabricate(recipe,{craft,artisan,formula})`; `item=engine.present(raw,usedItemNames)`; `craftedItems.push(item)`; `refreshInventorySummary()`; abrir `modal(...,'craftModal')`; ejecutar `window.GenesisResultDynamic.decorate(modalBox,item,itemAssetMarkup)`; asignar onclick original de `resultContinue`.
El módulo no fabrica ni recalcula rarezas. Usa `item.name`, `item.rarity`, `item.recipe`, `item.channels`, `item.description`, `item.modelAsset`. Los pares `['Daño',valor]` o `['Protección',valor]` se presentan como Base. Muestra únicamente canales activos, sin técnicas secundarias. `itemAssetMarkup` es el adaptador de visualización del juego para otros objetos. `GenesisApprovedRuntimeModels` valida si se puede usar un GLB de espada aprobado; en otro caso usa póster V175/V12B.

## Conexión futura en backup (no aplicada)
En head: `<link rel="stylesheet" href="./genesis_result_dynamic_v001.css?v=016001">`.
Antes del script principal: `<script src="./genesis_result_dynamic_v001.js?v=016001"></script>`.
Justo después del modal de resultado y antes del `onclick` del botón:
```js
try { window.GenesisResultDynamic?.decorate?.(modalBox,item,itemAssetMarkup); }
catch(e) { console.error('Resultado aceptado: fallback al modal anterior',e); }
```
**Mantener el onclick original de Continuar**, que controla los pasos 10/11/12/13 y Comparación. No cambiar motor NGE, inventario ni otros menús.

## Validación pendiente antes de main
Comparar capturas con V016.001; probar primera espada Inútil (Base), segunda espada (2-3 canales), NGE, continuidad, inventario y Comparación. Validar SHA-256 con manifiesto. No fusionar a main sin autorización.

Evidencia: https://github.com/gburdesedev/Project-genesis/actions/runs/42625790522
