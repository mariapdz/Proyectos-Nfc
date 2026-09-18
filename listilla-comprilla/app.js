import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configured = !window.SUPABASE_URL.includes('PEGA_AQUI') && !window.SUPABASE_PUBLISHABLE_KEY.includes('PEGA_AQUI');
const supabase = configured ? createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY) : null;
const catalogue = document.querySelector('#catalogue');
const list = document.querySelector('#shopping-list');
const productDialog = document.querySelector('#product-dialog');
const editProductDialog = document.querySelector('#edit-product-dialog');
const productActionsDialog = document.querySelector('#product-actions-dialog');
const commentDialog = document.querySelector('#comment-dialog');
let products = [], items = [];
const esc = text => String(text).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function render() {
  document.querySelector('#total-count').textContent = items.reduce((sum, item) => sum + item.quantity, 0);
  catalogue.innerHTML = `<div class="catalogue-heading"><h2>¿Qué hace falta?</h2><p>Toca + para sumar</p></div><div class="product-grid">${products.map(product => `<article class="product-card"><button class="product-main" type="button" data-open-product="${product.id}" aria-label="Ver opciones para ${esc(product.name)}"><span class="emoji">${esc(product.emoji)}</span><span class="product-name">${esc(product.name)}</span></button><button class="plus" type="button" data-add="${product.id}" aria-label="Añadir ${esc(product.name)}">+</button></article>`).join('')}</div>`;
  if (!products.length) catalogue.innerHTML = `<div class="empty">Añadid el primer producto de casa con el botón de arriba.</div>`;
  catalogue.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addOne(button.dataset.add)));
  catalogue.querySelectorAll('[data-open-product]').forEach(button => button.addEventListener('click', () => openProductActions(button.dataset.openProduct)));
  list.innerHTML = `<div class="list-heading"><div><p class="kicker">Para esta semana</p><h2>Total de la lista</h2></div><button id="back-catalogue" class="button ghost" type="button">Seguir añadiendo</button></div>${items.length ? items.map(item => `<article class="list-item"><span class="emoji">${esc(item.products.emoji)}</span><div><h3>${esc(item.products.name)}</h3>${item.comment ? `<p class="note">${esc(item.comment)}</p>` : ''}<button class="comment-button" type="button" data-comment="${item.id}">${item.comment ? 'Editar comentario' : '+ Añadir comentario'}</button></div><div class="item-actions"><button class="quantity-button" type="button" data-minus="${item.id}" aria-label="Quitar una unidad">−</button><span class="quantity">${item.quantity}</span><button class="quantity-button" type="button" data-plus="${item.id}" aria-label="Añadir una unidad">+</button></div></article>`).join('') : `<p class="empty">Todavía no hay nada. ¡A llenar la listilla!</p>`}<button id="reset-list" class="button reset" type="button">Reinicio semanal</button>`;
  document.querySelector('#back-catalogue').onclick = showCatalogue;
  document.querySelector('#reset-list').onclick = resetList;
  list.querySelectorAll('[data-plus]').forEach(button => button.addEventListener('click', () => changeQuantity(button.dataset.plus, 1)));
  list.querySelectorAll('[data-minus]').forEach(button => button.addEventListener('click', () => changeQuantity(button.dataset.minus, -1)));
  list.querySelectorAll('[data-comment]').forEach(button => button.addEventListener('click', () => openComment(button.dataset.comment)));
}
async function refresh() {
  if (!supabase) { catalogue.innerHTML = `<p class="empty">Falta conectar Supabase en <code>config.js</code>.</p>`; return; }
  const [productsResult, itemsResult] = await Promise.all([
    supabase.from('shopping_products').select('*').order('created_at'),
    supabase.from('shopping_list_items').select('id, product_id, quantity, comment, products:shopping_products(id,name,emoji)').order('updated_at')
  ]);
  if (productsResult.error || itemsResult.error) { catalogue.innerHTML = `<p class="empty">Aún falta ejecutar el archivo de configuración de Supabase.</p>`; return; }
  products = productsResult.data; items = itemsResult.data; render();
}
async function addOne(productId) {
  const existing = items.find(item => item.product_id === productId);
  if (existing) await changeQuantity(existing.id, 1);
  else await supabase.from('shopping_list_items').insert({ product_id: productId, quantity: 1, comment: '' });
  await refresh();
}
async function changeQuantity(id, delta) {
  const item = items.find(entry => entry.id === id); if (!item) return;
  if (item.quantity + delta <= 0) await supabase.from('shopping_list_items').delete().eq('id', id);
  else await supabase.from('shopping_list_items').update({ quantity: item.quantity + delta, updated_at: new Date().toISOString() }).eq('id', id);
  await refresh();
}
function showList() { catalogue.hidden = true; list.hidden = false; }
function showCatalogue() { catalogue.hidden = false; list.hidden = true; }
function openProductActions(id) { const product = products.find(entry => entry.id === id); productActionsDialog.dataset.productId = id; document.querySelector('#product-actions-title').textContent = `${product.emoji} ${product.name}`; productActionsDialog.showModal(); }
function openEditProduct(id) { const product = products.find(entry => entry.id === id); editProductDialog.dataset.productId = id; document.querySelector('#edit-product-emoji').value = product.emoji; document.querySelector('#edit-product-name').value = product.name; editProductDialog.showModal(); }
async function deleteProduct(id) { const product = products.find(entry => entry.id === id); if (!confirm(`¿Eliminar “${product.name}”? Si está en la lista semanal, también se quitará.`)) return; const { error } = await supabase.from('shopping_products').delete().eq('id', id); if (error) { alert(`No se pudo eliminar: ${error.message}`); return; } await refresh(); }
function openComment(id) { const item = items.find(entry => entry.id === id); commentDialog.dataset.itemId = id; document.querySelector('#comment-title').textContent = `Nota para ${item.products.name}`; document.querySelector('#comment-text').value = item.comment || ''; commentDialog.showModal(); }
async function resetList() { if (!items.length || !confirm('¿Empezar una lista nueva? Se borrarán todos los productos y comentarios de esta semana.')) return; await supabase.from('shopping_list_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); await refresh(); showCatalogue(); }

document.querySelector('#new-product').onclick = () => productDialog.showModal();
document.querySelector('#show-list').onclick = showList;
document.querySelector('#close-product-dialog').onclick = () => productDialog.close();
document.querySelector('#close-edit-product-dialog').onclick = () => editProductDialog.close();
document.querySelector('#close-product-actions-dialog').onclick = () => productActionsDialog.close();
document.querySelector('#open-edit-product').onclick = () => { productActionsDialog.close(); openEditProduct(productActionsDialog.dataset.productId); };
document.querySelector('#open-delete-product').onclick = () => { const id = productActionsDialog.dataset.productId; productActionsDialog.close(); deleteProduct(id); };
document.querySelector('#close-comment-dialog').onclick = () => commentDialog.close();
document.querySelector('#product-form').addEventListener('submit', async event => { event.preventDefault(); const emoji = document.querySelector('#product-emoji').value.trim(); const name = document.querySelector('#product-name').value.trim(); if (!emoji || !name) return; await supabase.from('shopping_products').insert({ emoji, name }); event.target.reset(); document.querySelector('#product-emoji').value = '🛒'; productDialog.close(); await refresh(); });
document.querySelector('#edit-product-form').addEventListener('submit', async event => { event.preventDefault(); const emoji = document.querySelector('#edit-product-emoji').value.trim(); const name = document.querySelector('#edit-product-name').value.trim(); const { error } = await supabase.from('shopping_products').update({ emoji, name }).eq('id', editProductDialog.dataset.productId); if (error) { alert(`No se pudo guardar: ${error.message}`); return; } editProductDialog.close(); await refresh(); });
document.querySelector('#comment-form').addEventListener('submit', async event => { event.preventDefault(); await supabase.from('shopping_list_items').update({ comment: document.querySelector('#comment-text').value.trim(), updated_at: new Date().toISOString() }).eq('id', commentDialog.dataset.itemId); commentDialog.close(); await refresh(); });

if (supabase) { await refresh(); setInterval(refresh, 12000); } else refresh();
