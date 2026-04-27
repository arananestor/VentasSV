# Architecture Design: POS Focus Lockdown

## Document Status

- Status: Proposed
- Owner: Nestor Arana
- Date: 2026-04-23
- Target branch: refactor/pos-focus-lockdown

---

## Problem

VentasSV tiene funciones que no tocan directa o indirectamente el sistema POS. Estas distraen del objetivo: sacar un POS funcional y pulido. Necesitamos bloquear visualmente solo lo que NO es POS, sin borrar nada.

---

## Solution

Agregar pantallas placeholder "PRÓXIMAMENTE" solo en las funciones que no son POS. Todo lo que toca ventas, productos, catálogos, configuración de cobro, o información del dueño se queda intacto.

---

## Changes

### 1. Bloquear tab Comandas (App.js)
- El tab Comandas en MainTabs renderiza OrdersScreen directamente
- Reemplazar el componente del tab con un componente placeholder que muestre un ícono de clipboard, el texto "COMANDAS" y debajo "PRÓXIMAMENTE" con estilo sutil
- El tab sigue visible en la barra pero su contenido es solo el placeholder
- No se elimina OrdersScreen ni ningún import — solo se desconecta del tab

### 2. Bloquear gestión de empleados en ProfileScreen (src/screens/ProfileScreen.js)
- La sección EQUIPO (lista de workers con PINs, DUIs) y el botón "Agregar empleado" se bloquean
- Reemplazar la sección EQUIPO completa y el botón "Agregar empleado" con un card que diga "EQUIPO" con ícono de users y "PRÓXIMAMENTE" debajo
- Mantener intacto: tarjeta de perfil del dueño, tema, cambiar turno/cerrar sesión, configuración de cobro, catálogos — todo eso es POS
- El modal de agregar empleado se puede dejar en el código pero sin forma de abrirlo

### 3. Bloquear ManageTabs (src/screens/POSScreen.js o donde se acceda)
- Encontrar dónde se navega a ManageTabs y reemplazar el botón/acceso con un indicador "PRÓXIMAMENTE" o simplemente ocultar el acceso
- No borrar ManageTabsScreen ni su ruta en el navigator

---

## Rules

1. NADA se borra — solo se desconecta visualmente
2. Todos los imports y archivos de las funciones bloqueadas permanecen en su lugar
3. Los placeholders usan ThemeContext para colores
4. Los placeholders siguen el estilo visual de la app: ícono + título + subtítulo sutil
5. El tab Comandas sigue apareciendo en la barra de navegación
6. Tests deben pasar con 0 fallos

---

## Verification

1. Tab Comandas muestra placeholder, no OrdersScreen
2. ProfileScreen no muestra lista de empleados ni botón agregar
3. ManageTabs no es accesible
4. Todo lo demás funciona exactamente igual: Venta, productos, catálogos, ventas, perfil del dueño, config de cobro
5. npm test pasa con 0 fallos
