# Etapa 3 — Mercenario ML13 (integración progresiva)

Fuente de referencia: `gburdesedev/Project-genesis`, rama `experiment/mercenario-ml13-vfx-preview-clock-fix-20261109`.

**No fusionar el index.html de esa rama.** Contiene numerosas modificaciones ajenas al mercenario. Mantener V014.029 y Fabricaciones del backup.

## Pasos con puertas de validación

1. **ML10 equipo/UI**: extraer `mercenary_4t_runtime_ml06.js/css`, assets de `assets/ui/mercenary/4t/`, ORA `assets/ui/resultado/oras/`, V050 GLB, espada V12B, escudo V015. Conectar el controlador al estado real del juego y verificar que cambiar equipo no altere ambos slots ni genere estadísticas falsas. Capturas 16:9.
2. **ML13 VFX**: solo después de aprobar el paso 1, extraer `mercenary_channel_vfx_ml11.mjs` y sus dependencias `vfx/approved/` y `vfx/experimental/`. Verificar Fuego, Hielo y Rayo, animación temporal, que el efecto no se aplique al cuerpo del mercenario y que la degradación sin WebGL sea segura.
3. **Comparación independiente**: no mezclar con este cambio; comparar canales y estadísticas reales con el módulo de Comparación en su propia rama.

## Estado

Esta rama es un punto de preparación y NO está publicada ni aprobada. Antes de publicar ejecutar pruebas reales de equipamiento, assets 404, navegador, capturas y control de regresiones (Fabricaciones, Resultado, Continuar, inventario). No tocar el main del repositorio original.
