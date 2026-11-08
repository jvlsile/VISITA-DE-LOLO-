// Los dibujos (SVG) no se salen de su hueco ni de su tarjeta.
// Pensada sobre todo para Safari (iPad e iPhone), donde ya hubo dibujos que crecían fuera de la tarjeta.
const { test, expect } = require('@playwright/test');

const JUGAR = ['lolo', 'caja', 'jardin', 'cuenta', 'series', 'cestas', 'tamanos', 'parejas', 'formas', 'cuento', 'construye',
  'quepasa', 'emociones', 'muevete', 'caza', 'robot', 'duo', 'escape',
  'hojas', 'arbol', 'ropa', 'frutos', 'bosque', 'castanas', 'viento', 'tinta'];
const TRES = ['burbujas', 'cara', 'animales', 'emociones', 'manos', 'colores', 'cuenta', 'tamanos', 'primero', 'quiero', 'calma', 'turnos', 'numeros', 'banda'];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { if (!sessionStorage.getItem('limpio')) { localStorage.clear(); sessionStorage.setItem('limpio', '1'); } } catch (e) {} });
});

/* Devuelve los dibujos que se salen. Para cada SVG visible (no anidado en otro SVG) mira:
   1) su hueco: el elemento que lo contiene directamente;
   2) su tarjeta: el antepasado más cercano con fondo y esquinas redondeadas.
   Un dibujo puede asomar a propósito unos píxeles (sombras, brazos de Lolo), por eso se admite un margen. */
async function dibujosQueSeSalen(page) {
  return page.evaluate(() => {
    const MARGEN = 3;
    const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const esTarjeta = el => { const s = getComputedStyle(el); const fondo = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none'; return fondo && parseFloat(s.borderTopLeftRadius) >= 8; };
    const sale = (a, b) => Math.max(b.left - a.left, b.top - a.top, a.right - b.right, a.bottom - b.bottom);
    const nombre = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].join('.') : '');
    const ruta = el => { const p = []; for (let e = el; e && e !== document.body && p.length < 4; e = e.parentElement) p.unshift(nombre(e)); return p.join(' > '); };
    const fallos = [];
    for (const svg of document.querySelectorAll('svg')) {
      if (svg.parentElement.closest('svg') || !visible(svg)) continue;
      // El arrecife del pie es decorativo: el coral crece hacia arriba a propósito.
      if (svg.closest('[hidden],.arrecife')) continue;
      const pos = getComputedStyle(svg).position;
      if (pos === 'fixed') continue;
      const r = svg.getBoundingClientRect();
      const hueco = svg.parentElement;
      // Dentro de una zona con desplazamiento (la agenda en el móvil) el dibujo puede quedar fuera de la vista a propósito.
      if ([...function* () { for (let e = hueco; e && e !== document.body; e = e.parentElement) yield e; }()].some(e => /auto|scroll/.test(getComputedStyle(e).overflowX + getComputedStyle(e).overflowY))) continue;
      if (visible(hueco) && pos !== 'absolute') {
        const d = sale(r, hueco.getBoundingClientRect());
        if (d > MARGEN) fallos.push(`${ruta(svg)}: se sale ${Math.round(d)} px de su hueco`);
      }
      let t = hueco;
      while (t && t !== document.body && !esTarjeta(t)) t = t.parentElement;
      if (t && t !== document.body && visible(t)) {
        const d = sale(r, t.getBoundingClientRect());
        if (d > MARGEN) fallos.push(`${ruta(svg)}: se sale ${Math.round(d)} px de su tarjeta (${nombre(t)})`);
      }
    }
    return [...new Set(fallos)];
  });
}

const comprobar = async page => {
  // Dejar que terminen las animaciones de entrada (las que no se repiten sin fin).
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations().filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))),
    new Promise(r => setTimeout(r, 4000))
  ]));
  await page.waitForTimeout(300);
  expect(await dibujosQueSeSalen(page), 'dibujos que se salen').toEqual([]);
};

test('portada: los dibujos caben en sus tarjetas', async ({ page }) => {
  await page.goto('/');
  await comprobar(page);
});

for (const id of JUGAR) {
  test(`jugar · ${id}: los dibujos caben en sus tarjetas`, async ({ page }) => {
    await page.goto(id === 'lolo' ? '/jugar.html' : `/jugar.html#${id}`);
    await expect(page.locator('#actualT')).toBeVisible();
    await comprobar(page);
  });
}

test('3 años · menú: los dibujos caben en sus tarjetas', async ({ page }) => {
  await page.goto('/tres.html');
  await comprobar(page);
});

for (const id of TRES) {
  test(`3 años · ${id}: los dibujos caben en sus tarjetas`, async ({ page }) => {
    await page.goto(`/tres.html#${id}`);
    await expect(page.locator('#zona')).toBeVisible();
    await comprobar(page);
  });
}

for (const pagina of ['/fichas.html', '/fichas-3.html']) {
  test(`${pagina}: los dibujos caben en sus tarjetas`, async ({ page }) => {
    await page.goto(pagina);
    await comprobar(page);
  });
}
