# UI documentada en implementación — cheat-sheet (canónico en docs)

Regla completa: `docs/.claude/rules/ui-documentacion-en-implementacion.md` — se
carga en sesiones con `docs` en scope. Canon RST:
`source/normativa/estandares/metodologia/documentacion-interfaz-en-implementacion.rst`.
Aquí solo el invariante operativo:

Toda implementación de UI con superficie visible registra su interfaz en el MISMO
pase (mockup ASCII + spec del contrato UI↔API + estados) en `interfaz-<slug>.rst`;
es parte del DoD de UI — sin él la tarea no se cierra. Nunca diferir a una
iniciativa futura de "mejora". Precedente: `interfaz-adminlogspage.rst`.
