import { test, expect } from '@playwright/test';
import { register } from './helpers.js';

test('phone drinking popup shows each vessel, animates, closes and preserves recorded water', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await register(page, 'Drinking');
  for (const container of ['bottle', 'glass']) {
    const button = page.locator(container === 'glass' ? '.add-glass-button' : '.record-container-actions .add-button:not(.add-glass-button)');
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Mais um gole!' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.drink-scene')).toHaveAttribute('data-container', container);
    await expect(page.locator('#drink-amount')).toContainText(container === 'glass' ? '+250 ml' : '+500 ml');
    // Capture the raised-cup phase rather than fast-forwarding the animation to its end.
    await page.waitForTimeout(1100);
    const path = testInfo.outputPath(`phone-drinking-${container}.png`);
    await page.screenshot({ path });
    await testInfo.attach(`drinking-${container}`, { path, contentType: 'image/png' });
    if (container === 'bottle') await page.locator('.drink-close').click();
    await expect(dialog).toHaveCount(0); // The glass scene closes automatically.
    await expect(button).toBeFocused();
  }
  await expect(page.locator('.total')).toHaveText('750 ml');
  await page.reload();
  await expect(page.locator('.total')).toHaveText('750 ml');
  await expect(page.locator('.drink-dialog')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.add-glass-button').click();
  await expect(page.locator('.drink-arm')).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Escape');
  await expect(page.locator('.total')).toHaveText('1 L');
});
