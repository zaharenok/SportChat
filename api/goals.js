import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymxfraufvxprmxfwyvpa.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE;
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
  const path = url.replace('/api/goals', '');

  try {
    if (method === 'GET' && (path === '/' || path === '')) {
      // Получаем список целей
      const { user_id = 1 } = req.query;

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data || []);
    }

    if (method === 'POST' && (path === '/' || path === '')) {
      // Создаем новую цель
      const { user_id = 1, title, description, target_value, current_value = 0, unit, target_date } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id,
          title,
          description,
          target_value,
          current_value,
          unit,
          target_date,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data);
    }

    if (method === 'PUT' && path.match(/^\/\d+$/)) {
      // Обновляем цель
      const goalId = path.substring(1);
      const updates = req.body;

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data);
    }

    if (method === 'DELETE' && path.match(/^\/\d+$/)) {
      // Удаляем цель
      const goalId = path.substring(1);

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ message: 'Goal deleted' });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}