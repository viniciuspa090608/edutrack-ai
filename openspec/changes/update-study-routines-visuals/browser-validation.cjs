// Focused UI inspection using the existing local API and demo accounts. No seed/reset.
const { chromium } = require('C:/Users/vinic/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const origin = 'http://localhost:5173';
const out = path.join(__dirname, 'validation');
const screenshots = 'C:/Users/vinic/.codex/visualizations/2026/10/05/01a10e4b-86ca-7c30-b2a7-b8a47c972fde/routines';
const password = fs.readFileSync('apps/api/src/demo/seed.ts', 'utf8').match(/export const demoPassword = '([^']+)'/)[1];

async function main() {
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(screenshots, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/vinic/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const results = [];
  try {
    for (const profile of ['ativo', 'iniciante']) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const response = await context.request.post(origin + '/api/auth/login', { headers: { Origin: origin }, data: { email: profile + '@demo.edutrack.test', password } });
      if (response.status() !== 200) throw new Error(`Existing demo session unavailable: ${response.status()}`);
      const page = await context.newPage();
      for (const theme of ['light', 'dark']) {
        await page.goto(origin);
        await page.evaluate(t => localStorage.setItem('edutrack.theme', t), theme);
        for (const width of [320, 375, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(origin + '/app/rotinas');
          await page.getByRole('button', { name: 'Criar rotina' }).waitFor();
          await page.waitForFunction(() => document.querySelector('.routines-page')?.getAttribute('aria-busy') === 'false');
          assert.equal(await page.locator('.routines-page [role="alert"]').count(), 0, 'Real routines request failed');
          async function capture(state) {
            const measurements = await page.evaluate(() => {
              const root = document.querySelector('.routines-page');
              const dialog = document.querySelector('.routine-dialog');
              const elements = [...root.querySelectorAll('button, input, select, .routine-card'), ...(dialog ? [dialog, ...dialog.querySelectorAll('button')] : [])];
              return {
                overflow: document.documentElement.scrollWidth > innerWidth,
                escaped: elements.filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); }).map(el => el.tagName),
                theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                cards: root.querySelectorAll('.routine-list-item').length,
                days: root.querySelectorAll('.routine-day').length,
                columns: root.querySelector('.routine-week') ? getComputedStyle(root.querySelector('.routine-week')).gridTemplateColumns : null,
                motion: getComputedStyle(root.querySelector('[data-slot="button"]')).transitionDuration,
                focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 40),
              };
            });
            assert.equal(measurements.overflow, false, `${profile} ${theme} ${width} ${state}: overflow`);
            assert.deepEqual(measurements.escaped, [], `${profile} ${theme} ${width} ${state}: clipped controls`);
            assert.equal(measurements.theme, theme);
            assert.equal(measurements.days, ['loading', 'error'].includes(state) ? 0 : 7);
            assert(parseFloat(measurements.motion) <= 0.00001, 'Reduced motion must suppress transitions');
            results.push({ profile, theme, width, state, ...measurements });
            await page.screenshot({ path: path.join(screenshots, `${profile}-${theme}-${width}-${state}.png`), fullPage: true });
          }
          await capture('list');
          const edit = page.locator('.routine-list-item button').first();
          if (await edit.count()) {
            await edit.click();
            await page.getByRole('heading', { name: 'Editar rotina' }).waitFor();
          } else {
            await page.getByRole('button', { name: 'Criar rotina' }).click();
          }
          await page.getByRole('textbox', { name: 'Nome' }).waitFor();
          assert.equal(await page.getByRole('textbox', { name: 'Nome' }).evaluate(el => document.activeElement === el), true);
          await capture('form');
          const zone = page.getByRole('textbox', { name: 'Fuso horário' });
          const zoneValue = await zone.inputValue();
          const weekday = page.getByRole('combobox').first();
          const weekdayValue = await weekday.inputValue();
          await page.getByRole('textbox', { name: 'Nome' }).fill('Texto longo sem espaços para verificar apresentação'.replaceAll(' ', '').repeat(2));
          await capture('long-input');
          assert.equal(await zone.inputValue(), zoneValue);
          assert.equal(await weekday.inputValue(), weekdayValue);
          await page.getByRole('button', { name: 'Adicionar horário' }).click();
          const lastRemove = page.getByRole('button', { name: /^Remover horário/ }).last();
          await lastRemove.click();
          await page.getByRole('button', { name: 'Cancelar edição' }).click();
          assert.equal(await page.getByRole('heading', { name: 'Rotinas de estudo' }).evaluate(el => document.activeElement === el), true);
          if (await edit.count()) {
            const remove = page.locator('.routine-list-item button').nth(1);
            await remove.click();
            await page.getByRole('alertdialog').waitFor();
            assert.equal(await page.getByRole('button', { name: 'Manter rotina' }).evaluate(el => document.activeElement === el), true);
            await capture('dialog');
            await page.keyboard.press('Escape');
            await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
            assert.equal(await remove.evaluate(el => document.activeElement === el), true);
          }
          if (profile === 'ativo' && width === 320) {
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            await page.route('**/api/routines**', async route => { await gate; await route.continue(); });
            await page.goto(origin + '/app/rotinas');
            await page.getByText('Carregando…', { exact: true }).waitFor();
            assert.equal(await page.getByRole('button', { name: 'Criar rotina' }).isDisabled(), true);
            assert.equal(await page.locator('.routine-empty').count(), 0);
            await capture('loading');
            release();
            await page.waitForFunction(() => document.querySelector('.routines-page')?.getAttribute('aria-busy') === 'false');
            await page.unroute('**/api/routines**');
            await page.route('**/api/routines**', route => route.abort());
            await page.goto(origin + '/app/rotinas');
            await page.getByRole('alert').waitFor();
            assert.equal(await page.locator('.routine-empty').count(), 0);
            await capture('error');
            await page.unroute('**/api/routines**');
            await page.getByRole('button', { name: 'Atualizar programação' }).click();
            await page.locator('.routine-list-item').waitFor();
            await page.getByRole('button', { name: 'Criar rotina' }).focus();
            await page.getByRole('button', { name: 'Atualizar programação' }).hover();
            await capture('retry-focus');
          }
        }
      }
      await context.close();
    }
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    await browser.close();
  }
  console.log(`UI matrix passed: ${results.length} real-data states, no persistence mutations.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
