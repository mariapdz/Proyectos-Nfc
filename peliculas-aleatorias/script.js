// Cada plataforma tiene dos listas. localStorage guarda estas listas en este navegador.
const platforms = {
  disney: { name: 'Disney+', 
    available: ['Coco', 'Encanto', 'Ratatouille', 'Moana', 'Up', 'Del revés', 'Del revés 2', 'WALL-E', 
    'Buscando a Nemo', 'Buscando a Dory', 'Los Increíbles', 'Los Increíbles 2', 'Monstruos, S. A.', 'Toy Story', 'Toy Story 2', 
    'Toy Story 3', 'Toy Story 4', 'Zootopia', 'Big Hero 6', 'Luca', 'Red', 'Soul', 'Elemental', 'Frozen', 'Frozen 2', 'El rey león', 
    'Aladdín', 'Mulán', 'Lilo & Stitch', 'Piratas del Caribe: La maldición de la Perla Negra'], watched: [] },

  netflix: {
  name: 'Netflix',
  available: [
    'El proyecto Adam',
    'Atlas',
    'No mires arriba',
    'Nimona',
    'Klaus',
    'Pinocho de Guillermo del Toro',
    'La sociedad de la nieve',
    'Puñales por la espalda',
    'Glass Onion',
    'El asesino',
    'El Conde',
    'Roma',
    'El poder del perro',
    'Tick Tick Boom',
    'Enola Holmes',
    'Enola Holmes 2',
    'La vieja guardia',
    'La madre',
    'Rebel Ridge',
    'Dejar el mundo atrás',
    'No estás invitada a mi bat mitzvá',
    'Los Mitchell contra las máquinas',
    'El hoyo',
    'El hoyo 2',
    'La guerra del futuro',
    'Oxígeno',
    'I Am Mother',
    'El lado siniestro de la Luna',
    'Cielo de medianoche',
    'Código 8'
  ],
  watched: []
},


  prime: {
  name: 'Prime Video',
  available: [
    'Culpa mía',
    'Culpa tuya',
    'Culpa mía Londres',
    'AIR',
    'Saltburn',
    'La guerra del mañana',
    'Sin remordimientos',
    'Trece vidas',
    'Rojo blanco y sangre azul',
    'El mapa de las pequeñas cosas perfectas',
    'A Million Miles Away',
    'El amor de Sylvie',
    'El bar de las grandes esperanzas',
    'Algo de Tiffanys',
    'La gran evasión',
    'La idea de tenerte',
    'Road House',
    'G20',
    'Red One',
    'The Accountant 2',
    'El ministerio de la guerra sucia',
    'Ricky Stanicky',
    'Música',
    'American Fiction',
    'Jackpot',
    'Holland',
    'Otro pequeño favor',
    'Bros',
    'La casa Gucci',
    'Sound of Metal'
  ],
  watched: []
}

};
const storageKey = 'nfc-peliculas-v2';
let data = JSON.parse(localStorage.getItem(storageKey)) || platforms;
let currentPlatform = null;

const $ = (id) => document.getElementById(id);
const save = () => localStorage.setItem(storageKey, JSON.stringify(data));
function list(type) { return data[currentPlatform][type]; }
function render() {
  const platform = data[currentPlatform];
  $('platform-label').textContent = platform.name.toUpperCase();
  $('platform-title').textContent = `Películas de ${platform.name}`;
  ['available', 'watched'].forEach((type) => {
    const target = $(`${type}-list`); target.innerHTML = '';
    $(`${type}-count`).textContent = list(type).length;
    list(type).forEach((movie, index) => {
      const item = $('movie-template').content.cloneNode(true);
      item.querySelector('.movie-name').textContent = movie;
      const move = item.querySelector('.move-button');
      move.textContent = type === 'available' ? 'Vista' : 'Por ver';
      move.addEventListener('click', () => { const moved = list(type).splice(index, 1)[0]; list(type === 'available' ? 'watched' : 'available').push(moved); save(); render(); });
      item.querySelector('.delete-button').addEventListener('click', () => { list(type).splice(index, 1); save(); render(); });
      target.append(item);
    });
  });
}
function addMovie(type, form) { const input = form.querySelector('input'); const title = input.value.trim(); if (!title) return; list(type).push(title); input.value = ''; save(); render(); }
function draw() { const choices = list('available'); if (!choices.length) { $('movie-result').textContent = 'No quedan películas por ver'; $('result-help').textContent = 'Añade alguna a la lista para poder sortear.'; return; } const selected = choices[Math.floor(Math.random() * choices.length)]; $('movie-result').textContent = selected; $('result-help').textContent = ''; $('redraw-button').classList.remove('hidden'); }
document.querySelectorAll('[data-platform]').forEach((button) => button.addEventListener('click', () => { currentPlatform = button.dataset.platform; $('home-view').classList.add('hidden'); $('platform-view').classList.remove('hidden'); $('movie-result').textContent = 'Pulsa para elegir'; $('result-help').textContent = 'Solo participan las películas de la lista «Por ver».'; $('redraw-button').classList.add('hidden'); render(); }));
$('back-button').addEventListener('click', () => { $('platform-view').classList.add('hidden'); $('home-view').classList.remove('hidden'); });
$('available-form').addEventListener('submit', (event) => { event.preventDefault(); addMovie('available', event.currentTarget); });
$('watched-form').addEventListener('submit', (event) => { event.preventDefault(); addMovie('watched', event.currentTarget); });
$('draw-button').addEventListener('click', draw); $('redraw-button').addEventListener('click', draw);
