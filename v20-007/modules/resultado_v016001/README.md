# Recuperación del Resultado de fabricación V016.001

Fuente congelada: `preview/v016001/index.html` y `preview/v016001/genesis_result_dynamic_v001.{js,css}` de `main`. No se modifica el código original, ni `main`, ni `gh-pages`.

## Archivos recuperados
- `modules/resultado_v016001/genesis_result_dynamic_v001.js`: controlador auténtico `GenesisResultDynamic.decorate(modalBox, item, itemAssetMarkup)` que recibe el objeto real del motor, sin inventar canales ni efectos secundarios.
- `modules/resultado_v016001/genesis_result_dynamic_v001.css`: diseño responsive 16:9.
- ORA originales en `assets/ui/resultado/oras/01_Base.png` ... `08_Rayo.png`, sin duplicar ni recomprimir.
- El visor de espada reutiliza `preview/v016001/genesis_sword_runtime_v001.html` para evitar referencias rotas. Esta es **la única ruta modificada respecto al JavaScript de origen**.

## Enlace con el motor
La V016.001 llamaba `GenesisResultDynamic.decorate(modalBox,item,itemAssetMarkup)` inmediatamente después del resultado de `performCraft()`. El botón `#resultContinue` **lo enlaza el juego**, tras `decorate`, y avanza el tutorial/comparación. No reemplazar esos handlers.

## Pendiente antes de integrar
Este paquete es **recuperación aislada, no integración aprobada**. Probar en navegador los ORA, el visor real de espada y el avance del tutorial. El módulo exige `item.channels` generado realmente por el motor; el PNG de los ocho ORA permanece sin modificaciones. El visor recuperado es experimental y no sustituye por sí solo al GLB nuevo de V20.005. No alterar la pantalla de Fabricaciones al restaurar Resultado.
