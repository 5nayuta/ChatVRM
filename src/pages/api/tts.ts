import { koeiromapFreeV1 } from "@/features/koeiromap/koeiromap";

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  audio: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | { message: string }> // エラーメッセージも返せるように型を更新
) {
  const message = req.body.message;
  const speakerX = req.body.speakerX;
  const speakerY = req.body.speakerY;
  const style = req.body.style;
  const apiKey = req.body.apiKey;

  try {
    const voice = await koeiromapFreeV1(
      message,
      speakerX,
      speakerY,
      style,
      apiKey
    );
    res.status(200).json(voice);
  } catch (error: any) {
    console.error("[api/tts] Error calling koeiromapFreeV1:", error);
    // エラーが文字列またはメッセージプロパティを持つ場合
    const errorMessage = error.message || "Unknown error occurred during TTS synthesis.";
    res.status(500).json({ message: `TTS API Error: ${errorMessage}` });
  }
}
