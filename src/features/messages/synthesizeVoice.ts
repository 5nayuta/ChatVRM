import { reduceTalkStyle } from "@/utils/reduceTalkStyle";
import { koeiromapV0 } from "../koeiromap/koeiromap";
import { TalkStyle } from "../messages/messages";

export async function synthesizeVoice(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  const koeiroRes = await koeiromapV0(message, speakerX, speakerY, style);
  return { audio: koeiroRes.audio };
}

export const synthesizeVoiceApi = async (
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle,
  apiKey: string
): Promise<{ audio: string }> => {
  console.log("[synthesizeVoiceApi] Calling TTS API...");
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        speakerX,
        speakerY,
        style,
        apiKey,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[synthesizeVoiceApi] TTS API Error Response:", res.status, errorText);
      throw new Error(`TTS API error: ${res.statusText}`);
    }

    const data = await res.json();
    // console.log("[synthesizeVoiceApi] TTS API Response Data:", data); // `data` オブジェクト全体を表示
    return data;
  } catch (error) {
    console.error("[synthesizeVoiceApi] Error during TTS API call:", error);
    throw error; // エラーを再スローして、呼び出し元でキャッチさせる
  }
};
