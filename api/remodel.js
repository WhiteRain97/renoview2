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
    Build a mental model of (1) the current state of their ${room} and (2) the desired post-remodel state of their ${room}, by asking thoughtful follow-ups until you’re satisfied. Don't ask about anything outside of these two states, such as budget/timeline.

    Estimate strictly for the scope the homeowner explicitly describes; do not assume additional work beyond what they state.

    When you have enough information, using those models plus the ZIP code and home value, first output the line 'Here is your scorecard', then output your scorecard in the following format, using *plain text* (no markdown or lists):

    Expected financial ROI: X%
    (explanation/assumptions)
    
    Estimated total cost: $X-$Y
    (explanation/assumptions)
    
    Estimated timeline: X-Y days/weeks/months
    (explanation/assumptions)
        
    Expected longevity: (0-10)
    (explanation/assumptions)
    
    Only use this format for your final scorecard.
    
    Financial ROI = home value increase ÷ total remodel cost. Longevity = Durability/antifragility/antiscratching/robustness.
    
    Ask one focused question at a time when you need more detail; if you have enough, stop asking and output a concise scorecard with brief assumptions.
    Be concise and practical.`;

    const preface = `Context\nProject type: ${context.projectType ?? "unknown"}\nZIP: ${context.zip ?? "unknown"}\nHome value: ${context.homeValue ?? "unknown"}`;

    const input = [
      { role: "system", content: system },
      { role: "user", content: preface },
      ...messages,
    ];

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      //temperature: 0.5,
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
