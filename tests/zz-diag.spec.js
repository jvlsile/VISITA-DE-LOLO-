// TEMPORAL: diagnóstico del robot en iPad.
const { test } = require('@playwright/test');
const ROBOT = [['derecha', 'derecha'], ['abajo', 'abajo', 'abajo'], ['abajo', 'derecha', 'derecha', 'abajo'],
  ['arriba', 'arriba', 'arriba', 'derecha', 'derecha', 'derecha', 'derecha']];
test('diag robot', async ({ page }) => {
  await page.goto('/jugar.html#robot');
  for (const prog of ROBOT) {
    for (const d of prog) await page.click(`#panel-robot .flecha[data-d="${d}"]`);
    await page.click('#panel-robot [data-acc="go"]');
    await page.waitForTimeout(650 * prog.length + 800);
    await page.locator('#panel-robot .big.pulso').last().click({ force: true });
  }
  const datos = await page.evaluate(async () => {
    const f = document.querySelector('#panel-robot .flecha[data-d="arriba"]'), out = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(r => requestAnimationFrame(r));
      const r = f.getBoundingClientRect(), de = document.documentElement;
      out.push([Math.round(r.x), Math.round(r.y), Math.round(r.width), de.scrollHeight, de.clientWidth, window.scrollY].join(','));
    }
    const anim = document.getAnimations().map(a => (a.animationName || a.transitionProperty || a.constructor.name) + '@' + (a.effect && a.effect.target ? (a.effect.target.className && a.effect.target.className.baseVal !== undefined ? a.effect.target.className.baseVal : a.effect.target.className) : '') + ' ' + a.playState);
    return { frames: out, anim, robi: document.querySelector('#panel-robot .robi').getAttribute('style') };
  });
  console.log('DIAG ' + JSON.stringify(datos, null, 1));
});
