"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Переводы
const translations = {
  ru: {
    // Навигация
    'nav.chat': 'Чат',
    'nav.dashboard': 'Дашборд',
    'nav.workouts': 'Последние тренировки',
    'nav.achievements': 'Достижения',
    'nav.equipment': 'Тренажёры',
    'nav.muscles': 'Мышечные группы',
    'nav.profile': 'Профиль',
    
    // Чат
    'chat.placeholder': 'Расскажи о тренировке...',
    'chat.send': 'Отправить',
    'chat.recording': 'Распознаю речь...',
    'chat.photoReady': 'Фото готово к отправке',
    'chat.takePhoto': 'Сделать фото',
    'chat.selectPhoto': 'Выбрать фото',
    'chat.photoSent': 'Фото отправлено',
    'chat.cancel': 'Отмена',
    'chat.removePhoto': 'Удалить фото',
    'chat.voiceMessage': 'Голосовое сообщение',
    'chat.audioProcessingError': 'Извините, не удалось обработать голосовое сообщение. Попробуйте еще раз.',
    
    // Дашборд
    'dashboard.title': 'Дашборд',
    'dashboard.overview': 'Обзор прогресса и статистики',
    'dashboard.goals': 'Цели',
    'dashboard.achievements': 'Достижения',
    'dashboard.hideAchievements': 'Скрыть достижения',
    'dashboard.showAchievements': 'Показать достижения',
    'dashboard.achievementsHidden': 'Достижения скрыты',
    'dashboard.weeklyActivity': 'Недельная активность',
    'dashboard.monthlyProgress': 'Месячный прогресс',
    'dashboard.addGoal': 'Добавить цель',
    'dashboard.editGoal': 'Редактировать цель',
    'dashboard.trainingDays': 'Дней с тренировками',
    'dashboard.uniqueExercises': 'Уникальных упражнений',
    'dashboard.weeklyTraining': 'Дней тренировок за неделю',
    'dashboard.goalsProgress': 'Прогресс целей %',
    'dashboard.activity': 'Активность',
    'dashboard.week': 'Неделя',
    'dashboard.month': 'Месяц',
    'dashboard.noActiveGoals': 'Нет активных целей',
    'dashboard.clickAddGoal': 'Нажмите "Добавить", чтобы создать первую цель',
    'dashboard.completed': 'Завершено!',
    'dashboard.hide': 'Скрыть',
    'dashboard.show': 'Показать',
    'dashboard.newGoal': 'Новая цель',
    'dashboard.goalName': 'Название',
    'dashboard.goalNamePlaceholder': 'Например: Подтянуться 50 раз',
    'dashboard.description': 'Описание',
    'dashboard.descriptionPlaceholder': 'Описание цели...',
    'dashboard.target': 'Цель',
    'dashboard.currentProgress': 'Текущий прогресс',
    'dashboard.unit': 'Единица измерения',
    'dashboard.unitPlaceholder': 'раз, кг, км...',
    'dashboard.category': 'Категория',
    'dashboard.categoryFitness': 'Фитнес',
    'dashboard.categoryStrength': 'Сила',
    'dashboard.categoryCardio': 'Кардио',
    'dashboard.categoryFlexibility': 'Гибкость',
    'dashboard.categoryWeight': 'Вес',
    'dashboard.categoryOther': 'Другое',
    'dashboard.dueDate': 'Срок выполнения',
    'dashboard.create': 'Создать',
    'dashboard.weeklyChange': 'за неделю',
    'dashboard.tooltip.edit': 'Редактировать',
    'dashboard.tooltip.delete': 'Удалить',
    'dashboard.weekdays.0': 'ВС',
    'dashboard.weekdays.1': 'ПН', 
    'dashboard.weekdays.2': 'ВТ',
    'dashboard.weekdays.3': 'СР',
    'dashboard.weekdays.4': 'ЧТ',
    'dashboard.weekdays.5': 'ПТ',
    'dashboard.weekdays.6': 'СБ',
    'dashboard.months.0': 'Янв',
    'dashboard.months.1': 'Фев',
    'dashboard.months.2': 'Мар',
    'dashboard.months.3': 'Апр',
    'dashboard.months.4': 'Май',
    'dashboard.months.5': 'Июн',
    'dashboard.months.6': 'Июл',
    'dashboard.months.7': 'Авг',
    'dashboard.months.8': 'Сен',
    'dashboard.months.9': 'Окт',
    'dashboard.months.10': 'Ноя',
    'dashboard.months.11': 'Дек',
    
    // Тренажёры
    'equipment.title': 'Тренажёры',
    'equipment.description': 'Отслеживание использования тренажёров и прогресса',
    'equipment.totalEquipment': 'Всего тренажёров',
    'equipment.totalUsage': 'Общие использования',
    'equipment.totalVolume': 'Общий объём',
    'equipment.all': 'Все',
    'equipment.strength': 'Силовые тренажёры',
    'equipment.cardio': 'Кардио тренажёры',
    'equipment.functional': 'Функциональные',
    'equipment.freeWeights': 'Свободные веса',
    'equipment.muscleGroups': 'Мышечные группы',
    'equipment.usage': 'Использований',
    'equipment.lastUsed': 'Последний раз',
    'equipment.maxWeight': 'Макс. вес',
    'equipment.volume': 'Общий объём',
    'equipment.noEquipment': 'Тренажёры пока не добавлены',
    'equipment.noEquipmentCategory': 'Нет тренажёров в выбранной категории',
    
    // Мышечные группы
    'muscles.title': 'Мышечные группы',
    'muscles.description': 'Анализ развития мышечных групп и прогресса тренировок',
    'muscles.totalGroups': 'Групп мышц',
    'muscles.totalWorkouts': 'Всего тренировок',
    'muscles.totalVolume': 'Общий объём',
    'muscles.progressGrowth': 'Рост прогресса',
    'muscles.allGroups': 'Все группы',
    'muscles.upper': 'Верх тела',
    'muscles.core': 'Кор',
    'muscles.lower': 'Низ тела',
    'muscles.visualization': 'Визуализация тренированности',
    'muscles.hoverHelp': 'Наведите курсор на мышечные группы для подсветки',
    'muscles.activeTraining': 'Активно тренируется',
    'muscles.moderate': 'Умеренно',
    'muscles.rarely': 'Редко',
    'muscles.workouts': 'Тренировок',
    'muscles.lastWorked': 'Последний раз',
    'muscles.maxWeight': 'Макс. вес',
    'muscles.activity': 'Активность',
    'muscles.noGroups': 'Мышечные группы пока не добавлены',
    'muscles.noGroupsCategory': 'Нет групп в выбранной категории',
    
    // Достижения
    'achievements.title': 'Достижения',
    'achievements.description': 'Ваши спортивные успехи и завершенные цели',
    'achievements.loading': 'Загрузка достижений...',
    'achievements.totalAchievements': 'Всего достижений',
    'achievements.visible': 'Видимых',
    'achievements.hiddenCount': 'достижений скрыто',
    'achievements.noAchievements': 'Пока нет достижений',
    'achievements.noAchievementsDesc': 'Завершите свои первые цели, чтобы получить достижения!',
    'achievements.showAchievement': 'Показать достижение',
    'achievements.hideAchievement': 'Скрыть достижение',
    
    // Профиль
    'profile.title': 'Профиль пользователя',
    'profile.registeredOn': 'Зарегистрирован',
    'profile.editProfile': 'Редактировать профиль',
    'profile.logout': 'Выйти',
    'profile.save': 'Сохранить',
    'profile.cancel': 'Отменить',
    'profile.username': 'Имя пользователя',
    'profile.email': 'Email адрес',
    'profile.enterName': 'Введите имя',
    'profile.enterEmail': 'Введите email',
    'profile.nameEmailRequired': 'Имя и email обязательны',
    'profile.updateError': 'Ошибка обновления профиля',
    'profile.profileUpdated': 'Профиль успешно обновлен!',
    'profile.confirmLogout': 'Вы уверены, что хотите выйти?',
    
    // Тренировки
    'workouts.title': 'Последние тренировки',
    'workouts.loading': 'Загрузка тренировок...',
    'workouts.exercises': 'упражнений',
    'workouts.deleteWorkout': 'Удалить тренировку',
    'workouts.editExercise': 'Редактировать',
    'workouts.exerciseName': 'Название упражнения',
    'workouts.weight': 'Вес (кг)',
    'workouts.sets': 'Подходы',
    'workouts.reps': 'Повторы',
    'workouts.weightLabel': 'Вес:',
    'workouts.setsLabel': 'Подходы:',
    'workouts.repsLabel': 'Повторы:',
    'workouts.noWorkouts': 'Пока нет записанных тренировок',
    'workouts.noWorkoutsDesc': 'Начните чатить с ИИ тренером, чтобы записать свою первую тренировку!',
    'workouts.confirmDelete': 'Удалить тренировку?',
    'workouts.deleteConfirmDesc': 'Это действие нельзя будет отменить',
    'workouts.delete': 'Удалить',
    'workouts.deleteExercise': 'Удалить упражнение?',
    'workouts.deleteExerciseDesc': 'Упражнение будет удалено из тренировки. Это действие нельзя отменить.',
    
    // Управление днями
    'dayManager.deleteConfirmTitle': 'Удалить день тренировки?',
    'dayManager.deleteConfirmMessage': 'Будут удалены все данные этого дня: сообщения чата, тренировки и достижения.',
    'dayManager.deleteConfirmWarning': 'Это действие нельзя отменить.',
    'dayManager.title': 'Управление днями',
    'dayManager.addDay': 'Добавить день',
    'dayManager.today': 'Сегодня',
    'dayManager.editDay': 'Редактировать день',
    'dayManager.deleteDay': 'Удалить день',
    'dayManager.collapse': 'Свернуть',
    'dayManager.expand': 'Развернуть',
    'dayManager.noDaysCreated': 'Нет созданных дней',
    'dayManager.noDaysDescription': 'Добавьте свой первый день тренировок',
    'dayManager.loadingDays': 'Загрузка дней...',

    // Общие
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.add': 'Добавить',
    'common.close': 'Закрыть',
    'common.kg': 'кг',
    'common.times': 'раз',
    
    // Категории мышц (русские названия)
    'muscle.chest': 'Грудные',
    'muscle.back': 'Спина',
    'muscle.shoulders': 'Плечи',
    'muscle.biceps': 'Бицепс',
    'muscle.triceps': 'Трицепс',
    'muscle.abs': 'Пресс',
    'muscle.quads': 'Квадрицепс',
    'muscle.hamstrings': 'Бицепс бедра',
    'muscle.glutes': 'Ягодицы',
    'muscle.calves': 'Икры'
  },
  en: {
    // Navigation
    'nav.chat': 'Chat',
    'nav.dashboard': 'Dashboard',
    'nav.workouts': 'Recent Workouts',
    'nav.achievements': 'Achievements',
    'nav.equipment': 'Equipment',
    'nav.muscles': 'Muscle Groups',
    'nav.profile': 'Profile',
    
    // Chat
    'chat.placeholder': 'Tell me about your workout...',
    'chat.send': 'Send',
    'chat.recording': 'Recognizing speech...',
    'chat.photoReady': 'Photo ready to send',
    'chat.takePhoto': 'Take Photo',
    'chat.selectPhoto': 'Select Photo',
    'chat.photoSent': 'Photo sent',
    'chat.cancel': 'Cancel',
    'chat.removePhoto': 'Remove photo',
    'chat.voiceMessage': 'Voice message',
    'chat.audioProcessingError': 'Sorry, could not process voice message. Please try again.',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Progress and statistics overview',
    'dashboard.goals': 'Goals',
    'dashboard.achievements': 'Achievements',
    'dashboard.hideAchievements': 'Hide achievements',
    'dashboard.showAchievements': 'Show achievements',
    'dashboard.achievementsHidden': 'Achievements hidden',
    'dashboard.weeklyActivity': 'Weekly Activity',
    'dashboard.monthlyProgress': 'Monthly Progress',
    'dashboard.addGoal': 'Add Goal',
    'dashboard.editGoal': 'Edit Goal',
    'dashboard.trainingDays': 'Training Days',
    'dashboard.uniqueExercises': 'Unique Exercises',
    'dashboard.weeklyTraining': 'Weekly Training Days',
    'dashboard.goalsProgress': 'Goals Progress %',
    'dashboard.activity': 'Activity',
    'dashboard.week': 'Week',
    'dashboard.month': 'Month',
    'dashboard.noActiveGoals': 'No active goals',
    'dashboard.clickAddGoal': 'Click "Add" to create your first goal',
    'dashboard.completed': 'Completed!',
    'dashboard.hide': 'Hide',
    'dashboard.show': 'Show',
    'dashboard.newGoal': 'New Goal',
    'dashboard.goalName': 'Name',
    'dashboard.goalNamePlaceholder': 'E.g.: Do 50 pull-ups',
    'dashboard.description': 'Description',
    'dashboard.descriptionPlaceholder': 'Goal description...',
    'dashboard.target': 'Target',
    'dashboard.currentProgress': 'Current Progress',
    'dashboard.unit': 'Unit',
    'dashboard.unitPlaceholder': 'reps, kg, km...',
    'dashboard.category': 'Category',
    'dashboard.categoryFitness': 'Fitness',
    'dashboard.categoryStrength': 'Strength',
    'dashboard.categoryCardio': 'Cardio',
    'dashboard.categoryFlexibility': 'Flexibility',
    'dashboard.categoryWeight': 'Weight',
    'dashboard.categoryOther': 'Other',
    'dashboard.dueDate': 'Due Date',
    'dashboard.create': 'Create',
    'dashboard.weeklyChange': 'per week',
    'dashboard.tooltip.edit': 'Edit',
    'dashboard.tooltip.delete': 'Delete',
    'dashboard.weekdays.0': 'SU',
    'dashboard.weekdays.1': 'MO', 
    'dashboard.weekdays.2': 'TU',
    'dashboard.weekdays.3': 'WE',
    'dashboard.weekdays.4': 'TH',
    'dashboard.weekdays.5': 'FR',
    'dashboard.weekdays.6': 'SA',
    'dashboard.months.0': 'Jan',
    'dashboard.months.1': 'Feb',
    'dashboard.months.2': 'Mar',
    'dashboard.months.3': 'Apr',
    'dashboard.months.4': 'May',
    'dashboard.months.5': 'Jun',
    'dashboard.months.6': 'Jul',
    'dashboard.months.7': 'Aug',
    'dashboard.months.8': 'Sep',
    'dashboard.months.9': 'Oct',
    'dashboard.months.10': 'Nov',
    'dashboard.months.11': 'Dec',
    
    // Equipment
    'equipment.title': 'Equipment',
    'equipment.description': 'Track equipment usage and progress',
    'equipment.totalEquipment': 'Total Equipment',
    'equipment.totalUsage': 'Total Usage',
    'equipment.totalVolume': 'Total Volume',
    'equipment.all': 'All',
    'equipment.strength': 'Strength Equipment',
    'equipment.cardio': 'Cardio Equipment',
    'equipment.functional': 'Functional',
    'equipment.freeWeights': 'Free Weights',
    'equipment.muscleGroups': 'Muscle Groups',
    'equipment.usage': 'Usage',
    'equipment.lastUsed': 'Last Used',
    'equipment.maxWeight': 'Max Weight',
    'equipment.volume': 'Total Volume',
    'equipment.noEquipment': 'No equipment added yet',
    'equipment.noEquipmentCategory': 'No equipment in selected category',
    
    // Muscle Groups
    'muscles.title': 'Muscle Groups',
    'muscles.description': 'Analyze muscle group development and workout progress',
    'muscles.totalGroups': 'Muscle Groups',
    'muscles.totalWorkouts': 'Total Workouts',
    'muscles.totalVolume': 'Total Volume',
    'muscles.progressGrowth': 'Progress Growth',
    'muscles.allGroups': 'All Groups',
    'muscles.upper': 'Upper Body',
    'muscles.core': 'Core',
    'muscles.lower': 'Lower Body',
    'muscles.visualization': 'Training Visualization',
    'muscles.hoverHelp': 'Hover over muscle groups for highlighting',
    'muscles.activeTraining': 'Actively training',
    'muscles.moderate': 'Moderate',
    'muscles.rarely': 'Rarely',
    'muscles.workouts': 'Workouts',
    'muscles.lastWorked': 'Last Worked',
    'muscles.maxWeight': 'Max Weight',
    'muscles.activity': 'Activity',
    'muscles.noGroups': 'No muscle groups added yet',
    'muscles.noGroupsCategory': 'No groups in selected category',
    
    // Achievements
    'achievements.title': 'Achievements',
    'achievements.description': 'Your sports successes and completed goals',
    'achievements.loading': 'Loading achievements...',
    'achievements.totalAchievements': 'Total Achievements',
    'achievements.visible': 'Visible',
    'achievements.hiddenCount': 'achievements hidden',
    'achievements.noAchievements': 'No achievements yet',
    'achievements.noAchievementsDesc': 'Complete your first goals to earn achievements!',
    'achievements.showAchievement': 'Show achievement',
    'achievements.hideAchievement': 'Hide achievement',
    
    // Profile
    'profile.title': 'User Profile',
    'profile.registeredOn': 'Registered on',
    'profile.editProfile': 'Edit profile',
    'profile.logout': 'Logout',
    'profile.save': 'Save',
    'profile.cancel': 'Cancel',
    'profile.username': 'Username',
    'profile.email': 'Email address',
    'profile.enterName': 'Enter name',
    'profile.enterEmail': 'Enter email',
    'profile.nameEmailRequired': 'Name and email are required',
    'profile.updateError': 'Profile update error',
    'profile.profileUpdated': 'Profile updated successfully!',
    'profile.confirmLogout': 'Are you sure you want to logout?',
    
    // Workouts
    'workouts.title': 'Recent Workouts',
    'workouts.loading': 'Loading workouts...',
    'workouts.exercises': 'exercises',
    'workouts.deleteWorkout': 'Delete workout',
    'workouts.editExercise': 'Edit',
    'workouts.exerciseName': 'Exercise name',
    'workouts.weight': 'Weight (kg)',
    'workouts.sets': 'Sets',
    'workouts.reps': 'Reps',
    'workouts.weightLabel': 'Weight:',
    'workouts.setsLabel': 'Sets:',
    'workouts.repsLabel': 'Reps:',
    'workouts.noWorkouts': 'No recorded workouts yet',
    'workouts.noWorkoutsDesc': 'Start chatting with the AI trainer to record your first workout!',
    'workouts.confirmDelete': 'Delete workout?',
    'workouts.deleteConfirmDesc': 'This action cannot be undone',
    'workouts.delete': 'Delete',
    'workouts.deleteExercise': 'Delete exercise?',
    'workouts.deleteExerciseDesc': 'The exercise will be removed from the workout. This action cannot be undone.',
    
    // Day Manager
    'dayManager.deleteConfirmTitle': 'Delete workout day?',
    'dayManager.deleteConfirmMessage': 'All data for this day will be deleted: chat messages, workouts and achievements.',
    'dayManager.deleteConfirmWarning': 'This action cannot be undone.',
    'dayManager.title': 'Day Management',
    'dayManager.addDay': 'Add Day',
    'dayManager.today': 'Today',
    'dayManager.editDay': 'Edit day',
    'dayManager.deleteDay': 'Delete day',
    'dayManager.collapse': 'Collapse',
    'dayManager.expand': 'Expand',
    'dayManager.noDaysCreated': 'No days created',
    'dayManager.noDaysDescription': 'Add your first workout day',
    'dayManager.loadingDays': 'Loading days...',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.kg': 'kg',
    'common.times': 'times',
    
    // Muscle categories (English names)
    'muscle.chest': 'Chest',
    'muscle.back': 'Back',
    'muscle.shoulders': 'Shoulders',
    'muscle.biceps': 'Biceps',
    'muscle.triceps': 'Triceps',
    'muscle.abs': 'Abs',
    'muscle.quads': 'Quads',
    'muscle.hamstrings': 'Hamstrings',
    'muscle.glutes': 'Glutes',
    'muscle.calves': 'Calves'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');

  // Загружаем язык из localStorage при инициализации
  useEffect(() => {
    const savedLanguage = localStorage.getItem('sportchat-language') as Language;
    if (savedLanguage && ['ru', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Сохраняем язык в localStorage при изменении
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('sportchat-language', newLanguage);
  };

  // Функция перевода
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Поддержка параметров в переводах
    if (params && typeof translation === 'string') {
      return Object.entries(params).reduce((text, [param, value]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }, translation);
    }
    
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}