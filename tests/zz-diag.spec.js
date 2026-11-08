// TEMPORAL: diagnóstico del robot en WebKit.
const { test } = require('@playwright/test');
const ROBOT = [['derecha', 'derecha'], ['abajo', 'abajo', 'abajo'], ['abajo', 'derecha', 'derecha', 'abajo'],
  ['arriba', 'arriba', 'arriba', 'derecha', 'derecha', 'derecha', 'derecha']];
const raf = page => page.evaluate(() => Promise.race([
  new Promise(r => requestAnimationFrame(() => r('raf ok'))),
  new Promise(r => setTimeout(() => r('RAF PARADO'), 1500))
]).then(x => x + ` hidden=${document.hidden} anims=${document.getAnimations().length} ` +
  document.getAnimations().slice(0, 8).map(a => (a.animationName || a.transitionProperty) + ':' + a.playState + ':' + (a.effect && a.effect.target && (a.effect.target.getAttribute('class') || a.effect.target.tagName))).join(' | ')));
test('diag robot', async ({ page }) => {
  const log = async m => console.log('DIAG ' + m + ' -> ' + await raf(page));
  page.on('console', m => console.log('CONSOLA ' + m.text()));
  await page.goto('/jugar.html#robot');
  await log('inicio');
  for (const [n, prog] of ROBOT.entries()) {
    for (const d of prog) { await page.click(`#panel-robot .flecha[data-d="${d}"]`, { timeout: 5000 }).catch(e => console.log('DIAG CLIC FALLA ' + d)); }
    await log(`reto ${n + 1} flechas puestas`);
    await page.click('#panel-robot [data-acc="go"]', { timeout: 5000 }).catch(() => console.log('DIAG GO FALLA'));
    for (let t = 0; t < prog.length + 2; t++) { await page.waitForTimeout(650); await log(`reto ${n + 1} andando ${t}`); }
    await page.locator('#panel-robot .big.pulso').last().click({ force: true, timeout: 5000 }).catch(() => console.log('DIAG SIG FALLA'));
    await log(`reto ${n + 1} siguiente pulsado`);
  }
});
