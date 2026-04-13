// api/comments.js — Vercel serverless function
// Proxies requests to Supabase so the iframe page can fetch without CSP issues.

const SUPABASE_URL = "https://mrylfrsyhaxshqaxruae.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  try {
    if (req.method === "GET") {
      const { page } = req.query;
      if (!page) return res.status(400).json({ error: "Missing page param" });

      const url = `${SUPABASE_URL}/rest/v1/comments?page=eq.${encodeURIComponent(page)}&order=created_at.asc`;
      const upstream = await fetch(url, { headers });
      const data = await upstream.json();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { page, name, comment } = req.body;
      if (!page || !name || !comment) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const upstream = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ page, name, comment }),
      });

      if (!upstream.ok) {
        const err = await upstream.text();
        return res.status(upstream.status).json({ error: err });
      }

      return res.status(201).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
