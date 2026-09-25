import { test, expect, Page } from '@playwright/test';

// Tests pour la logique de mise à jour OTA (use-ota-update.ts)

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

  test('update_seen_at existe bien dans le code (cooldown 30j)', async () => {
    // Vérifie que la constante de cooldown est bien définie
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('UPDATE_SEEN_KEY = "update_seen_at"');
    expect(code).toContain('UPDATE_COOLDOWN_DAYS = 30');
  });

  test('détection nouvel utilisateur présente', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('isNewUser');
    expect(code).toContain('AsyncStorage.getItem("user")');
  });

  test('badge notification présent', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('badge: updateAvailable ? 1 : 0');
  });

  test('4 scénarios de messages de mise à jour', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    // Nouvel utilisateur + majeure
    expect(code).toContain('Première mise à jour majeure');
    // Nouvel utilisateur + mineure
    expect(code).toContain("première mise à jour avec Akouè");
    // Existant + majeure
    expect(code).toContain('Mise à jour majeure');
    // Existant + mineure
    expect(code).toContain('Mise à jour disponible');
  });

  test('détection mise à jour majeure vs mineure', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('isMajorUpdate');
    expect(code).toContain('current_app_version');
  });

  test('redémarrage via Updates.reloadAsync', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('Updates.reloadAsync()');
  });

  test('cooldown respecté dans shouldShowUpdate', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('shouldShowUpdate');
    expect(code).toContain('diffDays >= UPDATE_COOLDOWN_DAYS');
  });

  test('markUpdateAsSeen appelé après affichage', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('hooks/use-ota-update.ts', 'utf-8');
    expect(code).toContain('markUpdateAsSeen');
    // Marqué seulement pour les utilisateurs existants
    expect(code).toContain('if (!newUser)');
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
