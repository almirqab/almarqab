import { kv } from "@vercel/kv";

/* ══════════════════════════════════════════════
   المرقاب الذهبي — API الخلفي
   النقطة الوحيدة: /api/submissions?type=subs|listings|clients
══════════════════════════════════════════════ */

/* ── توليد رقم مرجعي فريد ── */
function generateRef(prefix) {
  var ts     = Date.now().toString(36).toUpperCase();
  var random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + "-" + ts + "-" + random;
}

/* ── تاريخ ووقت السعودية ── */
function getKSADate() {
  return new Date().toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
    hour:     "2-digit",
    minute:   "2-digit"
  });
}

/* ── تحليل جسم الطلب بأمان ── */
function parseBody(body) {
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch (_) { return {}; }
  }
  return body || {};
}

/* ══ الدالة الرئيسية ══ */
export default async function handler(req, res) {

  /* رؤوس CORS — تسمح للواجهة بالاتصال */
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  /* طلب preflight من المتصفح — نرد فوراً */
  if (req.method === "OPTIONS") return res.status(200).end();

  /* نوع البيانات: subs | listings | clients */
  var type = (req.query && req.query.type) ? req.query.type : "subs";

  /* التحقق من أن النوع مسموح به — حماية من طلبات غريبة */
  if (!["subs", "listings", "clients"].includes(type)) {
    return res.status(400).json({ ok: false, error: "نوع غير مدعوم" });
  }

  /* التحقق من وجود متغيرات البيئة قبل أي عملية */
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error("❌ KV_REST_API_URL أو KV_REST_API_TOKEN غير موجودة في Environment Variables");
    return res.status(500).json({
      ok: false,
      error: "الخادم غير مهيأ بشكل صحيح — تحقق من متغيرات البيئة في Vercel"
    });
  }

  try {

    /* ══ GET — جلب البيانات ══ */
    if (req.method === "GET") {
      var data = await kv.lrange(type, 0, -1) || [];
      return res.status(200).json({ ok: true, data: data });
    }

    /* ══ POST — إضافة سجل جديد ══ */
    if (req.method === "POST") {
      var body = parseBody(req.body);

      /* --- طلبات الإعلانات الواردة من العملاء --- */
      if (type === "subs") {
        if (!body.ownerPhone) {
          return res.status(400).json({ ok: false, error: "رقم الجوال مطلوب" });
        }
        var entry = Object.assign({}, body, {
          id:     Date.now(),
          ref:    generateRef("REQ"),
          status: "new",
          date:   getKSADate()
        });
        await kv.lpush("subs", entry);
        return res.status(201).json({ ok: true, data: entry });
      }

      /* --- العقارات في لوحة التحكم --- */
      if (type === "listings") {
        if (!body.title || !body.price) {
          return res.status(400).json({ ok: false, error: "البيانات ناقصة: العنوان والسعر مطلوبان" });
        }
        var listing = Object.assign({}, body, {
          id:   body.id   || Date.now(),
          ref:  body.ref  || generateRef("PRO"),
          date: body.date || getKSADate()
        });
        /* تحديث: احذف القديم لو موجود ثم أضف الجديد */
        var all = await kv.lrange("listings", 0, -1) || [];
        var filtered = all.filter(function(l) {
          return String(l.id) !== String(listing.id);
        });
        await kv.del("listings");
        filtered.unshift(listing);
        for (var i = filtered.length - 1; i >= 0; i--) {
          await kv.lpush("listings", filtered[i]);
        }
        return res.status(201).json({ ok: true, data: listing });
      }

      /* --- العملاء --- */
      if (type === "clients") {
        if (!body.name || !body.phone) {
          return res.status(400).json({ ok: false, error: "البيانات ناقصة: الاسم والجوال مطلوبان" });
        }
        var client = Object.assign({}, body, {
          id:   body.id   || Date.now(),
          date: body.date || getKSADate()
        });
        await kv.lpush("clients", client);
        return res.status(201).json({ ok: true, data: client });
      }
    }

    /* ══ PUT — تحديث سجل موجود ══ */
    if (req.method === "PUT") {
      var body2 = parseBody(req.body);
      if (!body2.id) {
        return res.status(400).json({ ok: false, error: "id مطلوب للتحديث" });
      }
      var all2    = await kv.lrange(type, 0, -1) || [];
      var updated = false;

      for (var j = 0; j < all2.length; j++) {
        if (String(all2[j].id) === String(body2.id)) {
          all2[j] = Object.assign({}, all2[j], body2);
          updated  = true;
          break;
        }
      }
      if (!updated) {
        return res.status(404).json({ ok: false, error: "السجل غير موجود" });
      }
      await kv.del(type);
      for (var k = all2.length - 1; k >= 0; k--) {
        await kv.lpush(type, all2[k]);
      }
      return res.status(200).json({ ok: true });
    }

    /* ══ DELETE — حذف سجل ══ */
    if (req.method === "DELETE") {
      var body3   = parseBody(req.body);
      if (!body3.id) {
        return res.status(400).json({ ok: false, error: "id مطلوب للحذف" });
      }
      var all3    = await kv.lrange(type, 0, -1) || [];
      var newList = all3.filter(function(x) {
        return String(x.id) !== String(body3.id);
      });
      await kv.del(type);
      for (var m = newList.length - 1; m >= 0; m--) {
        await kv.lpush(type, newList[m]);
      }
      return res.status(200).json({ ok: true });
    }

    /* أي method ثاني غير مدعوم */
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  } catch (e) {
    /* خطأ غير متوقع — نسجله في Vercel logs */
    console.error("API Error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
