import { expect } from '@playwright/test';

export const password = 'test-password-123';

export async function register(page, username) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Cadastre-se', exact: true }).click();
  await page.getByLabel('Usuário', { exact: true }).fill(username);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirme a senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Criar perfil', exact: true }).click();
  await page.getByLabel('Sua idade (anos)', { exact: true }).fill('30');
  await page.getByLabel('Seu peso (kg)', { exact: true }).fill('70');
  await page.getByRole('button', { name: 'Descobrir minha meta', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('2,45');
  await page.getByRole('button', { name: 'Começar meu dia', exact: true }).click();
  await expect(page.locator('.total')).toHaveText('0 ml');
}

export async function login(page, username, secret = password) {
  await page.getByLabel('Usuário', { exact: true }).fill(username);
  await page.getByLabel('Senha', { exact: true }).fill(secret);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

export async function record(page, container = 'bottle') {
  await page.getByRole('button', { name: container === 'bottle' ? /Adicionar garrafa/ : /Adicionar copo/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

export async function transfer(page) {
  await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.getByRole('button', { name: 'Backup do perfil', exact: true }).click();
}
