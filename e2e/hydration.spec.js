/* global indexedDB */
import { test, expect } from '@playwright/test';
import { register, login, record } from './helpers.js';

// A reload can cancel a write still committing to IndexedDB.
async function reloadAfterSave(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('sip-by-sip-sqlite');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const connection = request.result;
      const transaction = connection.transaction('files', 'readonly');
      transaction.objectStore('files').get('database');
      transaction.oncomplete = () => { connection.close(); resolve(); };
      transaction.onabort = () => { connection.close(); reject(transaction.error); };
    };
  }));
  await page.reload();
}

test('register, onboard, record/undo, persist preferences, reset and log in again', async ({ page }) => {
  await register(page, 'Journey');
  await record(page); await record(page, 'glass');
  await expect(page.locator('.total')).toHaveText('750 ml');
  await page.getByRole('button', { name: 'Desfazer último registro', exact: true }).click();
  await expect(page.locator('.total')).toHaveText('500 ml');
  await reloadAfterSave(page); await expect(page.locator('.total')).toHaveText('500 ml');
  await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.getByLabel('Meta diária (L)', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await reloadAfterSave(page);
  await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await expect(page.getByLabel('Meta diária (L)', { exact: true })).toHaveValue('3');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.nav-actions').getByRole('link', { name: 'Histórico', exact: true }).click();
  await page.getByRole('button', { name: 'Alterar ml', exact: true }).click();
  await page.getByLabel('Sua garrafa (ml)', { exact: true }).fill('600');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('link', { name: 'Início', exact: true }).click();
  await expect(page.locator('.record-container-actions .add-button').first()).toContainText('600 ml');
  await expect(page.locator('.total')).toHaveText('500 ml');
  await page.locator('.nav-actions').getByRole('link', { name: 'Histórico', exact: true }).click();
  await page.getByRole('button', { name: 'Zerar dia', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.total')).toHaveText('500 ml');
  await page.getByRole('button', { name: 'Zerar dia', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Zerar dia', exact: true }).click();
  await expect(page.locator('.total')).toHaveText('0 ml');
  await reloadAfterSave(page); await expect(page.locator('.total')).toHaveText('0 ml');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login(page, 'Journey', 'incorrect-password');
  await expect(page.getByRole('alert')).toContainText('incorretos');
  await login(page, 'Journey'); await expect(page.locator('.total')).toHaveText('0 ml');
});
