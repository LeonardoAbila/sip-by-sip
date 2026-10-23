import { test, expect } from '@playwright/test';
import { register, record, transfer, login } from './helpers.js';

test('real backup download restores progress without crossing profiles or browser contexts', async ({ page, browser }, testInfo) => {
  await register(page, 'BackupOwner');
  await record(page);
  await transfer(page);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup', exact: true }).click();
  const downloaded = await downloading;
  const backupPath = testInfo.outputPath('profile-backup.json');
  await downloaded.saveAs(backupPath);
  await page.keyboard.press('Escape');
  await record(page, 'glass');
  await expect(page.locator('.total')).toHaveText('750 ml');
  await transfer(page);
  await page.getByLabel('Escolher backup JSON', { exact: true }).setInputFiles(backupPath);
  await expect(page.locator('.transfer-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar substituição', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.total')).toHaveText('500 ml');
  await page.reload();
  await expect(page.locator('.total')).toHaveText('500 ml');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await register(page, 'OtherProfile');
  await record(page, 'glass');
  await expect(page.locator('.total')).toHaveText('250 ml');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login(page, 'BackupOwner');
  await expect(page.locator('.total')).toHaveText('500 ml');
  const isolated = await browser.newContext({ baseURL: new URL('./', page.url()).href });
  try {
    const other = await isolated.newPage();
    await register(other, 'IndependentBrowser');
    await expect(other.locator('.total')).toHaveText('0 ml');
    await record(other, 'glass');
    await page.reload();
    await expect(page.locator('.total')).toHaveText('500 ml');
  } finally { await isolated.close(); }
});
