const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("publication OTA Android", () => {
  it("fournit des scripts et un workflow de publication canal par canal", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.match(pkg.scripts["update:android:preview"], /eas update --channel preview --platform android/);
    assert.match(pkg.scripts["update:android:production"], /eas update --channel production --platform android/);
    const workflow = read(".github/workflows/publish-android-ota.yml");
    assert.match(workflow, /workflow_dispatch/);
    assert.match(workflow, /EXPO_TOKEN: \$\{\{ secrets\.EXPO_TOKEN \}\}/);
    assert.match(workflow, /--platform android/);
  });
});

describe("e-mail d'annonce de mise à jour", () => {
  it("est optionnel et exige une confirmation admin explicite dans le dashboard", () => {
    const notifications = read("admin-web/notifications.html");
    assert.match(notifications, /f_send_email/);
    assert.match(notifications, /confirm\("Envoyer cet e-mail de service/);
    assert.match(notifications, /\/api\/admin\/send-update-email/);
  });

  it("protège l'envoi avec l'identité et le rôle admin Supabase, sans service_role", () => {
    const endpoint = read("api/admin/send-update-email.js");
    assert.match(endpoint, /\/auth\/v1\/user/);
    assert.match(endpoint, /\/rest\/v1\/admin_users/);
    assert.match(endpoint, /Seul un administrateur Akouè/);
    assert.match(endpoint, /SMTP_APP_PASSWORD/);
    assert.doesNotMatch(endpoint, /SERVICE_ROLE|service_role/i);
    assert.match(endpoint, /bcc: batch/);
  });

  it("journalise et empêche le renvoi automatique d'une même annonce", () => {
    const endpoint = read("api/admin/send-update-email.js");
    const migration = read("supabase/broadcast-email-deliveries.sql");
    assert.match(endpoint, /on_conflict=broadcast_id/);
    assert.match(endpoint, /partiel a déjà eu lieu/);
    assert.match(migration, /broadcast_id uuid primary key/);
    assert.match(migration, /broadcast_email_deliveries_admin_all/);
  });

  it("refuse les requêtes non authentifiées et les méthodes autres que POST", async () => {
    const handler = require(path.join(process.cwd(), "api", "admin", "send-update-email.js"));
    const invoke = async (method, headers = {}) => {
      const result = { status: 200, payload: null, ended: false };
      const res = {
        setHeader() {},
        status(code) { result.status = code; return this; },
        json(payload) { result.payload = payload; return this; },
        end() { result.ended = true; return this; },
      };
      await handler({ method, headers, body: {} }, res);
      return result;
    };

    assert.equal((await invoke("GET")).status, 405);
    const unauthorized = await invoke("POST");
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.payload.error, /administrateur/);
  });
});
