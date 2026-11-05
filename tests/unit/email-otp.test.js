const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const tplPath = path.join(process.cwd(), "supabase", "email-otp.html");
const html = fs.readFileSync(tplPath, "utf8");

describe("email-otp.html (template OTP Supabase)", () => {
  it("contient le placeholder {{ .Token }}", () => {
    assert.ok(html.includes("{{ .Token }}"), "placeholder {{ .Token }} manquant");
  });

  it("ne contient pas de lien magique", () => {
    assert.ok(!html.includes("ConfirmationURL"), "le template OTP ne doit pas contenir ConfirmationURL");
  });

  it("mentionne l'expiration 3 minutes", () => {
    assert.ok(/3 minutes/.test(html), "mention '3 minutes' manquante");
  });

  it("branding Akouè sans adresse e-mail personnelle", () => {
    assert.ok(html.includes("Akou"), "branding manquant");
    assert.ok(!html.includes("@"), "l'adresse e-mail ne doit pas être intégrée au template");
  });

  it("structure HTML valide", () => {
    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("</html>"));
    assert.ok(html.length > 500, "template suspect trop court");
  });
});
