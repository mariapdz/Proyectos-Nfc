import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configured = !window.SUPABASE_URL.includes('PEGA_AQUI') && !window.SUPABASE_PUBLISHABLE_KEY.includes('PEGA_AQUI');
const supabase = configured ? createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY) : null;
const app = document.querySelector('#app');
const loginDialog = document.querySelector('#login-dialog');
const uploadDialog = document.querySelector('#upload-dialog');
const destinationDialog = document.querySelector('#destination-dialog');
const editDestinationDialog = document.querySelector('#edit-destination-dialog');
const photoDialog = document.querySelector('#photo-dialog');
let user = null;

const defaultTrips = [
  { slug: 'oporto-portugal', name: 'Oporto, Portugal', subtitle: 'Azulejos, vino y calles que invitan a perderse.', color: '#173c3b' },
  { slug: 'galicia', name: 'Galicia', subtitle: 'Océano, lluvia suave y sobremesas eternas.', color: '#d95d39' }
];
const palette = ['#173c3b', '#d95d39', '#e9b949', '#7e9c7c', '#b86f61'];
const tripColor = trip => palette.includes(trip.color) ? trip.color : '#173c3b';
let trips = defaultTrips;
const getTrips = () => trips;
const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const escapeHtml = text => text.replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

function route() { return location.hash.replace('#/', '') || 'inicio'; }
function go(slug) { location.hash = `#/${slug}`; }
function pageHome() {
  const cards = getTrips().map(t => `<a class="trip-link" style="background:${tripColor(t)}" href="#/${t.slug}"><small>Álbum de viaje</small><span>${escapeHtml(t.name)}</span></a>`).join('');
  const addCard = user ? `<button class="trip-link add-trip" id="add-destination" type="button"><small>Nueva carpeta</small><span>+ Añadir<br>destino</span></button>` : '';
  app.innerHTML = `<section class="hero"><p class="eyebrow">Colección de recuerdos</p><h1>Pequeños <em>viajes</em>, grandes historias.</h1><p class="intro">Acerca el móvil al imán para abrir el álbum de cada lugar. Una colección que sigue creciendo.</p><nav class="trip-links" aria-label="Destinos">${cards}${addCard}</nav></section>`;
  if (user) document.querySelector('#add-destination').addEventListener('click', () => destinationDialog.showModal());
}
async function loadPhotos(slug) {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from('viajes').list(slug, { limit: 200, sortBy: { column: 'created_at', order: 'asc' } });
  if (error) throw error;
  return data.filter(file => file.name && !file.name.startsWith('.')).map(file => {
    const { data: url } = supabase.storage.from('viajes').getPublicUrl(`${slug}/${file.name}`);
    return { url: url.publicUrl, path: `${slug}/${file.name}`, name: file.name.replace(/^\d+-\d+-/, '') };
  });
}
async function pageTrip(slug) {
  const trip = getTrips().find(t => t.slug === slug);
  if (!trip) { go('inicio'); return; }
  app.innerHTML = `<section class="trip-page"><a class="back" href="#/inicio">← Todos los viajes</a><p class="eyebrow">Álbum de viaje</p><h1 class="trip-title">${escapeHtml(trip.name)}</h1><p class="trip-subtitle">${escapeHtml(trip.subtitle)}</p>${user ? `<div class="edit-bar"><button class="primary" id="add-photos" type="button">+ Añadir fotos</button><button class="secondary" id="edit-destination" type="button">Editar destino</button><button class="danger" id="delete-destination" type="button">Eliminar destino</button></div>` : ''}<div class="gallery" id="gallery"><div class="empty"><h2>Preparando el álbum</h2><p>${configured ? 'Cargando fotografías…' : 'Conecta Supabase en <code>config.js</code> y aquí aparecerán tus fotos.'}</p></div></div></section>`;
  if (user) {
    document.querySelector('#add-photos').addEventListener('click', () => openUpload(trip));
    document.querySelector('#edit-destination').addEventListener('click', () => openEditDestination(trip));
    document.querySelector('#delete-destination').addEventListener('click', () => deleteDestination(trip));
  }
  if (!configured) return;
  try {
    const photos = await loadPhotos(slug);
    const gallery = document.querySelector('#gallery');
    gallery.innerHTML = photos.length ? photos.map((photo, i) => `<button class="photo-button" type="button" data-url="${photo.url}" data-path="${photo.path}" data-name="${escapeHtml(photo.name)}"><img class="photo" loading="lazy" src="${photo.url}" alt="Foto ${i + 1} de ${escapeHtml(trip.name)}. Toca para verla y descargarla." /></button>`).join('') : `<div class="empty"><h2>Aún no hay fotos</h2><p>${user ? 'Pulsa “Añadir fotos” para comenzar este álbum.' : 'Este álbum está esperando sus primeros recuerdos.'}</p></div>`;
    document.querySelectorAll('.photo-button').forEach(button => button.addEventListener('click', () => openPhoto(button.dataset)));
  } catch (error) {
    document.querySelector('#gallery').innerHTML = `<div class="empty"><h2>No se pudieron cargar las fotos</h2><p>Revisa que hayas añadido la política de lectura pública indicada al final.</p></div>`;
  }
}
function render() { document.querySelector('#admin-trigger').textContent = user ? 'Salir' : 'Editar'; route() === 'inicio' ? pageHome() : pageTrip(route()); }
function openUpload(trip) { uploadDialog.dataset.trip = trip.slug; document.querySelector('#upload-title').textContent = `Fotos de ${trip.name}`; document.querySelector('#upload-status').textContent = ''; uploadDialog.showModal(); }
function openEditDestination(trip) {
  editDestinationDialog.dataset.slug = trip.slug;
  document.querySelector('#edit-destination-name').value = trip.name;
  document.querySelector('#edit-destination-subtitle').value = trip.subtitle;
  document.querySelector('#edit-destination-color').value = tripColor(trip);
  editDestinationDialog.showModal();
}
async function deleteDestination(trip) {
  if (!confirm(`¿Eliminar “${trip.name}” y todas sus fotos? Esta acción no se puede deshacer.`)) return;
  const { data: files, error: listError } = await supabase.storage.from('viajes').list(trip.slug, { limit: 1000 });
  if (listError) { alert(`No se pudo eliminar: ${listError.message}`); return; }
  const paths = files.filter(file => file.name).map(file => `${trip.slug}/${file.name}`);
  if (paths.length) {
    const { error } = await supabase.storage.from('viajes').remove(paths);
    if (error) { alert(`No se pudieron borrar las fotos: ${error.message}`); return; }
  }
  const { error } = await supabase.from('destinations').delete().eq('slug', trip.slug);
  if (error) { alert(`No se pudo eliminar el destino: ${error.message}`); return; }
  await syncTrips(); go('inicio');
}
function openPhoto(photo) {
  document.querySelector('#full-photo').src = photo.url;
  document.querySelector('#full-photo').alt = photo.name;
  document.querySelector('#download-photo').dataset.path = photo.path;
  document.querySelector('#download-photo').dataset.name = photo.name;
  photoDialog.showModal();
}

document.querySelector('#admin-trigger').addEventListener('click', async () => {
  if (user) { await supabase.auth.signOut(); user = null; render(); return; }
  loginDialog.showModal();
});
document.querySelector('#close-login').onclick = () => loginDialog.close();
document.querySelector('#close-upload').onclick = () => uploadDialog.close();
document.querySelector('#close-destination').onclick = () => destinationDialog.close();
document.querySelector('#close-edit-destination').onclick = () => editDestinationDialog.close();
document.querySelector('#close-photo').onclick = () => photoDialog.close();
document.querySelector('#download-photo').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true; button.textContent = 'Preparando descarga…';
  const { data, error } = await supabase.storage.from('viajes').download(button.dataset.path);
  if (error) { button.textContent = 'No se pudo descargar'; button.disabled = false; return; }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(data); link.download = button.dataset.name || 'foto';
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
  button.textContent = 'Descargar original'; button.disabled = false;
});
document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.querySelector('#login-error');
  if (!supabase) { message.textContent = 'Primero pega las claves de Supabase en config.js.'; return; }
  const { error } = await supabase.auth.signInWithPassword({ email: document.querySelector('#email').value, password: document.querySelector('#password').value });
  if (error) { message.textContent = error.message; return; }
  user = (await supabase.auth.getUser()).data.user; loginDialog.close(); render();
});
document.querySelector('#upload-form').addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('#upload-status');
  const files = [...document.querySelector('#photos-input').files, ...document.querySelector('#folder-input').files];
  if (!files.length) { status.textContent = 'Elige al menos una foto.'; return; }
  status.textContent = `Subiendo 0 de ${files.length}…`;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const { error } = await supabase.storage.from('viajes').upload(`${uploadDialog.dataset.trip}/${safeName}`, file, { contentType: file.type, upsert: false });
    if (error) { status.textContent = `Error: ${error.message}`; return; }
    status.textContent = `Subiendo ${i + 1} de ${files.length}…`;
  }
  uploadDialog.close(); event.target.reset(); render();
});
document.querySelector('#destination-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.querySelector('#destination-name').value.trim();
  const subtitle = document.querySelector('#destination-subtitle').value.trim();
  const slug = slugify(name);
  if (!slug || trips.some(t => t.slug === slug)) return;
  const { error } = await supabase.from('destinations').insert({ slug, name, subtitle, color: '#173c3b' });
  if (error) { alert(`No se pudo crear el destino: ${error.message}`); return; }
  await syncTrips(); destinationDialog.close(); event.target.reset(); go(slug);
});
document.querySelector('#edit-destination-form').addEventListener('submit', async event => {
  event.preventDefault();
  const slug = editDestinationDialog.dataset.slug;
  const name = document.querySelector('#edit-destination-name').value.trim();
  const subtitle = document.querySelector('#edit-destination-subtitle').value.trim();
  const color = document.querySelector('#edit-destination-color').value;
  const { error } = await supabase.from('destinations').update({ name, subtitle, color }).eq('slug', slug);
  if (error) { alert(`No se pudo guardar: ${error.message}`); return; }
  await syncTrips(); editDestinationDialog.close(); render();
});
window.addEventListener('hashchange', render);
async function syncTrips() {
  if (!supabase) return;
  const { data, error } = await supabase.from('destinations').select('slug, name, subtitle, color').order('created_at');
  if (!error && data?.length) { trips = data; render(); }
}
if (supabase) { user = (await supabase.auth.getUser()).data.user; await syncTrips(); }
render();
