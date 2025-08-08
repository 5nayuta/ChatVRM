import { GoogleGenerativeAI, GenerativeModel, GenerateContentResponse } from "@google/generative-ai";
import { Message } from "../messages/messages";

// OpenAIのMessage型をGeminiのContent型に変換するヘルパー関数
const convertMessagesToGeminiContent = (messages: Message[]) => {
  return messages.map((message) => {
    let role: "user" | "model" = "user"; // デフォルトをuserに
    if (message.role === "assistant") {
      role = "model";
    }
    // systemロールのメッセージもuserロールとして送信
    return {
      role: role,
      parts: [{ text: message.content }],
    };
  });
};

export async function getGeminiChatResponseStream(
  messages: Message[],
  apiKey: string,
  retryCount: number = 0,
  maxRetries: number = 5
): Promise<ReadableStream<string> | null> {
  if (!apiKey) {
    throw new Error("Invalid API Key for Gemini");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const history = convertMessagesToGeminiContent(messages.slice(0, -1)); // 最後のメッセージ以外を履歴として渡す
    const latestMessage = messages[messages.length - 1]; // 最後のメッセージを現在のメッセージとして渡す

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(latestMessage.content);
    const stream = result.stream;

    return new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            controller.enqueue(chunkText);
          }
        }
        controller.close();
      },
    });

  } catch (error: any) {
    if (error.response && error.response.status === 429 && retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
      console.warn(`Too Many Requests. Retrying in ${delay / 1000} seconds... (Retry ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getGeminiChatResponseStream(messages, apiKey, retryCount + 1, maxRetries);
    } else {
      console.error("Gemini API Error:", error);
      throw new Error("Something went wrong with Gemini API");
    }
  }
} 