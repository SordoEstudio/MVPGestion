a continuacion las tareas para mejoras, tener en cuenta: 
Priorizar la reutilizacion de componentes, componentizar codigo siempre que sea necesario (DRY).
Mantener la filosofia KISS en cada desicion sin complejizar innecesariamente codigo ni funcionalidades.
Priorizar buenas practicas de codigo, ux/ui, contraste y demas.
Cuando haya opciones para hacerlo diferente o mejor, plantearlo.


DASHBOARD
- Compactar cards (solo 2 lineas:  arriba:icono+cifra abajo: descripcion)
- Cambiar "Dahsboard" por "Inicio"(o que nombre deberia tener esta seccion evitando anglicismos y tecnicismos)
- Revisar anglicismo y tecnicismos en toda la aplicacion, proponer cambios. 
- Reavisar opciones de cifras, datos o graficos que podrian ser utiles en el dashboard.

VENTAS
- Al colapsar la sidebar se ensima el logo con el icono de Extender.
- Cuando la sidebar esta colapsada al hacer hover por los iconos mostrar un tooltip con el nombre dle menu.

- En el modal de pagar oscurecer los numeros( mejorar contraste)
tanto en el de efectivo / ransferencia como en el de varias opciones

- Revisar y oscurecer (mejorar contraste) de los textos en los inputs (placeholders) y menus desplegables.

---
**Implementado:** Cards del inicio compactas (icono+cifra arriba, descripción abajo). Sección renombrada a "Inicio"; "Reportes" → "Informes" en menú y página. Sidebar colapsada: logo y botón en una fila sin solapamiento; tooltips al pasar el ratón sobre los iconos. Modal de pago: números en gris oscuro/negro (total, montos, resta, input). Contraste en inputs/placeholders/selects (globals.css + clases text-gray-900, placeholder-gray-500). Anglicismos revisados: Dashboard→Inicio, Reportes→Informes, "Ver Dashboard"→"Ver panel", "Exportar Reporte"→"Ir a Informes", "Este Mes"→"Este mes".
