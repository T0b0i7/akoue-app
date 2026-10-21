const nodemailer = require("nodemailer");

const MAX_RECIPIENTS = 450;
const BCC_BATCH_SIZE = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function respond(res, status, payload) {
  res.status(status).json(payload);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function supabaseHeaders(anonKey, accessToken) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function supabaseRequest(url, anonKey, accessToken, path, options = {}) {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(anonKey, accessToken),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || data?.error_description || `Supabase request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return { response, data };
}

module.exports = async function sendUpdateEmail(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return respond(res, 405, { error: "Méthode non autorisée." });

  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return respond(res, 401, { error: "Connexion administrateur requise." });

  const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const smtpUser = process.env.SMTP_USER || "[redacted-email]";
  const smtpPassword = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!supabaseUrl || !anonKey || !smtpPassword) {
    return respond(res, 503, { error: "Configuration serveur incomplète. Vérifie les secrets Supabase et SMTP dans Vercel." });
  }

  const { broadcastId, title, body, details, version, actionUrl } = req.body || {};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(broadcastId || "")) {
    return respond(res, 400, { error: "Identifiant d'annonce invalide." });
  }
  if (typeof title !== "string" || !title.trim() || title.length > 120
    || typeof body !== "string" || !body.trim() || body.length > 2000
    || typeof details !== "string" || details.length > 4000
    || typeof version !== "string" || version.length > 32
    || /[\r\n]/.test(title)
    || (version && !/^[a-zA-Z0-9._-]+$/.test(version))) {
    return respond(res, 400, { error: "Titre, message ou détails invalides." });
  }

  if (actionUrl != null && typeof actionUrl !== "string") {
    return respond(res, 400, { error: "Lien de téléchargement invalide." });
  }
  const downloadUrl = actionUrl?.trim() || "";
  let parsedUrl = null;
  if (downloadUrl) {
    try {
      parsedUrl = new URL(downloadUrl);
    } catch {
      return respond(res, 400, { error: "Lien de téléchargement invalide." });
    }
    if (parsedUrl.protocol !== "https:"
      || parsedUrl.username
      || parsedUrl.password
      || (parsedUrl.hostname !== "expo.dev" && !parsedUrl.hostname.endsWith(".expo.dev"))) {
      return respond(res, 400, { error: "Le lien de mise à jour doit être un lien HTTPS Expo." });
    }
  }

  let deliveryClaimed = false;
  let sentCount = 0;
  let recipientCount = 0;
  let smtp = null;
  try {
    const { data: admin } = await supabaseRequest(
      supabaseUrl,
      anonKey,
      accessToken,
      "/auth/v1/user"
    );
    if (!admin?.email) return respond(res, 401, { error: "Session administrateur invalide." });

    const adminFilter = new URLSearchParams({ select: "email", email: `eq.${admin.email}` });
    const { data: admins } = await supabaseRequest(
      supabaseUrl,
      anonKey,
      accessToken,
      `/rest/v1/admin_users?${adminFilter.toString()}`
    );
    if (!Array.isArray(admins) || !admins.some((entry) => entry.email?.toLowerCase() === admin.email.toLowerCase())) {
      return respond(res, 403, { error: "Seul un administrateur Akouè peut envoyer cette annonce." });
    }

    const { data: broadcast } = await supabaseRequest(
      supabaseUrl,
      anonKey,
      accessToken,
      `/rest/v1/broadcasts?${new URLSearchParams({ select: "id,kind,active", id: `eq.${broadcastId}` })}`
    );
    if (!Array.isArray(broadcast) || broadcast.length !== 1 || broadcast[0].kind !== "update" || !broadcast[0].active) {
      return respond(res, 400, { error: "L'annonce doit être une mise à jour active publiée." });
    }

    const recipients = new Set();
    for (let offset = 0; offset <= 10000; offset += 100) {
      const params = new URLSearchParams({ select: "email", email: "not.is.null" });
      const { response, data } = await supabaseRequest(
        supabaseUrl,
        anonKey,
        accessToken,
        `/rest/v1/profiles?${params.toString()}`,
        { headers: { Range: `${offset}-${offset + 99}` } }
      );
      if (!Array.isArray(data)) throw new Error("Impossible de lire les adresses des comptes.");
      for (const profile of data) {
        const email = profile.email?.trim().toLowerCase();
        if (email && EMAIL_PATTERN.test(email)) recipients.add(email);
      }
      if (recipients.size > MAX_RECIPIENTS) {
        return respond(res, 413, { error: `Envoi annulé : plus de ${MAX_RECIPIENTS} comptes. Utilise une solution d'envoi en lots supérieure.` });
      }
      if (data.length < 100) break;
      if (offset === 10000) throw new Error("Trop de profils pour une seule lecture paginée.");
      const contentRange = response.headers.get("content-range");
      if (contentRange && contentRange.split("/")[1] === String(offset + data.length)) break;
    }
    recipientCount = recipients.size;
    if (!recipientCount) return respond(res, 400, { error: "Aucune adresse e-mail valide trouvée dans les profils." });

    const logPath = `/rest/v1/broadcast_email_deliveries?on_conflict=broadcast_id`;
    const { data: claim } = await supabaseRequest(
      supabaseUrl,
      anonKey,
      accessToken,
      logPath,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify({
          broadcast_id: broadcastId,
          status: "sending",
          recipient_count: recipientCount,
          sent_count: 0,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    if (!Array.isArray(claim) || claim.length !== 1) {
      const { data: previous } = await supabaseRequest(
        supabaseUrl,
        anonKey,
        accessToken,
        `/rest/v1/broadcast_email_deliveries?${new URLSearchParams({ select: "status,sent_count", broadcast_id: `eq.${broadcastId}` })}`
      );
      if (previous?.[0]?.status === "failed" && Number(previous[0].sent_count) === 0) {
        const { response } = await supabaseRequest(
          supabaseUrl,
          anonKey,
          accessToken,
          `/rest/v1/broadcast_email_deliveries?${new URLSearchParams({ broadcast_id: `eq.${broadcastId}`, status: "eq.failed" })}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Prefer: "return=representation" },
            body: JSON.stringify({
              status: "sending",
              recipient_count: recipientCount,
              sent_count: 0,
              last_error: null,
              updated_at: new Date().toISOString(),
            }),
          }
        );
        const updated = await response.json().catch(() => []);
        if (!Array.isArray(updated) || updated.length !== 1) {
          return respond(res, 409, { error: "Cette annonce est déjà en cours ou a déjà été envoyée." });
        }
      } else {
        return respond(res, 409, {
          error: previous?.[0]?.sent_count
            ? "Un envoi partiel a déjà eu lieu. Il n'est pas relancé automatiquement pour éviter les doublons."
            : "Cette annonce est déjà en cours ou a déjà été envoyée.",
          sentCount: Number(previous?.[0]?.sent_count || 0),
          recipientCount: Number(previous?.[0]?.recipient_count || recipientCount),
        });
      }
    }
    deliveryClaimed = true;

    smtp = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });
    const from = `Akouè <${smtpUser}>`;
    const safeTitle = escapeHtml(title.trim());
    const safeBody = escapeHtml(body.trim()).replace(/\r?\n/g, "<br>");
    const safeDetails = escapeHtml(details).replace(/\r?\n/g, "<br>");
    const safeUrl = parsedUrl ? escapeHtml(parsedUrl.toString()) : "";
    const subject = `Mise à jour Akouè${version.trim() ? ` ${version.trim()}` : ""} : ${title.trim()}`;
    const downloadText = parsedUrl ? `\n\nTélécharger la mise à jour : ${parsedUrl.toString()}` : "";
    const downloadButton = parsedUrl
      ? `<p><a href="${safeUrl}" style="display:inline-block;background:#7047eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Télécharger la mise à jour</a></p>`
      : "";
    const text = `${title.trim()}\n\n${body.trim()}${details.trim() ? `\n\n${details.trim()}` : ""}${downloadText}\n\nTu reçois cet e-mail car tu as un compte Akouè.`;
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124;max-width:560px;margin:auto"><h1>${safeTitle}</h1><p>${safeBody}</p>${safeDetails ? `<p>${safeDetails}</p>` : ""}${downloadButton}<p style="font-size:12px;color:#666">Tu reçois cet e-mail car tu as un compte Akouè. Il s'agit d'une information relative au service, pas d'une newsletter.</p></div>`;

    const emailList = [...recipients];
    for (let offset = 0; offset < emailList.length; offset += BCC_BATCH_SIZE) {
      const batch = emailList.slice(offset, offset + BCC_BATCH_SIZE);
      const result = await smtp.sendMail({
        from,
        to: from,
        bcc: batch,
        subject,
        text,
        html,
      });
      sentCount += result.accepted?.length || 0;
      if ((result.rejected?.length || 0) > 0 || (result.accepted?.length || 0) !== batch.length) {
        throw new Error("Le serveur SMTP a refusé une ou plusieurs adresses.");
      }
      await supabaseRequest(
        supabaseUrl,
        anonKey,
        accessToken,
        `/rest/v1/broadcast_email_deliveries?${new URLSearchParams({ broadcast_id: `eq.${broadcastId}`, status: "eq.sending" })}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ sent_count: sentCount, updated_at: new Date().toISOString() }),
        }
      );
    }

    await smtp.close();
    smtp = null;
    await supabaseRequest(
      supabaseUrl,
      anonKey,
      accessToken,
      `/rest/v1/broadcast_email_deliveries?${new URLSearchParams({ broadcast_id: `eq.${broadcastId}` })}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "sent", recipient_count: recipientCount, sent_count: sentCount, updated_at: new Date().toISOString() }),
      }
    );
    return respond(res, 200, { sentCount, recipientCount });
  } catch (error) {
    if (smtp) smtp.close();
    if (deliveryClaimed) {
      try {
        await supabaseRequest(
          supabaseUrl,
          anonKey,
          accessToken,
          `/rest/v1/broadcast_email_deliveries?${new URLSearchParams({ broadcast_id: `eq.${broadcastId}` })}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({
              status: "failed",
              sent_count: sentCount,
              last_error: String(error.message || "Erreur SMTP").slice(0, 500),
              updated_at: new Date().toISOString(),
            }),
          }
        );
      } catch (logError) {
        console.error("[update-email] Could not update delivery log:", logError.message);
      }
    }
    console.error("[update-email] Delivery failed:", error.message);
    return respond(res, error.status || 500, {
      error: sentCount
        ? "L'envoi a échoué après un envoi partiel. Il ne sera pas relancé automatiquement."
        : error.message || "Échec de l'envoi de l'e-mail.",
      sentCount,
      recipientCount,
    });
  }
};

module.exports.config = { maxDuration: 60 };
