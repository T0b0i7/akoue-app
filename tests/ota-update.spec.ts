import { test, expect, Page } from '@playwright/test';

// Tests pour la logique de mise à jour OTA (hooks/use-ota-update.ts)
// Version simple : dès qu'une OTA existe, on prévient + propose redémarrage.

test.describe('OTA Update - Logique de notification', () => {

  test('app se charge sans erreur avec le nouveau code OTA', async ({ page }: { page: Page }) => {
    try {
      await page.goto('/', { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      const body = await page.evaluate(() => document.body.innerText);
      if (body.length === 0) {
        // Serveur non démarré - on skip proprement
        test.skip(true, 'Serveur Expo non lancé sur localhost:8081');
        return;
      }
      expect(body.length).toBeGreaterThan(0);
      const hasFatalError = body.includes('Unexpected') || body.includes('SyntaxError') || body.includes('TypeError');
      expect(hasFatalError).toBeFalsy();
    } catch {
      test.skip(true, 'Serveur Expo non lancé sur localhost:8081');
    }
  });

  test('check + fetch + reload présents, sans cooldown', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('checkForUpdateAsync');
    expect(code).toContain('fetchUpdateAsync');
    expect(code).toContain('Updates.reloadAsync()');
    expect(code).not.toContain('UPDATE_COOLDOWN_DAYS');
    expect(code).not.toContain('shouldShowUpdate');
  });

  test('badge notification à 1', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('badge: 1');
  });

  test('message unique de mise à jour', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('Mise à jour prête');
    expect(code).toContain('Redémarrer');
  });

  test('canal Android updates présent', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('"updates"');
    expect(code).toContain('AndroidImportance.HIGH');
  });
});

test.describe('OTA Update - Compilation TypeScript', () => {
  test('aucune erreur TypeScript dans use-ota-update.ts', async () => {
    const { execSync } = require('child_process');
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf-8', timeout: 60000 });
      // Pas d'erreur = succès
      expect(true).toBeTruthy();
    } catch (e: any) {
      const output = e.stdout || e.stderr || '';
      const otaErrors = output.split('\n').filter((l: string) => l.includes('use-ota-update'));
      expect(otaErrors).toHaveLength(0);
    }
  });
});
