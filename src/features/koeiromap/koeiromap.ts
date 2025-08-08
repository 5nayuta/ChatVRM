import { TalkStyle } from "../messages/messages";

export async function koeiromapV0(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  const param = {
    method: "POST",
    body: JSON.stringify({
      text: message,
      speaker_x: speakerX,
      speaker_y: speakerY,
      style: style,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  };

  const koeiroRes = await fetch(
    "https://api.rinna.co.jp/models/cttse/koeiro",
    param
  );

  const data = (await koeiroRes.json()) as any;

  return { audio: data.audio };
}

export async function koeiromapFreeV1(
  message: string,
  speakerX: number,
  speakerY: number,
  style: "talk" | "happy" | "sad",
  apiKey: string
) {
  const body = {
    text: message.trim(),
    version: "2.0",
    speaker_x: speakerX,
    speaker_y: speakerY,
    style: style,
    style_predict: false,
    seed: 984298612,
    speed: 1,
    volume: 0,
    output_format: "mp3",
    output_bitrate: 128,
    facemotion: false,
    streaming: false,
  };

  // console.log("[koeiromapFreeV1] Request Body (for Koemotion):", JSON.stringify(body));

  const koeiroRes = await fetch(
    "https://api.rinna.co.jp/koemotion/infer",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    }
  );

  if (!koeiroRes.ok) {
    const errorText = await koeiroRes.text();
    console.error("[koeiromapFreeV1] Koemotion API Error Response:", koeiroRes.status, errorText);
    throw new Error(`Koemotion API error: ${koeiroRes.statusText}`);
  }

  const data = (await koeiroRes.json()) as any;
  // console.log("[koeiromapFreeV1] Koemotion API Response Data:", data);

  // レスポンス例から 'audio' プロパティが直接存在することを確認
  if (data.audio == null) {
    // console.error("[koeiromapFreeV1] 'audio' property not found in Koemotion API response:", data);
    throw new Error("'audio' property not found in Koemotion API response.");
  }

  return { audio: data.audio };
}
