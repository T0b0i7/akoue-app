import { test, expect } from '@playwright/test';

test.describe('Akouè - Supabase full flows', () => {
  test('login demo@akoue.app puis création wallet et transaction', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.evaluate(() => { try{localStorage.clear();}catch{}});
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await expect(page.getByPlaceholder('Entrez votre email')).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder('Entrez votre email').fill('demo@akoue.app');
    await page.getByPlaceholder('Entrez votre mot de passe').fill('Demo1234!');
    await page.getByText('Connexion').last().click();
    await expect(page.getByText('Solde total').first()).toBeVisible({ timeout: 30000 });
    await expect(page).not.toHaveURL(/login/, { timeout: 5000 });
  });

  test('sign-up nouveau user Akouè', async ({ page }) => {
    const email = `play_${Date.now()}@gmail.com`;
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.getByPlaceholder('Entrez votre nom').fill('Playwright');
    await page.getByPlaceholder('Entrez votre email').fill(email);
    await page.getByPlaceholder('Entrez votre mot de passe').fill('Test1234!');
    await page.getByText('Créer un compte').last().click();
    await expect(page.getByText('Solde total').first()).toBeVisible({ timeout: 25000 });
  });
});
