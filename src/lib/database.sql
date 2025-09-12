-- SportChat Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Days table - каждый день тренировок
CREATE TABLE days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts table - тренировки привязанные к дням
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL, -- в минутах
  exercises TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table - история чата по дням
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table - цели пользователя
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  current INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL,
  progress INTEGER GENERATED ALWAYS AS (CASE WHEN target > 0 THEN (current * 100 / target) ELSE 0 END) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table - достижения
CREATE TABLE achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🏆',
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_days_date ON days(date);
CREATE INDEX idx_workouts_day_id ON workouts(day_id);
CREATE INDEX idx_chat_messages_day_id ON chat_messages(day_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_achievements_date ON achievements(date);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_days_updated_at BEFORE UPDATE ON days FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) политики
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Политики для публичного доступа (можно настроить аутентификацию позже)
CREATE POLICY "Enable read access for all users" ON days FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON days FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON days FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON days FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON workouts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON workouts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON workouts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON chat_messages FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON chat_messages FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON goals FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON goals FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON goals FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON achievements FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON achievements FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON achievements FOR DELETE USING (true);

-- Вставляем начальные данные
INSERT INTO goals (title, current, target, unit) VALUES
('Тренировки в неделю', 4, 5, 'раз'),
('Продолжительность тренировки', 52, 60, 'мин'),
('Калории за тренировку', 380, 450, 'ккал');

INSERT INTO achievements (title, description, icon, date) VALUES
('Первая неделя', 'Выполнил 5 тренировок за неделю', '🏆', '2024-01-10'),
('Постоянство', '10 дней подряд без пропусков', '🔥', '2024-01-08'),
('Силач', 'Увеличил рабочий вес на 20%', '💪', '2024-01-05');