import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const SENDER_EMAIL = "info@orbixcity.com";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse(200, {
        ok: true,
        service: "orbixcity-admin-email-worker",
      });
    }

    if (request.method !== "POST" || url.pathname !== "/send-admin-notification") {
      return jsonResponse(404, {
        ok: false,
        error: "not_found",
      });
    }

    if (!isAuthorized(request, env)) {
      return jsonResponse(401, {
        ok: false,
        error: "unauthorized",
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse(400, {
        ok: false,
        error: "invalid_json",
      });
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return jsonResponse(400, {
        ok: false,
        error: validationError,
      });
    }

    const subject = buildSubject(payload.eventType, payload.entityId);
    const textBody = buildTextBody(payload);
    const htmlBody = buildHtmlBody(payload, textBody);
    const recipient = env.ADMIN_NOTIFICATION_RECIPIENT;

    const mime = createMimeMessage();
    mime.setSender({
      name: "OrbixCity Admin Notifications",
      addr: SENDER_EMAIL,
    });
    mime.setRecipient(recipient);
    mime.setSubject(subject);
    mime.addMessage({
      contentType: "text/plain",
      data: textBody,
    });
    mime.addMessage({
      contentType: "text/html",
      data: htmlBody,
    });

    const message = new EmailMessage(SENDER_EMAIL, recipient, mime.asRaw());

    try {
      await env.ADMIN_NOTIFICATION_EMAIL.send(message);
    } catch (error) {
      return jsonResponse(502, {
        ok: false,
        error: "email_send_failed",
        detail: error instanceof Error ? error.message : "unknown_error",
      });
    }

    return jsonResponse(202, {
      ok: true,
      accepted: true,
      subject,
    });
  },
};

function isAuthorized(request, env) {
  const authHeader = request.headers.get("authorization") || "";
  const expectedToken = env.FIREBASE_SHARED_SECRET;

  if (!expectedToken || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedToken = authHeader.slice("Bearer ".length).trim();
  return providedToken === expectedToken;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "payload_required";
  }

  if (!isNonEmptyString(payload.eventType)) {
    return "event_type_required";
  }

  if (!isNonEmptyString(payload.summary)) {
    return "summary_required";
  }

  if (payload.entityId !== undefined && typeof payload.entityId !== "string") {
    return "entity_id_must_be_string";
  }

  if (payload.metadata !== undefined && !isPlainObject(payload.metadata)) {
    return "metadata_must_be_object";
  }

  return null;
}

function buildSubject(eventType, entityId) {
  if (eventType === "property_booking") {
    return `طلب حجز عقار جديد${entityId ? ` (#${entityId})` : ""}`.slice(0, 140);
  }
  if (eventType === "purchase") {
    return `طلب شراء عقار جديد${entityId ? ` (#${entityId})` : ""}`.slice(0, 140);
  }
  const normalizedEvent = eventType.trim().replace(/\s+/g, " ");
  const suffix = entityId ? ` (#${entityId})` : "";
  return `[OrbixCity Admin] ${normalizedEvent}${suffix}`.slice(0, 140);
}

function buildTextBody(payload) {
  if (payload.eventType === "property_booking" || payload.eventType === "purchase") {
    const metadata = payload.metadata || {};
    const isBooking = payload.eventType === "property_booking";
    const lines = [
      isBooking ? "طلب حجز عقار جديد" : "طلب شراء عقار جديد",
      "",
      `العقار: ${displayValue(metadata.propertyTitle)}`,
      `رقم العقار: ${displayValue(metadata.propertyId)}`,
      isBooking
        ? `رقم طلب الحجز: ${displayValue(metadata.bookingId)}`
        : `رقم طلب الشراء / الصفقة: ${displayValue(metadata.dealId || metadata.bookingId)}`,
      `اسم العميل: ${displayValue(metadata.customerName)}`,
      `بريد العميل: ${displayValue(metadata.customerEmail)}`,
      `هاتف العميل: ${displayValue(metadata.customerPhone, "غير مضاف")}`,
    ];

    if (isBooking) {
      lines.push(`تاريخ الوصول: ${displayValue(metadata.checkIn)}`);
      lines.push(`تاريخ المغادرة: ${displayValue(metadata.checkOut)}`);
      lines.push(`عدد الضيوف: ${displayValue(metadata.guests)}`);
    } else {
      lines.push(`السعر / العرض: ${displayValue(metadata.proposedPrice, "غير محدد")}`);
    }

    lines.push(`الملاحظات: ${displayValue(metadata.customerNote, "لا توجد ملاحظات")}`);
    lines.push(metadata.dashboardLink || metadata.dashboardHint || (isBooking ? "افتح لوحة التحكم > الحجوزات" : "افتح لوحة التحكم > الصفقات"));
    lines.push("");
    lines.push(`مرجع المستخدم: ${displayValue(metadata.customerUserId)}`);
    lines.push("");
    lines.push("Metadata:");
    lines.push(JSON.stringify(metadata, null, 2));
    return lines.join("\n");
  }

  const lines = [
    "OrbixCity admin notification",
    "",
    `Event: ${payload.eventType}`,
    `Summary: ${payload.summary}`,
  ];

  if (payload.entityId) {
    lines.push(`Entity ID: ${payload.entityId}`);
  }

  if (payload.actorId) {
    lines.push(`Actor ID: ${payload.actorId}`);
  }

  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    lines.push("");
    lines.push("Metadata:");
    lines.push(JSON.stringify(payload.metadata, null, 2));
  }

  return lines.join("\n");
}

function buildHtmlBody(payload, textBody) {
  if (payload.eventType === "property_booking" || payload.eventType === "purchase") {
    const metadata = payload.metadata || {};
    const isBooking = payload.eventType === "property_booking";
    const title = isBooking ? "طلب حجز عقار جديد" : "طلب شراء عقار جديد";
    const rows = [
      ["العقار", metadata.propertyTitle],
      ["رقم العقار", metadata.propertyId],
      [isBooking ? "رقم طلب الحجز" : "رقم طلب الشراء / الصفقة", isBooking ? metadata.bookingId : metadata.dealId || metadata.bookingId],
      ["اسم العميل", metadata.customerName],
      ["بريد العميل", metadata.customerEmail],
      ["هاتف العميل", metadata.customerPhone || "غير مضاف"],
      ...(isBooking
        ? [
            ["تاريخ الوصول", metadata.checkIn],
            ["تاريخ المغادرة", metadata.checkOut],
            ["عدد الضيوف", metadata.guests],
          ]
        : [["السعر / العرض", metadata.proposedPrice || "غير محدد"]]),
      ["الملاحظات", metadata.customerNote || "لا توجد ملاحظات"],
      ["مرجع المستخدم", metadata.customerUserId],
    ];
    const dashboardAction = metadata.dashboardLink
      ? `<a href="${escapeHtml(metadata.dashboardLink)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:bold;">فتح لوحة التحكم</a>`
      : `<p style="font-weight:bold;color:#1d4ed8;">${escapeHtml(metadata.dashboardHint || (isBooking ? "افتح لوحة التحكم > الحجوزات" : "افتح لوحة التحكم > الصفقات"))}</p>`;

    return `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="font-family:Arial,sans-serif;color:#111827;line-height:1.7;background:#f8fafc;padding:24px;">
    <main style="max-width:680px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
      <h2 style="margin-top:0;color:#1d4ed8;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${rows.map(([label, value]) => `<tr><th style="text-align:right;padding:9px;border-bottom:1px solid #e2e8f0;color:#475569;width:38%;">${escapeHtml(label)}</th><td style="padding:9px;border-bottom:1px solid #e2e8f0;">${escapeHtml(displayValue(value))}</td></tr>`).join("")}</tbody>
      </table>
      <div style="margin-top:20px;">${dashboardAction}</div>
      <h3 style="margin-top:26px;">Metadata</h3>
      <pre dir="ltr" style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:10px;overflow:auto;">${escapeHtml(JSON.stringify(metadata, null, 2))}</pre>
    </main>
  </body>
</html>`;
  }

  const metadataHtml =
    payload.metadata && Object.keys(payload.metadata).length > 0
      ? `<h3>Metadata</h3><pre>${escapeHtml(
          JSON.stringify(payload.metadata, null, 2),
        )}</pre>`
      : "";

  return `<!doctype html>
<html lang="en">
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h2>OrbixCity admin notification</h2>
    <p><strong>Event:</strong> ${escapeHtml(payload.eventType)}</p>
    <p><strong>Summary:</strong> ${escapeHtml(payload.summary)}</p>
    ${payload.entityId ? `<p><strong>Entity ID:</strong> ${escapeHtml(payload.entityId)}</p>` : ""}
    ${payload.actorId ? `<p><strong>Actor ID:</strong> ${escapeHtml(payload.actorId)}</p>` : ""}
    ${metadataHtml}
    <hr />
    <pre>${escapeHtml(textBody)}</pre>
  </body>
</html>`;
}

function displayValue(value, fallback = "غير متوفر") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS,
  });
}
