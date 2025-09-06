import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymxfraufvxprmxfwyvpa.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE;
const n8nWebhook = process.env.REACT_APP_N8N_WEBHOOK;

console.log('API Config:', { 
  supabaseUrl, 
  hasSupabaseKey: !!supabaseKey, 
  hasN8nWebhook: !!n8nWebhook 
});

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  const path = url.replace('/api/chat', '');

  console.log('Chat API Request:', { method, url, path });

  try {
    if (method === 'POST' && path === '/message') {
      // Отправляем сообщение в чат и через n8n webhook
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const message = urlParams.get('message');
      const user_id = parseInt(urlParams.get('user_id') || '1');

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Сохраняем пользовательское сообщение
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          user_id,
          message,
          is_user: true,
          timestamp: new Date().toISOString()
        });

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
      }

      // Отправляем в n8n webhook
      let aiResponse = 'Понял! Записал вашу тренировку 💪';
      
      if (n8nWebhook) {
        try {
          const webhookResponse = await fetch(n8nWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, user_id })
          });

          if (webhookResponse.ok) {
            const webhookData = await webhookResponse.json();
            aiResponse = webhookData.message || aiResponse;
          }
        } catch (webhookError) {
          console.error('N8N webhook error:', webhookError);
        }
      }

      // Сохраняем ответ AI
      const { error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          user_id,
          message: aiResponse,
          is_user: false,
          timestamp: new Date().toISOString()
        });

      if (aiMsgError) {
        console.error('Error saving AI message:', aiMsgError);
      }

      return res.json({
        message: aiResponse,
        workout_logged: message.toLowerCase().includes('жим') || message.toLowerCase().includes('приседа') || message.toLowerCase().includes('кг'),
        suggestions: ['Отлично! 💪', 'Продолжай в том же духе!', 'Как самочувствие?']
      });
    }

    if (method === 'GET' && path.startsWith('/history/')) {
      // Получаем историю чата
      const userId = path.split('/')[2];
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const limit = parseInt(urlParams.get('limit') || '50');

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data || []);
    }

    if (method === 'DELETE' && path.startsWith('/history/')) {
      // Очищаем историю чата
      const userId = path.split('/')[2];

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ message: 'Chat history cleared' });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}