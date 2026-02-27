export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const r = await fetch(process.env.SHEETS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        ...body,
        _secret: process.env.SHEETS_SECRET
      })
    });

    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch (_) {}

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}