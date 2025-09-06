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
  const path = url.replace('/api/workouts', '');

  try {
    if (method === 'GET' && (path === '/' || path === '')) {
      // Получаем список тренировок
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const user_id = parseInt(urlParams.get('user_id') || '1');
      const limit = parseInt(urlParams.get('limit') || '20');
      const offset = parseInt(urlParams.get('offset') || '0');

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user_id)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data || []);
    }

    if (method === 'GET' && path.match(/^\/\d+$/)) {
      // Получаем конкретную тренировку
      const workoutId = path.substring(1);

      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (workoutError) {
        return res.status(500).json({ error: workoutError.message });
      }

      // Получаем упражнения для тренировки
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId);

      return res.json({
        workout,
        exercises: exercises || [],
        total_volume: exercises?.reduce((sum, ex) => sum + (ex.volume || 0), 0) || 0
      });
    }

    if (method === 'GET' && path.startsWith('/stats/')) {
      // Получаем статистику тренировок
      const userId = path.split('/')[2];
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const days = parseInt(urlParams.get('days') || '30');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const stats = {
        total_workouts: data?.length || 0,
        total_days: parseInt(days),
        workout_frequency: ((data?.length || 0) / parseInt(days) * 7).toFixed(1),
        recent_workouts: data?.slice(0, 5) || []
      };

      return res.json(stats);
    }

    if (method === 'GET' && path.startsWith('/calendar/')) {
      // Получаем данные календаря
      const userId = path.split('/')[2];
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const year = urlParams.get('year');
      const month = urlParams.get('month');

      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || currentDate.getMonth() + 1;

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            exercise_name,
            sets,
            reps,
            weight,
            volume
          )
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const workouts = (data || []).map(workout => ({
        date: workout.date,
        exercises: workout.workout_exercises?.map(ex => ex.exercise_name) || [],
        emoji: '💪',
        intensity: Math.min(5, Math.max(1, Math.floor((workout.workout_exercises?.length || 1) / 2) + 1)),
        duration: workout.duration_minutes || 60,
        notes: workout.notes || '',
        total_volume: workout.workout_exercises?.reduce((sum, ex) => sum + (ex.volume || 0), 0) || 0
      }));

      return res.json({
        year: parseInt(targetYear),
        month: parseInt(targetMonth),
        workouts
      });
    }

    if (method === 'PUT' && path.match(/^\/calendar\/\d+\/date\/.+$/)) {
      // Обновляем день календаря
      const pathParts = path.split('/');
      const userId = pathParts[2];
      const dateStr = pathParts[4];

      const workoutData = req.body;

      if (!workoutData || Object.keys(workoutData).length === 0) {
        // Удаляем тренировку
        const { error } = await supabase
          .from('workouts')
          .delete()
          .eq('user_id', userId)
          .eq('date', dateStr);

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.json({ message: 'Workout deleted', date: dateStr });
      } else {
        // Создаем или обновляем тренировку
        const { data: existingWorkout } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', userId)
          .eq('date', dateStr)
          .single();

        let workoutId;

        if (existingWorkout) {
          // Обновляем существующую тренировку
          const { data, error } = await supabase
            .from('workouts')
            .update({
              notes: workoutData.notes,
              duration_minutes: workoutData.duration
            })
            .eq('id', existingWorkout.id)
            .select()
            .single();

          if (error) {
            return res.status(500).json({ error: error.message });
          }

          workoutId = data.id;
        } else {
          // Создаем новую тренировку
          const { data, error } = await supabase
            .from('workouts')
            .insert({
              user_id: userId,
              date: dateStr,
              notes: workoutData.notes || '',
              duration_minutes: workoutData.duration || 60
            })
            .select()
            .single();

          if (error) {
            return res.status(500).json({ error: error.message });
          }

          workoutId = data.id;
        }

        return res.json({ 
          message: 'Workout updated', 
          workout_id: workoutId, 
          date: dateStr 
        });
      }
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}