import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request: Request) {
  try {
    const { text, imageUrl } = await request.json();

    if (!text && !imageUrl) {
      return NextResponse.json({ error: "请提供文本或图片" }, { status: 400 });
    }

    // 构建消息内容
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "你是一个专业的待办事项提取助手。你的任务是从文本或图片中提取待办事项，保持原文和源语言，不要添加任何额外内容。",
      },
    ];

    // 如果有图片，添加图片URL
    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "请从这张图片中提取待办事项，保持原文和源语言：",
          },
          {
            type: "image_url",
            image_url: imageUrl,
          },
        ] as any,
      });
    }

    // 如果有文本，添加文本内容
    if (text) {
      messages.push({
        role: "user",
        content: text,
      });
    }

    // 调用通义千问API
    const response = await openai.chat.completions.create({
      model: "qwen2.5-vl-72b-instruct",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
    });

    const tasks = response.choices[0].message.content
      ?.split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: "未能识别出待办事项" },
        { status: 400 }
      );
    }

    // 获取当前用户
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "用户未登录" }, { status: 401 });
    }

    // 批量插入待办事项
    const { error } = await supabase.from("todos").insert(
      tasks.map((task) => ({
        user_id: user.id,
        text: task,
        completed: false,
        image_url: imageUrl || null,
      }))
    );

    if (error) {
      console.error("插入待办事项失败:", error);
      return NextResponse.json({ error: "保存待办事项失败" }, { status: 500 });
    }

    return NextResponse.json({
      tasksCount: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("解析待办事项时出错:", error);
    return NextResponse.json({ error: "解析待办事项失败" }, { status: 500 });
  }
}
