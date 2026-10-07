/* Helpers partagés : client Supabase + garde admin */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function currentAdmin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user?.email) return null;
  const { data } = await sb.from("admin_users").select("email").eq("email", session.user.email).maybeSingle();
  return data ? session : null;
}

async function guard() {
  const session = await currentAdmin();
  if (!session) { location.href = "index.html"; return null; }
  const btn = document.getElementById("logout");
  if (btn) btn.onclick = async () => { await sb.auth.signOut(); location.href = "index.html"; };
  return session;
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtNum = (n) => Number(n || 0).toLocaleString("fr-FR");
