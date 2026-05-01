# Architecture Design: AddProductScreen Redesign

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-30
- Target branches: fix/pos-header-slim, refactor/icon-catalog-categories, feat/unified-icon-color-picker, refactor/add-product-responsive

---

## Problem

AddProductScreen.js tiene 753 líneas. El flujo para elegir ícono y color del producto es poco intuitivo — hay dos rows separados ("Color de fondo" y "Elegir ícono") que abren modales independientes. Los íconos están en un array plano sin organización ni búsqueda, limitados a comida. La screen usa Alert.alert nativo (5 ocurrencias), useWindowDimensions directo en vez de useResponsive, y los overlays de modales usan TouchableOpacity (anti-patrón). Además, el header colapsable del POSScreen se siente grueso y debe adelgazarse.

---

## Solution

Cuatro PRs incrementales: adelgazar el header del POS, reorganizar íconos en categorías con buscador, unificar el picker de ícono+color en un solo modal, y migrar AddProductScreen a useResponsive eliminando Alert.alert y corrigiendo overlays.

---

## Changes

### fix/pos-header-slim

Reducir el grosor del header colapsable del POSScreen. Cambios en src/screens/POSScreen.js y src/utils/collapsibleHeader.js:

- Reducir paddingTop y paddingBottom del header
- Reducir el tamaño del statusDot
- Reducir fontSize del workerName
- Ajustar TAB_BAR_HEIGHT en collapsibleHeader.js si es necesario
- El header debe sentirse compacto pero legible, estilo Stripe/Toast POS

Verificación: abrir la app, el header expandido debe ocupar menos espacio vertical que antes. El colapso sigue funcionando igual.

### refactor/icon-catalog-categories

Reorganizar el array plano FOOD_ICONS en productConstants.js a un catálogo por categorías. Cada categoría tiene nombre en español y un array de íconos de MaterialCommunityIcons. Agregar buscador.

Renombrar FOOD_ICONS a ICON_CATALOG. La estructura es un array de objetos { category: string, icons: string[] }. Mantener el export FOOD_ICONS como alias del array plano (todos los íconos concatenados) para no romper consumidores existentes.

Categorías (~20 íconos cada una, pensadas para negocios salvadoreños — no solo comida):

1. Comida — pupusas, tamales, comida rápida, platos típicos. Íconos: food, food-variant, food-drumstick, food-steak, food-hot-dog, food-turkey, hamburger, french-fries, pizza, taco, noodles, pasta, rice, egg, egg-fried, fish, pot-steam, grill, silverware, silverware-fork-knife, food-outline, food-fork-drink, food-takeout-box, food-takeout-box-outline
2. Bebidas — refrescos, café, horchata, jugos, licuados. Íconos: coffee, coffee-to-go, tea, cup, cup-water, cup-outline, beer, beer-outline, bottle-wine, glass-wine, bottle-soda, bottle-soda-outline, bottle-soda-classic, kettle, blender, blender-outline, glass-mug, glass-mug-variant, water, water-outline
3. Panadería y Postres — pan francés, semitas, quesadillas de queso. Íconos: bread-slice, cake, cake-layered, cake-variant, cookie, cupcake, muffin, candy, candycane, pretzel, ice-cream, ice-pop, food-croissant, cookie-outline, cookie-edit, candy-outline, cake-variant-outline, ice-cream-outline, muffin-outline, baguette
4. Frutas y Verduras — mangos, jocotes, maracuyá, yuca. Íconos: fruit-watermelon, fruit-cherries, fruit-citrus, fruit-grapes, fruit-pineapple, fruit-pear, food-apple, food-apple-outline, mushroom, carrot, corn, chili-mild, chili-hot, leaf, sprout, tree, flower-tulip, seed, seed-outline, grain
5. Ropa y Accesorios — tiendas de ropa, zapaterías, accesorios. Íconos: tshirt-crew, tshirt-crew-outline, hanger, shoe-heel, shoe-sneaker, hat-fedora, glasses, watch, ring, necklace, bag-personal, bag-personal-outline, shopping, shopping-outline, purse, wallet, bowtie, sunglasses, crown, diamond-stone
6. Hogar y Ferretería — ferreterías, mueblerías, materiales. Íconos: hammer, wrench, screwdriver, saw-blade, tape-measure, paint-roller, lightbulb, lightbulb-outline, lamp, fan, toilet, shower, faucet, door, window-closed, chair-rolling, table-furniture, sofa, bed, toolbox
7. Salud y Belleza — farmacias, salones, barberías. Íconos: pill, medical-bag, stethoscope, bandage, thermometer, scissors-cutting, hair-dryer, spray, mirror, lotion, lipstick, nail, eye, hand-wash, tooth, face-woman, face-man, heart-pulse, spa, scale-bathroom
8. Tecnología — tiendas de celulares, electrónica, reparaciones. Íconos: cellphone, laptop, tablet, monitor, keyboard, mouse, headphones, speaker, camera, printer, usb, wifi, bluetooth, battery, chip, memory, router, television, gamepad-variant, phone-classic
9. Papelería y Oficina — librerías, papelerías, centros de impresión. Íconos: pencil, pen, notebook, book-open-variant, clipboard, file-document, folder, paperclip, ruler, calculator, briefcase, calendar, clock, desk-lamp, eraser, magnify, pin, stapler, tape-measure, chart-bar
10. Autos y Transporte — talleres, llanterías, repuestos. Íconos: car, car-outline, motorcycle, bicycle, bus, truck, gas-station, engine, tire, oil, car-battery, car-wash, steering, speedometer, traffic-light, road, parking, garage, tow-truck, car-wrench
11. Varios — lo que no encaja en otra categoría. Íconos: star, star-outline, heart, heart-outline, flower, flower-outline, leaf-maple, fire, lightning-bolt, emoticon-happy, emoticon-cool, gift, trophy, flag, puzzle, music, paw, earth, rocket, shield

Notas: Claude Code debe verificar que cada nombre de ícono exista realmente en MaterialCommunityIcons. Si un nombre no existe, buscar el equivalente más cercano. No inventar nombres.

Agregar función searchIcons(query) en productConstants.js que filtra íconos por nombre (match parcial, case-insensitive). Retorna array de { category, icons: filtered[] }.

Actualizar TODOS los consumidores de FOOD_ICONS:
- src/screens/AddProductScreen.js
- src/screens/ModeEditorScreen.js
- Cualquier test que importe FOOD_ICONS

### feat/unified-icon-color-picker

Crear src/components/IconColorPicker.js — componente modal que unifica la selección de ícono y color en una sola experiencia.

El componente recibe: visible, onClose, selectedIcon, selectedColor, onSelect(icon, color), title.

Layout del modal (BottomSheetModal como base):
- Arriba: preview del ícono actual con su color (el cuadrado grande, touchable para nada — es solo preview dentro del modal)
- Debajo del preview: fila horizontal de colores (CARD_COLORS). Tap en un color lo selecciona inmediatamente y el preview se actualiza en tiempo real.
- Debajo de los colores: barra de búsqueda (TextInput con ícono de lupa)
- Debajo del buscador: grid de íconos organizados por categoría. Cada categoría tiene su nombre como header (igual que las comandas). Si hay búsqueda activa, se filtran las categorías mostrando solo los resultados.
- El grid usa getIconCols y getIconBtnSize para ser responsive.
- Tap en un ícono lo selecciona, actualiza el preview, pero NO cierra el modal — el usuario puede seguir cambiando color e ícono hasta que esté satisfecho.
- Botón "Listo" al final para confirmar y cerrar.

En AddProductScreen.js:
- Eliminar los dos pickerRow separados ("Color de fondo" y "Elegir ícono")
- El iconPreviewWrap (cuadrado 96x96) se vuelve TouchableOpacity que abre el IconColorPicker
- Eliminar estados showColorPicker y showIconPicker — reemplazar con showIconColorPicker
- Eliminar el Modal de COLOR FONDO PRODUCTO (líneas 577-602)
- Eliminar el BottomSheetModal de ICON PICKER producto (líneas 512-539)

En ModeEditorScreen.js:
- Aplicar el mismo cambio donde se usa el icon picker para editar íconos de productos dentro de catálogos
- Reutilizar el mismo componente IconColorPicker

### refactor/add-product-responsive

Migrar AddProductScreen a useResponsive y limpiar anti-patrones:

- Reemplazar useWindowDimensions por useResponsive
- Reemplazar los 5 Alert.alert por snackbar o modales de confirmación custom (usando el patrón de la app)
- En los modales restantes (paleta de ingrediente/extra), reemplazar TouchableOpacity overlay por Pressable + StyleSheet.absoluteFill
- Verificar que funciona en portrait, landscape, phone y tablet

---

## Rules

1. Cada PR es independiente y mergeable por separado. El orden es estricto: fix/pos-header-slim → refactor/icon-catalog-categories → feat/unified-icon-color-picker → refactor/add-product-responsive
2. Cada PR debe dejar la app funcional y sin errores
3. Patrón de overlay en modales: Pressable + StyleSheet.absoluteFill para backdrop
4. Tests 0 fallos obligatorio en cada PR
5. Cada PR actualiza CLAUDE.md si cambia el conteo de tests o suites
6. Cada PR crea su propio retro en docs/feature_retros/
7. Antes de abrir cada PR, grep el repo entero para verificar que no quedan imports huérfanos ni referencias a código eliminado
8. Los nombres de íconos de MaterialCommunityIcons deben verificarse que existen. No inventar nombres.
9. FOOD_ICONS se mantiene como alias de compatibilidad del array plano. Los consumidores nuevos usan ICON_CATALOG.

---

## Verification

### fix/pos-header-slim
- Header expandido ocupa menos espacio vertical
- Header colapsable sigue funcionando (scroll down colapsa, scroll up expande)
- Se ve bien en portrait y landscape
- npm test 0 fallos

### refactor/icon-catalog-categories
- ICON_CATALOG tiene 11 categorías con ~20 íconos cada una
- FOOD_ICONS sigue existiendo como alias y contiene todos los íconos
- searchIcons('café') retorna resultados relevantes
- searchIcons('zapato') retorna íconos de la categoría Ropa
- Todos los consumidores siguen funcionando sin cambios visibles
- npm test 0 fallos

### feat/unified-icon-color-picker
- En AddProductScreen: tap en el preview abre UN modal con colores + categorías + buscador
- Cambiar color actualiza el preview en tiempo real dentro del modal
- Buscar "pizza" filtra los íconos correctamente
- Botón "Listo" cierra el modal con la selección
- No existen los dos rows separados de "Color de fondo" / "Elegir ícono"
- En ModeEditorScreen: mismo componente funciona para editar íconos de productos
- npm test 0 fallos

### refactor/add-product-responsive
- No hay Alert.alert en AddProductScreen
- Funciona en portrait y landscape, phone y tablet
- Los modales de paleta de ingrediente/extra cierran con tap en backdrop
- npm test 0 fallos
