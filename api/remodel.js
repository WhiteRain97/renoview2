import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  try {
    const { messages = [], context = {} } = req.body || {};

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are a Remodel Outcomes Analyst. You have full freedom to ask any number of follow-up questions you need. When you have enough information, output a concise scorecard with: Expected ROI % (range), Estimated Cost (range), Estimated Timeline (range), Aesthetics Boost (0-10), Durability/Longevity (0-10), and brief assumptions. If more info is needed, ask one focused question next.`;

    const preface = `Context\nProject type: ${context.projectType ?? "unknown"}\nZIP: ${context.zip ?? "unknown"}\nHome value: ${context.homeValue ?? "unknown"}\nBudget: ${context.budget ?? "unspecified"}`;

    const input = [
      { role: "system", content: system },
      { role: "user", content: preface },
      ...messages,
    ];

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input,
    });

    const text = resp.output_text ||
      resp?.output?.[0]?.content?.[0]?.text?.value ||
      resp?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: String(err) });
  }
}
