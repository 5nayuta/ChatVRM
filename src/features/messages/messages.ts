import { VRMExpression, VRMExpressionPresetName } from "@pixiv/three-vrm";
import { KoeiroParam } from "../constants/koeiroParam";

// ChatGPT API
export type Message = {
  role: "assistant" | "system" | "user";
  content: string;
};

const talkStyles = [
  "talk",
  "happy",
  "sad",
  "angry",
  "fear",
  "surprised",
] as const;
export type TalkStyle = (typeof talkStyles)[number];

export type Talk = {
  style: TalkStyle;
  speakerX: number;
  speakerY: number;
  message: string;
};

const emotions = ["neutral", "happy", "angry", "sad", "relaxed"] as const;
type EmotionType = (typeof emotions)[number] & VRMExpressionPresetName;

/**
 * 発話文と音声の感情と、モデルの感情表現がセットになった物
 */
export type Screenplay = {
  expression: EmotionType;
  talk: Talk;
};

export const splitSentence = (text: string): string[] => {
  const sentences = text.split(/(?<=[。．！？\n])/g).filter((msg) => msg !== "");
  const result: string[] = [];
  const MAX_LENGTH = 60; // 60文字の制限

  sentences.forEach((sentence) => {
    let currentSentence = sentence;
    while (currentSentence.length > MAX_LENGTH) {
      // 60文字以内で、できるだけ自然な区切りを探す
      // (スペース、句読点、または文字の区切り)
      let sliceIndex = MAX_LENGTH;
      // 日本語の場合は単語の区切りが難しいので、一旦単純に文字数で区切る
      // 必要に応じて、より複雑なロジックを検討
      result.push(currentSentence.substring(0, sliceIndex));
      currentSentence = currentSentence.substring(sliceIndex);
    }
    result.push(currentSentence);
  });
  return result;
};

export const textsToScreenplay = (
  texts: string[],
  koeiroParam: KoeiroParam
): Screenplay[] => {
  const screenplays: Screenplay[] = [];
  let prevExpression = "neutral";
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    const match = text.match(/\[(.*?)\]/);

    const tag = (match && match[1]) || prevExpression;

    const message = text.replace(/\[(.*?)\]/g, "");

    let expression = prevExpression;
    if (emotions.includes(tag as any)) {
      expression = tag;
      prevExpression = tag;
    }

    screenplays.push({
      expression: expression as EmotionType,
      talk: {
        style: emotionToTalkStyle(expression as EmotionType),
        speakerX: koeiroParam.speakerX,
        speakerY: koeiroParam.speakerY,
        message: message,
      },
    });
  }

  return screenplays;
};

const emotionToTalkStyle = (emotion: EmotionType): TalkStyle => {
  // koeiromapFreeV1は「talk」スタイルのみを無料でサポートしているため、
  // その他の感情は「talk」にフォールバックさせる
  return "talk";
};
