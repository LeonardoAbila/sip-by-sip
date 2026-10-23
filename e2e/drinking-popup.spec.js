import { test, expect } from '@playwright/test';
import { register } from './helpers.js';

test('bottle-filling popup shows each vessel, closes and preserves recorded water', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await register(page, 'Drinking');
  for (const container of ['bottle', 'glass']) {
    const button = page.locator(container === 'glass' ? '.add-glass-button' : '.record-container-actions .add-button:not(.add-glass-button)');
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Água registrada! 💙' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.pour-scene')).toHaveAttribute('data-container', container);
    await expect(page.locator('#pour-amount')).toContainText(container === 'glass' ? '+250 ml' : '+500 ml');
    await expect(page.locator('.pour-water')).toBeVisible();
    // Capture the water rising inside the container.
    await page.waitForTimeout(1100);
    const path = testInfo.outputPath(`phone-drinking-${container}.png`);
    await page.screenshot({ path });
    await testInfo.attach(`drinking-${container}`, { path, contentType: 'image/png' });
    if (container === 'bottle') await page.locator('.pour-close').click();
    await expect(dialog).toHaveCount(0); // The glass scene closes automatically.
    await expect(button).toBeFocused();
  }
  await expect(page.locator('.total')).toHaveText('750 ml');
  await page.reload();
  await expect(page.locator('.total')).toHaveText('750 ml');
  await expect(page.locator('.pour-dialog')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.add-glass-button').click();
  await expect(page.locator('.pour-water')).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Escape');
  await expect(page.locator('.total')).toHaveText('1 L');
});
