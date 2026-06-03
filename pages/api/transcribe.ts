import { Configuration, OpenAIApi } from "openai";
import { IncomingForm, File as FormidableFile } from "formidable";
import { assertServerEnv } from "@/utils/env";
import fs from "fs";
import os from "os";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Whisper accepts files up to 25 MB. Recordings are capped at 2.5 min of mono
// 16 kHz mp3 (well under this), so anything larger is rejected early.
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = ["audio/mp3", "audio/mpeg", "audio/mpga", "audio/wav"];

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertServerEnv("OPENAI_API_KEY");
  } catch (err) {
    console.error("[transcribe]", err);
    return res
      .status(500)
      .json({ error: "Server is not configured for transcription." });
  }

  const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.OPENAI_API_KEY })
  );

  let uploadedPath: string | undefined;

  try {
    const { files } = await new Promise<{ fields: any; files: any }>(
      (resolve, reject) => {
        const form = new IncomingForm({
          multiples: false,
          uploadDir: os.tmpdir(),
          keepExtensions: true,
          maxFileSize: MAX_BYTES,
        });
        form.parse(req, (err, fields, files) =>
          err ? reject(err) : resolve({ fields, files })
        );
      }
    );

    // formidable v2 may return a single file or an array; normalize to one.
    const raw = files.file;
    const file: FormidableFile | undefined = Array.isArray(raw) ? raw[0] : raw;
    uploadedPath = file?.filepath;

    if (!file || !uploadedPath) {
      return res.status(400).json({ error: "No audio file was uploaded." });
    }

    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return res
        .status(413)
        .json({ error: "Recording is too large. Please keep it under 2.5 minutes." });
    }

    if (file.mimetype && !ALLOWED_MIME.includes(file.mimetype)) {
      return res
        .status(415)
        .json({ error: "Unsupported audio format." });
    }

    const resp = await openai.createTranscription(
      fs.createReadStream(uploadedPath) as any,
      "whisper-1"
    );

    const transcript = resp?.data?.text ?? "";

    if (transcript.trim().length > 0) {
      const moderation = await openai.createModeration({ input: transcript });
      if (moderation?.data?.results?.[0]?.flagged) {
        return res
          .status(422)
          .json({ error: "Inappropriate content detected. Please try again." });
      }
    }

    return res.status(200).json({ transcript });
  } catch (error: any) {
    // formidable throws when the upload exceeds maxFileSize.
    if (error?.code === "LIMIT_FILE_SIZE" || /maxFileSize/i.test(error?.message || "")) {
      return res
        .status(413)
        .json({ error: "Recording is too large. Please keep it under 2.5 minutes." });
    }
    console.error("[transcribe] server error", error);
    return res
      .status(500)
      .json({ error: "We couldn't transcribe your recording. Please try again." });
  } finally {
    // Always remove the temp file so a long-lived instance doesn't accumulate them.
    if (uploadedPath) {
      fs.promises.unlink(uploadedPath).catch(() => {});
    }
  }
}
