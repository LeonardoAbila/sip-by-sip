import { test, expect } from '@playwright/test';
import { register } from './helpers.js';

test('water entry confirms inline, allows consecutive entries and preserves focus and progress', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await register(page, 'WaterConfirmation');
  const bottle = page.locator('.record-container-actions .add-button:not(.add-glass-button)');
  const glass = page.locator('.add-glass-button');
  await bottle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.water-confirmation')).toHaveText('+500 ml adicionados');
  await expect(bottle).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await glass.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.water-confirmation')).toHaveText('+250 ml adicionados');
  await expect(glass).toBeFocused();
  await expect(page.locator('.total')).toHaveText('750 ml');
  await expect(page.locator('.water-confirmation')).toBeEmpty({ timeout: 6000 });
  await expect(page.locator('.total')).toHaveText('750 ml');
  await page.reload();
  await expect(page.locator('.total')).toHaveText('750 ml');
  await expect(page.locator('.water-confirmation')).toBeEmpty();
  await page.getByRole('button', { name: 'Desfazer último registro', exact: true }).click();
  await expect(page.locator('.total')).toHaveText('500 ml');
});
