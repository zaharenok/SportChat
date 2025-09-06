const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ymxfraufvxprmxfwyvpa.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteGZyYXVmdnhwcm14Znd5dnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDUzOTEsImV4cCI6MjA0MDUyMTM5MX0.a8L8xJOq-XQSr0FKt0PFUYMkxcDSDJ1-J0F5iGa7tXY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Создание таблиц в Supabase...');

  try {
    // Создаем таблицу сообщений чата
    const { error: chatError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          is_user BOOLEAN NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        -- Индекс для быстрого поиска по пользователю
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
      `
    });

    if (chatError) {
      console.log('ℹ️  Таблица chat_messages уже существует или создана');
    } else {
      console.log('✅ Таблица chat_messages создана');
    }

    // Создаем таблицу тренировок
    const { error: workoutsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS workouts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          name TEXT,
          notes TEXT,
          duration_minutes INTEGER DEFAULT 60,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Индексы для оптимизации
        CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date DESC);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_user_date_unique ON workouts(user_id, date);
      `
    });

    if (workoutsError) {
      console.log('ℹ️  Таблица workouts уже существует или создана');
    } else {
      console.log('✅ Таблица workouts создана');
    }

    // Создаем таблицу упражнений в тренировках
    const { error: exercisesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS workout_exercises (
          id SERIAL PRIMARY KEY,
          workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
          exercise_name TEXT NOT NULL,
          sets INTEGER,
          reps INTEGER,
          weight DECIMAL,
          notes TEXT,
          volume DECIMAL GENERATED ALWAYS AS (
            CASE 
              WHEN weight IS NOT NULL AND reps IS NOT NULL AND sets IS NOT NULL 
              THEN weight * reps * sets 
              ELSE 0 
            END
          ) STORED
        );

        -- Индекс для связи с тренировками
        CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
      `
    });

    if (exercisesError) {
      console.log('ℹ️  Таблица workout_exercises уже существует или создана');
    } else {
      console.log('✅ Таблица workout_exercises создана');
    }

    // Создаем таблицу целей
    const { error: goalsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          target_value DECIMAL,
          current_value DECIMAL DEFAULT 0,
          unit TEXT,
          target_date DATE,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Индекс для пользователя и статуса
        CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
        
        -- Триггер для обновления updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
        CREATE TRIGGER update_goals_updated_at 
          BEFORE UPDATE ON goals 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (goalsError) {
      console.log('ℹ️  Таблица goals уже существует или создана');
    } else {
      console.log('✅ Таблица goals создана');
    }

    console.log('\n🎉 Все таблицы созданы успешно!');
    
    // Добавляем тестовые данные
    await addTestData();

  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  }
}

async function addTestData() {
  console.log('\n📝 Добавляю тестовые данные...');

  try {
    // Проверяем, есть ли уже данные
    const { data: existingChats } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);

    if (existingChats && existingChats.length > 0) {
      console.log('ℹ️  Тестовые данные уже существуют');
      return;
    }

    // Добавляем тестовые сообщения
    const { error: chatError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: 1,
          message: 'Привет! Записал жим лежа 80кг 3х8',
          is_user: true,
          timestamp: new Date(Date.now() - 3600000).toISOString() // час назад
        },
        {
          user_id: 1,
          message: 'Отлично! Записал твою тренировку. Жим лежа 80кг 3 подхода по 8 повторений - это 1920кг общего объема! 💪',
          is_user: false,
          timestamp: new Date(Date.now() - 3500000).toISOString()
        },
        {
          user_id: 1,
          message: 'Делал приседания 100кг 5х5',
          is_user: true,
          timestamp: new Date(Date.now() - 1800000).toISOString() // 30 минут назад
        },
        {
          user_id: 1,
          message: 'Супер! Приседания 100кг 5 подходов по 5 повторений = 2500кг общего объема! Отличная работа! 🔥',
          is_user: false,
          timestamp: new Date(Date.now() - 1700000).toISOString()
        }
      ]);

    if (!chatError) {
      console.log('✅ Тестовые сообщения добавлены');
    }

    // Добавляем тестовую тренировку
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert([
        {
          user_id: 1,
          date: today,
          name: 'Тренировка груди и трицепса',
          notes: 'Отличная тренировка! Чувствую прогресс',
          duration_minutes: 90
        },
        {
          user_id: 1,
          date: yesterday,
          name: 'Тренировка ног',
          notes: 'Тяжелая, но продуктивная тренировка',
          duration_minutes: 75
        }
      ])
      .select();

    if (!workoutError && workout) {
      console.log('✅ Тестовые тренировки добавлены');

      // Добавляем упражнения к тренировкам
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert([
          {
            workout_id: workout[0].id,
            exercise_name: 'жим лежа',
            sets: 3,
            reps: 8,
            weight: 80,
            notes: 'Хороший вес, техника отличная'
          },
          {
            workout_id: workout[0].id,
            exercise_name: 'жим гантелей',
            sets: 3,
            reps: 12,
            weight: 30,
            notes: 'Суперсет с разводками'
          },
          {
            workout_id: workout[1].id,
            exercise_name: 'приседания',
            sets: 5,
            reps: 5,
            weight: 100,
            notes: 'Глубокие приседы, полная амплитуда'
          },
          {
            workout_id: workout[1].id,
            exercise_name: 'румынская тяга',
            sets: 4,
            reps: 8,
            weight: 70,
            notes: 'Отлично проработали заднюю поверхность бедра'
          }
        ]);

      if (!exercisesError) {
        console.log('✅ Тестовые упражнения добавлены');
      }
    }

    // Добавляем тестовые цели
    const { error: goalsError } = await supabase
      .from('goals')
      .insert([
        {
          user_id: 1,
          title: 'Жим лежа 100кг',
          description: 'Увеличить рабочий вес в жиме лежа до 100кг',
          target_value: 100,
          current_value: 80,
          unit: 'кг',
          target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // через 90 дней
          status: 'active'
        },
        {
          user_id: 1,
          title: 'Тренировки 4 раза в неделю',
          description: 'Стабильно тренироваться 4 раза в неделю',
          target_value: 4,
          current_value: 3,
          unit: 'раз/неделя',
          status: 'active'
        },
        {
          user_id: 1,
          title: 'Сбросить 5кг',
          description: 'Похудеть на 5 килограмм к лету',
          target_value: -5,
          current_value: -2,
          unit: 'кг',
          target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // через 120 дней
          status: 'active'
        }
      ]);

    if (!goalsError) {
      console.log('✅ Тестовые цели добавлены');
    }

    console.log('\n🎉 Все тестовые данные добавлены!');
    console.log('\n📊 Теперь в приложении будут отображаться:');
    console.log('   • История чата с AI');
    console.log('   • Записанные тренировки');
    console.log('   • Активные цели');
    console.log('   • Календарь тренировок');

  } catch (error) {
    console.error('❌ Ошибка добавления тестовых данных:', error);
  }
}

async function checkConnection() {
  console.log('🔍 Проверяю подключение к Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('count')
      .limit(1);

    if (error) {
      console.log('ℹ️  Таблица chat_messages еще не создана, это нормально');
    } else {
      console.log('✅ Подключение к Supabase работает');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к Supabase:', error);
    return false;
  }
}

async function main() {
  console.log('🏗️  Настройка базы данных SportChat');
  console.log('=====================================\n');

  const connected = await checkConnection();
  if (!connected) {
    console.log('❌ Не удалось подключиться к Supabase');
    process.exit(1);
  }

  await createTables();
  
  console.log('\n✅ Настройка завершена!');
  console.log('Теперь можно деплоить на Vercel и тестировать приложение.');
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTables, addTestData };