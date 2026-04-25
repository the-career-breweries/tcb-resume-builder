export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { formData, briefData, jobTitle, company, jobDescription } = req.body;
  if (!formData) return res.status(400).json({ error: "Missing form data" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  // Build context from brief answers if available
  const briefContext = briefData ? `
BRIEF ANSWERS FROM THE APPLICATION BRIEF (use these to enrich the generated content):
${Object.entries(briefData.answers || {}).map(([k,v]) => `${k}: ${v}`).join("\n")}
Their positioning angle: ${briefData.output?.angle || ""}
Their lead line: ${briefData.output?.leadLine || ""}
What to emphasise: ${(briefData.output?.emphasise || []).join("; ")}
` : "";

  // Consolidate all voice/text inputs
  const workContext = (formData.experience || []).map((r, i) =>
    `Role ${i+1}: ${r.title} at ${r.company} (${r.startDate}–${r.endDate})
Voice description: ${r.voiceText || r.description || ""}
Raw notes: ${r.notes || ""}`
  ).join("\n\n");

  const prompt = `You are an expert resume writer building a complete resume from scratch for a candidate.

TARGET ROLE: ${jobTitle || formData.targetTitle || ""}
TARGET COMPANY: ${company || formData.targetCompany || ""}
JOB DESCRIPTION: ${jobDescription || formData.jobDescription || "Not provided"}

${briefContext}

CANDIDATE INPUTS:

Personal: ${formData.name}, ${formData.email}, ${formData.phone}, ${formData.location}, ${formData.linkedin || ""}
Headline: ${formData.headline || ""}
Professional Summary (voice input): ${formData.summaryVoice || formData.summary || ""}
Skills (voice input): ${formData.skillsVoice || formData.skills || ""}

Work Experience:
${workContext}

Education:
${(formData.education || []).map(e => `${e.degree} at ${e.institution} (${e.startYear}–${e.endYear}${e.location ? ", "+e.location : ""}${e.grade ? ", "+e.grade : ""})`).join("\n")}

Certifications & Trainings:
${(formData.certifications || []).map(c => `${c.name} by ${c.provider} (${c.year})${c.voiceText ? " — "+c.voiceText : ""}`).join("\n")}

Languages:
${(formData.languages || []).map(l => `${l.language}: ${l.level}`).join(", ")}

WRITING RULES:
- Professional summary: 3–4 sentences, first person, no clichés, uses JD keywords naturally, informed by brief answers if available
- Experience bullets: 4–5 per role, action verb + specific outcome, no "responsible for", informed by voice descriptions
- Skills: categorise into groups (e.g. Core, Technical, Soft) — use brief context and voice input
- Never invent facts — only use what the candidate has provided
- Tone: warm, specific, confident — no buzzwords
- Length: target 1 page if experience < 5 years, 1.75 pages if more

Respond with ONLY a valid JSON object:
{
  "name": "",
  "tagline": "targeted role title",
  "contact": { "email": "", "phone": "", "location": "", "linkedin": "" },
  "summary": "3–4 sentence professional summary",
  "competencies": ["skill1","skill2","skill3","skill4","skill5","skill6","skill7","skill8"],
  "experience": [
    {
      "title": "",
      "company": "",
      "type": "",
      "startDate": "MM/YYYY",
      "endDate": "Present or MM/YYYY",
      "location": "",
      "bullets": ["Action verb + specific outcome","...","...","...","..."]
    }
  ],
  "education": [
    { "degree": "", "institution": "", "startYear": "YYYY", "endYear": "YYYY", "location": "" }
  ],
  "certifications": [
    { "name": "", "provider": "", "year": "MM/YYYY" }
  ],
  "languages": [
    { "language": "", "level": "Native/Professional/Proficient" }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: "Generation failed" });

    const raw = data?.content?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json({ success: true, resume: parsed });
  } catch (err) {
    console.error("Build resume error:", err);
    return res.status(500).json({ error: "Generation failed. Please try again." });
  }
}
