import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  try {
    const { messages = [], context = {} } = req.body || {};

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const room = (context.projectType ?? "room").toLowerCase();

    const system = `You are a Remodel Outcomes Analyst & Expert. You are chatting with a homeowner about a planned remodel of their ${room} with a contractor.
    Your job is to build a mental model of (1) the current state of their ${room} and (2) the desired post-remodel state of their ${room}, by asking thoughtful follow-ups until you’re satisfied.
    
    Using those models together with the ZIP code and home value they provide, estimate and report:
    - Expected financial ROI (increase in home value ÷ total remodel cost)
    - Estimated total cost (range)
    - Estimated timeline/quickness (range)
    - Expected improvement in aesthetics/looks (0-10)
    - Expected durability/longevity/time until next remodel (0-10)
    
    Ask one focused question at a time when you need more detail; if you have enough, stop asking and output the scorecard with brief assumptions.
    Be concise and practical.`;

    const preface = `Context\nProject type: ${context.projectType ?? "unknown"}\nZIP: ${context.zip ?? "unknown"}\nHome value: ${context.homeValue ?? "unknown"}`;

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
