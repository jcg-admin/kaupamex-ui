/**
 * categoryTree.js — construcción pura del árbol de categorías (UC-ADM-01).
 *
 * Toma la lista plana (con parent/parent_id + order) y arma el árbol anidado,
 * ordenando cada grupo de hermanos por `order` y luego `name`. Separado del
 * componente para testear el armado de forma determinista.
 *
 * @typedef {{ id:(number|string), name:string, order?:number,
 *   parent_id?:(number|null), parent?:{id:number}|null }} Cat
 */

/** parent id de una categoría (soporta parent_id plano o parent.{id}). */
export function parentIdOf(cat) {
  if (cat.parent_id != null) return cat.parent_id;
  if (cat.parent && cat.parent.id != null) return cat.parent.id;
  return null;
}

/**
 * Arma el árbol: devuelve los nodos raíz, cada uno con `children` anidados y
 * ordenados. No muta la entrada.
 * @param {Cat[]} categories
 * @returns {Array<Cat & { children: any[] }>}
 */
export function buildTree(categories) {
  const byId = new Map();
  categories.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  categories.forEach((c) => {
    const node = byId.get(c.id);
    const pid = parentIdOf(c);
    if (pid != null && byId.has(pid)) byId.get(pid).children.push(node);
    else roots.push(node);
  });
  const sortSiblings = (nodes) => {
    nodes.sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
        || String(a.name).localeCompare(String(b.name)),
    );
    nodes.forEach((n) => sortSiblings(n.children));
  };
  sortSiblings(roots);
  return roots;
}
