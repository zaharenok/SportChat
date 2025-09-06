export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Статичный список упражнений для работы приложения
  const exercises = [
    {
      id: 1,
      name: "жим лежа",
      category: "Грудь",
      muscle_groups: "Грудные мышцы, трицепс",
      equipment: "Штанга, скамья",
      difficulty_level: "Средний"
    },
    {
      id: 2,
      name: "приседания",
      category: "Ноги",
      muscle_groups: "Квадрицепс, ягодицы",
      equipment: "Штанга",
      difficulty_level: "Средний"
    },
    {
      id: 3,
      name: "становая тяга",
      category: "Спина",
      muscle_groups: "Спина, ягодицы, бицепс бедра",
      equipment: "Штанга",
      difficulty_level: "Сложный"
    },
    {
      id: 4,
      name: "жим стоя",
      category: "Плечи",
      muscle_groups: "Дельтовидные мышцы",
      equipment: "Штанга, гантели",
      difficulty_level: "Средний"
    },
    {
      id: 5,
      name: "подтягивания",
      category: "Спина",
      muscle_groups: "Широчайшие мышцы спины, бицепс",
      equipment: "Турник",
      difficulty_level: "Средний"
    },
    {
      id: 6,
      name: "отжимания",
      category: "Грудь",
      muscle_groups: "Грудные мышцы, трицепс",
      equipment: "Собственный вес",
      difficulty_level: "Легкий"
    },
    {
      id: 7,
      name: "планка",
      category: "Пресс",
      muscle_groups: "Кор, пресс",
      equipment: "Собственный вес",
      difficulty_level: "Легкий"
    },
    {
      id: 8,
      name: "тяга штанги",
      category: "Спина",
      muscle_groups: "Широчайшие мышцы спины",
      equipment: "Штанга",
      difficulty_level: "Средний"
    }
  ];

  const { method, url } = req;
  const path = url.replace('/api/exercises', '');

  if (method === 'GET') {
    if (path === '/' || path === '') {
      // Возвращаем все упражнения или фильтруем по параметрам
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const search = urlParams.get('search');
      const category = urlParams.get('category');
      const limit = parseInt(urlParams.get('limit') || '20');
      let filteredExercises = exercises;

      if (search) {
        filteredExercises = exercises.filter(ex => 
          ex.name.toLowerCase().includes(search.toLowerCase()) ||
          ex.category.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (category) {
        filteredExercises = filteredExercises.filter(ex => 
          ex.category.toLowerCase() === category.toLowerCase()
        );
      }

      return res.json(filteredExercises.slice(0, parseInt(limit)));
    }

    if (path.startsWith('/search/')) {
      // Поиск упражнений
      const query = path.split('/')[2];
      const filteredExercises = exercises.filter(ex => 
        ex.name.toLowerCase().includes(query.toLowerCase())
      );
      return res.json(filteredExercises);
    }

    if (path === '/categories/') {
      // Возвращаем уникальные категории
      const categories = [...new Set(exercises.map(ex => ex.category))];
      return res.json(categories);
    }

    if (path === '/equipment/') {
      // Возвращаем уникальные виды оборудования
      const equipment = [...new Set(exercises.map(ex => ex.equipment))];
      return res.json(equipment);
    }
  }

  res.status(404).json({ error: 'Not found' });
}