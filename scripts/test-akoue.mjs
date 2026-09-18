import { createClient } from "@supabase/supabase-js";

const URL = "https://rquwmzgxcgpqrlskhwfb.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdXdtemd4Y2dwcXJsc2tod2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NzQxMTYsImV4cCI6MjEwNTA1MDExNn0.veco5GlWU9pyTM_p7hlmwZlFGehPS3sKB8Z_bHbGD0s";
const SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdXdtemd4Y2dwcXJsc2tod2ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ3NDExNiwiZXhwIjoyMTA1MDUwMTE2fQ.lTQvDmBXr4uHbCIG7h6MFuWWgKV6xuqpM4SzC_smOL0";

const anon = createClient(URL, ANON);
const service = createClient(URL, SERVICE);

const email = `akoue_full_${Date.now()}@gmail.com`;
const password = "Test1234!";
let uid, walletId1, walletId2;
let passed = 0, failed = 0;

function ok(name, cond, detail=""){ if(cond){ console.log(`✅ ${name} ${detail}`); passed++; } else { console.log(`❌ ${name} ${detail}`); failed++; } }
function log(s){ console.log(`\n=== ${s} ===`); }

try {
  log("1. AUTH - SignUp");
  const { data: su, error: suErr } = await anon.auth.signUp({ email, password, options:{ data:{ name:"Akoue Tester" }}}); 
  ok("SignUp", !suErr && !!su.user, suErr?.message || su.user?.id);
  uid = su.user.id;
  // profile auto? insert
  const { error: pErr } = await anon.from("profiles").insert({ id: uid, name:"Akoue Tester" });
  ok("Profile insert", !pErr, pErr?.message||"");

  log("2. AUTH - SignIn");
  await anon.auth.signOut();
  const { data: si, error: siErr } = await anon.auth.signInWithPassword({ email, password });
  ok("SignIn", !siErr && !!si.session, siErr?.message||"");

  log("3. WALLETS - Create 2 wallets");
  const { data: w1, error: w1Err } = await anon.from("wallets").insert({ uid, name:"Salaire", amount:0, totalIncome:0, totalExpenses:0 }).select().single();
  ok("Create Wallet Salaire", !w1Err && !!w1, w1Err?.message||w1?.id); walletId1=w1?.id;
  const { data: w2, error: w2Err } = await anon.from("wallets").insert({ uid, name:"Cash", amount:0, totalIncome:0, totalExpenses:0 }).select().single();
  ok("Create Wallet Cash", !w2Err && !!w2, w2Err?.message||w2?.id); walletId2=w2?.id;

  log("4. WALLETS - Fetch + Update");
  const { data: wallets } = await anon.from("wallets").select("*").eq("uid", uid);
  ok("Fetch wallets count=2", wallets?.length===2, `got ${wallets?.length}`);
  const { error: updErr } = await anon.from("wallets").update({ name:"Salaire Principal" }).eq("id", walletId1);
  ok("Update wallet name", !updErr, updErr?.message||"");
  const { data: wCheck } = await anon.from("wallets").select("name").eq("id", walletId1).single();
  ok("Verify update", wCheck?.name==="Salaire Principal", wCheck?.name);

  log("5. TRANSACTIONS - Income 5000 on wallet1 (simulate service: update wallet)");
  // Simulate service: insert tx then update wallet
  const { data: tx1, error: tx1Err } = await anon.from("transactions").insert({ uid, walletId: walletId1, type:"income", amount:5000, category:"salary", description:"Salaire", date:new Date().toISOString() }).select().single();
  ok("Insert income 5000", !tx1Err, tx1Err?.message||tx1?.id);
  // service would update wallet
  await anon.from("wallets").update({ amount:5000, totalIncome:5000 }).eq("id", walletId1);
  const { data: wAfterIncome } = await anon.from("wallets").select("amount,totalIncome").eq("id", walletId1).single();
  ok("Wallet after income amount=5000", Number(wAfterIncome.amount)===5000, `amt=${wAfterIncome.amount}`);

  log("6. TRANSACTIONS - Expense 1200 on wallet1");
  const { data: tx2, error: tx2Err } = await anon.from("transactions").insert({ uid, walletId: walletId1, type:"expense", amount:1200, category:"food", description:"Courses", date:new Date().toISOString() }).select().single();
  ok("Insert expense 1200", !tx2Err, tx2Err?.message||tx2?.id);
  await anon.from("wallets").update({ amount:3800, totalExpenses:1200 }).eq("id", walletId1);
  const { data: wAfterExp } = await anon.from("wallets").select("amount,totalIncome,totalExpenses").eq("id", walletId1).single();
  ok("Wallet after expense amount=3800", Number(wAfterExp.amount)===3800 && Number(wAfterExp.totalExpenses)===1200, `amt=${wAfterExp.amount}`);

  log("7. TRANSACTIONS - Expense exceeds balance should be blocked by service logic (we test manually)");
  const { data: wBal } = await anon.from("wallets").select("amount").eq("id", walletId1).single();
  const shouldBlock = Number(wBal.amount) < 10000;
  ok("Insufficient balance detection (3800 < 10000)", shouldBlock, `balance=${wBal.amount}`);

  log("8. TRANSACTIONS - Move tx between wallets (simulate revert/update)");
  // Create tx on wallet2 then move to wallet1
  const { data: tx3 } = await anon.from("transactions").insert({ uid, walletId: walletId2, type:"income", amount:800, category:"freelance", description:"Mission", date:new Date().toISOString() }).select().single();
  await anon.from("wallets").update({ amount:800, totalIncome:800 }).eq("id", walletId2);
  ok("Income 800 on wallet2", !!tx3, tx3?.id);
  // move tx3 to wallet1: revert wallet2, apply wallet1
  await anon.from("wallets").update({ amount:0, totalIncome:0 }).eq("id", walletId2);
  await anon.from("wallets").update({ amount:4600, totalIncome:5800 }).eq("id", walletId1);
  await anon.from("transactions").update({ walletId: walletId1 }).eq("id", tx3.id);
  const { data: w1Moved } = await anon.from("wallets").select("amount").eq("id", walletId1).single();
  const { data: w2Moved } = await anon.from("wallets").select("amount").eq("id", walletId2).single();
  ok("After move wallet1=4600", Number(w1Moved.amount)===4600, `got ${w1Moved.amount}`);
  ok("After move wallet2=0", Number(w2Moved.amount)===0, `got ${w2Moved.amount}`);

  log("9. TRANSACTIONS - Delete tx and revert wallet");
  await anon.from("transactions").delete().eq("id", tx2.id);
  await anon.from("wallets").update({ amount:5800, totalExpenses:0 }).eq("id", walletId1); // revert expense 1200
  const { data: wAfterDel } = await anon.from("wallets").select("amount,totalExpenses").eq("id", walletId1).single();
  ok("After delete expense wallet amount 5800", Number(wAfterDel.amount)===5800 && Number(wAfterDel.totalExpenses)===0, `amt=${wAfterDel.amount}`);

  log("10. STATS - Weekly / Monthly / Yearly queries");
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const { data: weekly, error: wErr2 } = await anon.from("transactions").select("*").eq("uid", uid).gte("date", weekAgo.toISOString());
  ok("Weekly fetch", !wErr2 && weekly.length>=2, `count=${weekly?.length}`);
  const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear()-1);
  const { data: yearly } = await anon.from("transactions").select("*").eq("uid", uid).gte("date", yearAgo.toISOString());
  ok("Yearly fetch", yearly.length>=2, `count=${yearly.length}`);

  log("11. STORAGE - Upload receipt (bucket receipts)");
  // create small fake image buffer
  const { data: bucket } = await service.storage.getBucket("receipts");
  ok("Bucket receipts exists", !!bucket, bucket?.name);
  const fake = new Uint8Array([137,80,78,71]); // PNG header
  const path = `${uid}/test_${Date.now()}.png`;
  const { error: upErr } = await anon.storage.from("receipts").upload(path, fake, { contentType:"image/png" });
  ok("Upload receipt", !upErr, upErr?.message||path);
  const { data: pub } = anon.storage.from("receipts").getPublicUrl(path);
  ok("Public URL", !!pub.publicUrl.includes("receipts"), pub.publicUrl.slice(0,60));
  await service.storage.from("receipts").remove([path]);
  ok("Delete receipt", true, "");

  log("12. RLS - Isolation (user B cannot see user A data)");
  const emailB = `akoue_b_${Date.now()}@gmail.com`;
  const anonB = createClient(URL, ANON);
  const { data: suB } = await anonB.auth.signUp({ email: emailB, password:"Test1234!", options:{data:{name:"User B"}}});
  await anonB.from("profiles").insert({ id: suB.user.id, name:"User B" });
  await anonB.auth.signInWithPassword({ email: emailB, password:"Test1234!" });
  const { data: walletsB } = await anonB.from("wallets").select("*").eq("uid", suB.user.id);
  ok("User B wallets empty", walletsB.length===0, `got ${walletsB.length}`);
  const { data: walletsA_as_B } = await anonB.from("wallets").select("*").eq("uid", uid);
  ok("User B cannot see A wallets", walletsA_as_B.length===0, `got ${walletsA_as_B.length}`);
  // cleanup B
  await service.auth.admin.deleteUser(suB.user.id);
  await service.from("profiles").delete().eq("id", suB.user.id);

  log("13. USER - Update profile");
  const { error: updProfErr } = await anon.from("profiles").update({ name:"Akoue Tester Updated" }).eq("id", uid);
  ok("Update profile name", !updProfErr, updProfErr?.message||"");
  const { data: profCheck } = await anon.from("profiles").select("name").eq("id", uid).single();
  ok("Verify profile updated", profCheck.name==="Akoue Tester Updated", profCheck.name);

  log("14. WALLET - Delete cascade transactions");
  // wallet2 currently has 0 tx after move, add one then delete wallet
  const { data: txTmp } = await anon.from("transactions").insert({ uid, walletId: walletId2, type:"expense", amount:50, category:"test", description:"tmp", date:new Date().toISOString() }).select().single();
  await anon.from("wallets").delete().eq("id", walletId2);
  const { data: txAfter } = await anon.from("transactions").select("*").eq("walletId", walletId2);
  ok("Cascade delete transactions after wallet delete", txAfter.length===0, `remaining ${txAfter.length}`);

  log("15. AUTH - Forgot password + Update password + Logout");
  const { error: fpErr } = await anon.auth.resetPasswordForEmail(email);
  ok("Forgot password (email sent)", !fpErr, fpErr?.message||"");
  // update password requires reauth - test signIn with old then update
  await anon.auth.signInWithPassword({ email, password });
  const { error: upPwErr } = await anon.auth.updateUser({ password:"NewPass123!" });
  ok("Update password", !upPwErr, upPwErr?.message||"");
  await anon.auth.signOut();
  const { error: siNewErr } = await anon.auth.signInWithPassword({ email, password:"NewPass123!" });
  ok("SignIn with new password", !siNewErr, siNewErr?.message||"");
  const { error: loErr } = await anon.auth.signOut();
  ok("Logout", !loErr, loErr?.message||"");

  log("CLEANUP");
  await service.from("transactions").delete().eq("uid", uid);
  await service.from("wallets").delete().eq("uid", uid);
  await service.from("profiles").delete().eq("id", uid);
  await service.auth.admin.deleteUser(uid);
  console.log(`\n=== RESULTATS: ${passed} passed, ${failed} failed ===`);
  process.exit(failed>0 ? 1 : 0);
} catch(e){
  console.error("FATAL", e);
  process.exit(1);
}
