import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAIStream, OpenAIStreamPayload } from "@/utils/OpenAIStream";
import { assertServerEnv } from "@/utils/env";

// Node runtime (not Edge) so this deploys cleanly on Render.
export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

const SYSTEM_PROMPT =
  "You are a tech hiring manager. You are to only provide feedback on the interview candidate's transcript. If it is not relevant and does not answer the question, make sure to say that. Do not be overly verbose and focus on the candidate's response.";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertServerEnv("OPENAI_API_KEY");
  } catch (err) {
    console.error("[generate]", err);
    return res
      .status(500)
      .json({ error: "Server is not configured for feedback generation." });
  }

  const prompt =
    typeof req.body === "string"
      ? (JSON.parse(req.body || "{}").prompt as string | undefined)
      : (req.body?.prompt as string | undefined);

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "No prompt in the request" });
  }

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 700,
    stream: true,
    n: 1,
  };

  try {
    const stream = await OpenAIStream(payload);

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Transfer-Encoding": "chunked",
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    // Abort writing if the client disconnects.
    let aborted = false;
    req.on("close", () => {
      aborted = true;
      reader.cancel().catch(() => {});
    });

    while (!aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (err) {
    console.error("[generate] stream error", err);
    // If headers already sent we can only end the stream; otherwise return JSON.
    if (res.headersSent) {
      res.end();
    } else {
      res
        .status(502)
        .json({ error: "The feedback service is unavailable right now." });
    }
  }
}
