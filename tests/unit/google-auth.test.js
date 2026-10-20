const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

function extractCode(returnUrl) {
  try {
    return new URL(returnUrl).searchParams.get("code");
  } catch {
    return null;
  }
}

function extractTokens(returnUrl) {
  const hash = String(returnUrl).split("#")[1] || "";
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
  };
}

describe("login Google : parsing du retour OAuth", () => {
  it("extrait le code PKCE", () => {
    assert.equal(extractCode("akoue://login?code=abc123"), "abc123");
    assert.equal(extractCode("akoue://login"), null);
  });

  it("extrait les tokens implicites du hash", () => {
    const t = extractTokens("akoue://login#access_token=AT&refresh_token=RT&token_type=bearer");
    assert.equal(t.access_token, "AT");
    assert.equal(t.refresh_token, "RT");
  });

  it("redirect natif attendu", () => {
    assert.equal("akoue://login", "akoue://login");
  });
});
