# Feature Retro: Time Auto-Advance + Calendar Date Picker

- **Date:** 2026-06-05
- **PR:** fix/time-auto-advance-and-date-picker
- **Design doc:** none (UX polish from device testing)

## Resumen

Dos mejoras de flujo de entrada en ScheduleSheet: auto-avance entre campos de hora (HH→MM→siguiente HH) y reemplazo del TextInput de fecha por un CalendarPicker visual en BottomSheetModal.

## Cambios

- **src/components/TimeInputAmPm.js** — HH field auto-focuses to MM when 2 digits typed (via internal minuteRef). MM field auto-focuses to nextRef when 2 digits typed (wired from parent). New props: nextRef (ref to focus after MM complete), hourRef (external ref for the hour input, used by parent to wire auto-advance chain). selectTextOnFocus added to both inputs.
- **src/components/ScheduleSheet.js** — Date TextInput replaced by TouchableOpacity button that opens a BottomSheetModal with CalendarPicker. User taps a day → date is set in DD-MM-AAAA format, sheet closes. endHourRef wired: start time MM auto-advances to end time HH. CalendarPicker imported from existing unused component.
- **docs/feature_retros/2026-06-05_time-auto-advance-date-picker.md** — este archivo.

## Qué funcionó

- CalendarPicker ya existía en el repo (src/components/CalendarPicker.js) pero no era consumido por nadie. Es un calendario mensual con navegación mes/año, selección de día, y soporte de range selection (startDate/endDate). Para single-date lo usé solo con onSelectStart — el onSelectEnd no se pasa.
- La cadena de refs (start HH → start MM → end HH → end MM) se implementó sin complejidad: TimeInputAmPm crea su propia ref para MM internamente y acepta nextRef para el campo siguiente. El parent (ScheduleSheet) crea endHourRef, lo pasa como nextRef al start time y como hourRef al end time.
- El botón de fecha con ícono calendar + texto "Seleccionar fecha" es más intuitivo que un TextInput con formato DD-MM-AAAA. El usuario no necesita saber el formato — solo toca un día.

## Lecciones

- El análisis del repo reveló que CalendarPicker y TimeWheelPicker existían como componentes huérfanos desde PRs antiguos. CalendarPicker se reactivó; TimeWheelPicker sigue sin uso.
- Auto-advance entre campos de hora es un patrón estándar mobile que reduce taps de ~8 (tap HH, type 2, tap MM, type 2, tap next HH, type 2, tap next MM, type 2) a ~4 (tap HH, type 2, auto→MM type 2, auto→next HH type 2, auto→next MM type 2). El keyboard nunca se cierra durante la secuencia.
- selectTextOnFocus en los campos de hora permite re-editar sin borrar manualmente — tap en un campo lleno selecciona todo, escribir reemplaza.
