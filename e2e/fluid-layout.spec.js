/* global document, window, getComputedStyle */
import { test, expect } from '@playwright/test';
import { register, record } from './helpers.js';

async function preferences(page, language, theme = 'light', color = 'green') {
  await page.evaluate(({ language, theme, color }) => {
    localStorage.setItem('aguaLanguage', language);
    localStorage.setItem('aguaAppTheme', theme);
    localStorage.setItem('aguaAppColor', color);
  }, { language, theme, color });
  await page.goto('./#home');
  await page.reload();
  await expect(page.locator('#home')).toBeVisible();
}

async function uncovered(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const result = await locator.evaluate(node => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return { height: box.height, covered: !node.contains(hit) };
  });
  expect(result.height).toBeGreaterThanOrEqual(44);
  expect(result.covered).toBe(false);
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('home, history and preferences stay reachable across phone and desktop sizes and languages', async ({ page }) => {
  await register(page, 'Responsive');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ['pt-BR', 'en', 'es']) {
      await preferences(page, language);
      await noOverflow(page);
      await expect(page.locator('#home .hydration-calendar')).toHaveCount(0);
      await expect(page.locator('#history')).toBeHidden();
      await uncovered(page, page.locator('.add-glass-button'));
      await uncovered(page, page.locator('.undo-water'));
      for (const link of await page.locator('.nav-actions a').all()) await uncovered(page, link);
      await page.locator('.nav-actions a[href="#history"]').click();
      await expect(page.locator('.hydration-calendar')).toBeVisible();
      await expect(page.locator('#history h1')).toBeFocused();
      await noOverflow(page);
      await uncovered(page, page.locator('.reset-button'));
      await page.locator('.settings-trigger').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await page.getByRole('dialog').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.locator('.settings-trigger')).toBeFocused();
    }
  }
  // CSS zoom exercises a magnified layout in addition to the narrow viewport checks.
  await page.setViewportSize({ width: 768, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await noOverflow(page);
  await uncovered(page, page.locator('.reset-button'));
});

function contrast(foreground, background) {
  const luminance = value => {
    const components = value.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => {
      const c = n / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
    });
    return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
  };
  const a = luminance(foreground); const b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

test('all accent palettes preserve neutral surfaces and readable water actions in both themes', async ({ page }) => {
  await register(page, 'Palettes');
  for (const theme of ['light', 'dark']) {
    for (const color of ['green', 'blue', 'purple', 'rose', 'orange']) {
      await preferences(page, 'pt-BR', theme, color);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--page').trim())).toBe(theme === 'dark' ? '#101012' : '#f5f5f7');
      for (const button of await page.locator('.record-container-actions .add-button').all()) {
        const colors = await button.evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
        expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
      }
      await expect(page.locator('.add-glass-button')).toContainText('250 ml');
    }
  }
});

test('settings subpanels support keyboard return and preserve independent drafts', async ({ page }) => {
  await register(page, 'Keyboard');
  await page.locator('.settings-trigger').focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Meta diária (L)', { exact: true }).fill('3');
  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    expect(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
  }
  await page.getByRole('button', { name: 'Lembretes de água', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByLabel('Ativar lembretes')).toBeFocused();
  await page.getByLabel('Ativar lembretes').check();
  await page.getByRole('spinbutton', { name: 'Intervalo', exact: true }).fill('47');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Lembretes de água', exact: true })).toBeFocused();
  await expect(page.getByLabel('Meta diária (L)', { exact: true })).toHaveValue('3');
  await page.keyboard.press('Escape');
  await expect(page.locator('.settings-trigger')).toBeFocused();
  await page.locator('.add-glass-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.pour-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.add-glass-button')).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.total')).toHaveText('250 ml');
});

test('capture home and history for desktop and phone including dark, reduced motion and goal reached', async ({ page }, testInfo) => {
  await register(page, 'Preview');
  for (const view of [
    { name: 'desktop-empty', width: 1440, height: 1000, theme: 'light' },
    { name: 'phone-empty', width: 390, height: 844, theme: 'light' },
    { name: 'phone-goal-dark', width: 390, height: 844, theme: 'dark' },
  ]) {
    await page.setViewportSize({ width: view.width, height: view.height });
    await page.emulateMedia({ reducedMotion: view.theme === 'dark' ? 'reduce' : 'no-preference' });
    await preferences(page, 'pt-BR', view.theme);
    if (view.theme === 'dark') for (let index = 0; index < 5; index += 1) await record(page);
    for (const destination of ['home', 'history']) {
      await page.locator(`.nav-actions a[href="#${destination}"]`).click();
      await expect(page.locator(`#${destination}`)).toBeVisible();
      if (view.theme === 'dark' && destination === 'home') await expect(page.locator('.percentage-pill')).toHaveText('100%');
      await page.evaluate(() => window.scrollTo(0, 0));
      if (view.theme === 'dark' && destination === 'home') {
        await expect(page.locator('.motivation-points')).toContainText('10 pontos');
        await expect(page.locator('.motivation-streak')).toContainText('1 dia');
        const feedback = await page.locator('.water-confirmation').boundingBox();
        const navigation = await page.locator('.nav-actions').boundingBox();
        expect(feedback.y + feedback.height).toBeLessThanOrEqual(navigation.y);
      }
      const path = testInfo.outputPath(`${view.name}-${destination}.png`);
      await page.screenshot({ path, fullPage: true, animations: 'disabled' });
      await testInfo.attach(`${view.name}-${destination}`, { path, contentType: 'image/png' });
    }
  }
  expect(await page.locator('.ring-content').evaluate(node => getComputedStyle(node, '::before').animationName)).toBe('none');
  await expect(page.locator('.water-buddy')).toHaveCount(0);
});

test('shared appearance keeps login, registration and onboarding usable on a small phone', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Entre no seu perfil' })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('phone-login.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cadastre-se', exact: true }).click();
  await page.getByLabel('Usuário', { exact: true }).fill('SmallPhone');
  await page.getByLabel('Senha', { exact: true }).fill('test-password-123');
  await page.getByLabel('Confirme a senha', { exact: true }).fill('test-password-123');
  await noOverflow(page);
  await page.getByRole('button', { name: 'Criar perfil', exact: true }).click();
  await expect(page.getByLabel('Sua idade (anos)', { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('phone-onboarding.png'), fullPage: true });
});

test('opaque fallback remains readable without backdrop-filter support', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page, 'Opaque');
  // Remove conditional enhancement rules to exercise the base styles in isolation.
  await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index -= 1) {
        if (sheet.cssRules[index].constructor.name === 'CSSSupportsRule') sheet.deleteRule(index);
      }
    }
  });
  const style = await page.locator('.nav-actions').evaluate(node => ({
    background: getComputedStyle(node).backgroundColor, filter: getComputedStyle(node).backdropFilter,
  }));
  expect(style.background).toBe('rgb(255, 255, 255)');
  expect(style.filter).toBe('none');
  await uncovered(page, page.locator('.add-glass-button'));
  await page.locator('.settings-trigger').click();
  expect(await page.getByRole('dialog').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(255, 255, 255)');
  await page.keyboard.press('Escape');
  await noOverflow(page);
});
