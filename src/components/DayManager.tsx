"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Edit3, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { daysApi, utils, Day, User } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface DayManagerProps {
  onDaySelect: (day: Day) => void;
  selectedDay: Day | null;
  selectedUser: User;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DayManager({ onDaySelect, selectedDay, selectedUser, isCollapsed = false, onToggleCollapse }: DayManagerProps) {
  const { t } = useLanguage();
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Состояние для модала удаления
  const [dayToDelete, setDayToDelete] = useState<Day | null>(null);
  
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  useEffect(() => {
    if (selectedUser) {
      loadDays();
    }
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDays = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const data = await daysApi.getAll(selectedUser.id);
      setDays(data);
      
      // Если нет выбранного дня, выбираем сегодняшний или создаем его
      if (!selectedDay && data.length === 0) {
        await createTodayIfNotExists();
      } else if (!selectedDay && data.length > 0) {
        onDaySelect(data[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки дней:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTodayIfNotExists = async () => {
    if (!selectedUser) return;
    
    try {
      const today = utils.getCurrentDate();
      const day = await daysApi.getOrCreate(selectedUser.id, today);
      setDays(prev => [day, ...prev]);
      onDaySelect(day);
    } catch (error) {
      console.error('Ошибка создания сегодняшнего дня:', error);
    }
  };

  const handleAddDay = async () => {
    if (!newDate.trim() || !selectedUser) return;

    try {
      const day = await daysApi.create(selectedUser.id, newDate);
      setDays(prev => [day, ...prev.filter(d => d.id !== day.id)]);
      setNewDate("");
      setIsAddingDay(false);
      onDaySelect(day);
    } catch (error) {
      console.error('Ошибка создания дня:', error);
      alert('Ошибка создания дня. Возможно, этот день уже существует.');
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    try {
      await daysApi.delete(dayId);
      setDays(prev => prev.filter(d => d.id !== dayId));

      // Если удаляется выбранный день, выбираем другой
      if (selectedDay?.id === dayId) {
        const remainingDays = days.filter(d => d.id !== dayId);
        if (remainingDays.length > 0) {
          onDaySelect(remainingDays[0]);
        } else {
          // Создаем сегодняшний день
          await createTodayIfNotExists();
        }
      }

      setDayToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления дня:', error);
      alert('Ошибка удаления дня');
    }
  };

  const confirmDeleteDay = (day: Day) => {
    setDayToDelete(day);
  };

  const startEditDay = (day: Day) => {
    setEditingDay(day.id);
    setEditDate(day.date);
  };

  const handleEditDay = async () => {
    if (!editDate.trim()) return;

    try {
      // В данном случае мы не можем редактировать дату напрямую в Supabase
      // Так как это может нарушить целостность данных
      // Вместо этого можно создать новый день и перенести данные
      alert('Редактирование дат пока не поддерживается. Создайте новый день.');
      setEditingDay(null);
    } catch (error) {
      console.error('Ошибка редактирования дня:', error);
    }
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setEditDate("");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-primary-200">
        <div className="flex items-center justify-center py-8">
          <div className="text-primary-600">{t('dayManager.loadingDays')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-primary-200">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{t('dayManager.title')}</h3>
          <button
            onClick={toggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={collapsed ? t('dayManager.expand') : t('dayManager.collapse')}
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {!collapsed && !isAddingDay ? (
          <button
            onClick={() => setIsAddingDay(true)}
            className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">{t('dayManager.addDay')}</span>
          </button>
        ) : !collapsed ? (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-3 py-2 border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              autoFocus
            />
            <button
              onClick={handleAddDay}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsAddingDay(false);
                setNewDate("");
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
          {days.map((day) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer",
                selectedDay?.id === day.id
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200 hover:border-primary-300 hover:bg-primary-25"
              )}
            >
              <div
                onClick={() => onDaySelect(day)}
                className="flex-1 flex flex-col"
              >
                {editingDay === day.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-2 py-1 border border-primary-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <button
                      onClick={() => handleEditDay()}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">
                      {utils.formatDate(day.date)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {day.date === utils.getCurrentDate() ? t('dayManager.today') : day.date}
                    </p>
                  </>
                )}
              </div>

              {editingDay !== day.id && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditDay(day);
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                    title={t('dayManager.editDay')}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteDay(day);
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title={t('dayManager.deleteDay')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

              {days.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('dayManager.noDaysCreated')}</p>
                  <p className="text-sm">{t('dayManager.noDaysDescription')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модал подтверждения удаления */}
      <AnimatePresence>
        {dayToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDayToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('dayManager.deleteConfirmTitle')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {utils.formatDate(dayToDelete.date)}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                {t('dayManager.deleteConfirmMessage')}
                <span className="font-medium text-red-600"> {t('dayManager.deleteConfirmWarning')}</span>
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDayToDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleDeleteDay(dayToDelete.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}