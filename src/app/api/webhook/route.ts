import { NextRequest, NextResponse } from 'next/server'

interface WebhookResponse {
  output: {
    message: string;
    workout_logged: boolean;
    parsed_exercises: Array<{
      name: string;
      weight: number;
      sets: number;
      reps: number;
    }>;
    suggestions: string[];
    next_workout_recommendation: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, user_email, user_name } = await request.json()
    
    if (!message || !user_email || !user_name) {
      return NextResponse.json({ 
        error: 'message, user_email, and user_name are required' 
      }, { status: 400 })
    }

    const webhookUrl = process.env.WEBHOOK_URL
    if (!webhookUrl) {
      console.error('WEBHOOK_URL environment variable is not set')
      return NextResponse.json({ 
        error: 'Webhook URL not configured' 
      }, { status: 500 })
    }

    console.log("Sending message to webhook:", message);
    console.log("Webhook URL:", webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        message,
        user_email,
        user_name,
      }),
    });

    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WebhookResponse[] = await response.json();
    console.log("Full webhook response:", JSON.stringify(data, null, 2));
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error calling webhook:', error)
    
    // Возвращаем fallback ответ если веб-хук недоступен
    const fallbackResponse: WebhookResponse[] = [{
      output: {
        message: "Извини, сервер временно недоступен. Попробуй позже! 🤖",
        workout_logged: false,
        parsed_exercises: [],
        suggestions: ["Попробуй переформулировать вопрос", "Проверь подключение к интернету"],
        next_workout_recommendation: ""
      }
    }];
    
    return NextResponse.json(fallbackResponse)
  }
}