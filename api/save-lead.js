export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, phone, name, jobTitle, company } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const sheetHook   = process.env.GOOGLE_SHEET_WEBHOOK;

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/resume_builds`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}`, "Prefer": "return=representation" },
      body: JSON.stringify({ email, phone, name, job_title: jobTitle, company, paid: false }),
    });
    const d = await r.json();
    const leadId = d?.[0]?.id || null;
    if (sheetHook) {
      fetch(sheetHook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "resume_build_lead", email, phone, name, jobTitle, company }) }).catch(() => {});
    }
    return res.status(200).json({ success: true, leadId });
  } catch (e) {
    return res.status(200).json({ success: true, leadId: null });
  }
}
