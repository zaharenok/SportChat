"use client";

import { useState, useEffect, useCallback } from 'react';

interface Goal {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
}

export default function TestGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userId, setUserId] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [increment, setIncrement] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const loadGoals = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/test-goals?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setGoals(data.goals);
        console.log('📋 Loaded goals:', data.goals);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error loading goals: ${error}`);
    }
  }, [userId]);

  const testGoalUpdate = async () => {
    if (!userId || !selectedGoal) {
      setResult('Please enter userId and select a goal');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('🧪 Testing goal update:', { userId, goalId: selectedGoal, increment });
      
      const response = await fetch('/api/test-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          goalId: selectedGoal,
          increment: parseInt(increment.toString())
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success! Updated from ${data.oldValue} to ${data.newValue}`);
        loadGoals(); // Reload goals to see the change
      } else {
        setResult(`❌ Error: ${data.error} - ${data.details || ''}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [userId, loadGoals]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">🧪 Test Goals Update</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your user ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <button
            onClick={loadGoals}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load Goals
          </button>

          {goals.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Goal
                </label>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Choose a goal...</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({goal.current_value}/{goal.target_value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Increment by
                </label>
                <input
                  type="number"
                  value={increment}
                  onChange={(e) => setIncrement(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <button
                onClick={testGoalUpdate}
                disabled={loading || !selectedGoal}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Goal Update'}
              </button>
            </>
          )}

          {result && (
            <div className={`p-4 rounded-lg ${result.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result}
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Current Goals:</h3>
            {goals.length === 0 ? (
              <p className="text-gray-500">No goals loaded</p>
            ) : (
              <ul className="space-y-2">
                {goals.map((goal) => (
                  <li key={goal.id} className="text-sm">
                    <strong>{goal.title}</strong>: {goal.current_value}/{goal.target_value}
                    <span className="text-gray-500 ml-2">ID: {goal.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}