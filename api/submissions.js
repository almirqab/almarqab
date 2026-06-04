import { kv } from "@vercel/kv";

function generateRef(prefix) {
  var ts     = Date.now().toString(36).toUpperCase();
  var random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + "-" + ts + "-" + random;
}

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

function parseBody(body) {
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch (_) { return {}; }
  }
  return body || {};
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // رابط مثال: /api/submissions?type=listings
  var type = (req.query && req.query.type) ? req.query.type : "subs";
  // type: subs | listings | clients

  try {

    /* ══ GET ══ */
    if (req.method === "GET") {
      var data = await kv.lrange(type, 0, -1) || [];
      return res.status(200).json({ ok: true, data: data });
    }

    /* ══ POST — إضافة جديد ══ */
    if (req.method === "POST") {
      var body = parseBody(req.body);

      if (type === "subs") {
        if (!body.ownerPhone) return res.status(400).json({ ok: false, error: "رقم الجوال مطلوب" });
        var entry = Object.assign({}, body, {
          id:     Date.now(),
          ref:    generateRef("REQ"),
          status: "new",
          date:   getKSADate()
        });
        await kv.lpush("subs", entry);
        return res.status(201).json({ ok: true, data: entry });
      }

      if (type === "listings") {
        if (!body.title || !body.price) return res.status(400).json({ ok: false, error: "البيانات ناقصة" });
        var listing = Object.assign({}, body, {
          id:   body.id   || Date.now(),
          ref:  body.ref  || generateRef("PRO"),
          date: body.date || getKSADate()
        });
        // احذف القديم لو موجود (تحديث)
        var all = await kv.lrange("listings", 0, -1) || [];
        var filtered = all.filter(function(l) { return String(l.id) !== String(listing.id); });
        await kv.del("listings");
        filtered.unshift(listing);
        for (var i = filtered.length - 1; i >= 0; i--) {
          await kv.lpush("listings", filtered[i]);
        }
        return res.status(201).json({ ok: true, data: listing });
      }

      if (type === "clients") {
        if (!body.name || !body.phone) return res.status(400).json({ ok: false, error: "البيانات ناقصة" });
        var client = Object.assign({}, body, {
          id:   body.id   || Date.now(),
          date: body.date || getKSADate()
        });
        await kv.lpush("clients", client);
        return res.status(201).json({ ok: true, data: client });
      }
    }

    /* ══ PUT — تحديث حالة ══ */
    if (req.method === "PUT") {
      var body2 = parseBody(req.body);
      var all2  = await kv.lrange(type, 0, -1) || [];
      var updated = false;
      for (var j = 0; j < all2.length; j++) {
        if (String(all2[j].id) === String(body2.id)) {
          all2[j] = Object.assign({}, all2[j], body2);
          updated = true;
          break;
        }
      }
      if (!updated) return res.status(404).json({ ok: false, error: "not found" });
      await kv.del(type);
      for (var k = all2.length - 1; k >= 0; k--) {
        await kv.lpush(type, all2[k]);
      }
      return res.status(200).json({ ok: true });
    }

    /* ══ DELETE ══ */
    if (req.method === "DELETE") {
      var body3 = parseBody(req.body);
      var all3  = await kv.lrange(type, 0, -1) || [];
      var newList = all3.filter(function(x) { return String(x.id) !== String(body3.id); });
      await kv.del(type);
      for (var m = newList.length - 1; m >= 0; m--) {
        await kv.lpush(type, newList[m]);
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  } catch (e) {
    console.error("API Error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
