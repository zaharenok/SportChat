'use client';

import { useEffect, useState } from 'react';
import { Play, Square, Volume2, AlertCircle } from 'lucide-react';

export default function DebugAudioPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Перехватываем console.log для отображения логов
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (level: string, args: unknown[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
      setLogs(prev => [...prev.slice(-50), `[${timestamp}] [${level}] ${message}`]);
    };

    console.log = (...args) => {
      originalLog(...args);
      if (args.some(arg => String(arg).includes('🎤') || String(arg).includes('📨') || String(arg).includes('🎵') || String(arg).includes('❌'))) {
        addLog('LOG', args);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('🎤 Debug: Starting audio recording...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Браузер не поддерживает запись аудио');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        console.log('📊 Debug: Audio data chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('🎤 Debug: Recording stopped, total chunks:', chunks.length);
        setIsRecording(false);
        
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/wav' });
        console.log('🎵 Debug: Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: chunks.length
        });
        
        setAudioBlob(audioBlob);
        
        stream.getTracks().forEach(track => {
          console.log('🎤 Debug: Stopping track:', track.kind, track.label);
          track.stop();
        });
      };

      recorder.onerror = (event) => {
        console.error('❌ Debug: MediaRecorder error:', event);
        setIsRecording(false);
      };
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      recorder.start();
      console.log('✅ Debug: Recording started successfully');
      
    } catch (error) {
      console.error('❌ Debug: Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🎤 Debug: Stopping recording...');
      mediaRecorder.stop();
    }
  };

  const testAudioUpload = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    
    try {
      console.log('🎵 Debug: Testing audio upload...');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'debug-audio.wav');
      formData.append('userId', 'debug-user');
      formData.append('dayId', 'debug-day');
      formData.append('isAudio', 'true');
      
      console.log('📤 Debug: Sending to /api/process-message...');
      
      const response = await fetch('/api/process-message', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Debug: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Debug: Server error:', errorText);
      } else {
        const result = await response.json();
        console.log('✅ Debug: Success response:', result);
      }
      
    } catch (error) {
      console.error('❌ Debug: Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Volume2 className="w-6 h-6 mr-2" />
            Отладка голосового распознавания
          </h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRecording ? 'Остановить запись' : 'Начать запись'}</span>
            </button>
            
            {audioBlob && (
              <button
                onClick={testAudioUpload}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Обработка...' : 'Тест загрузки'}</span>
              </button>
            )}
          </div>

          {audioBlob && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ Аудио записано: {Math.round(audioBlob.size / 1024)} KB, тип: {audioBlob.type}
              </p>
              <audio controls src={URL.createObjectURL(audioBlob)} className="mt-2 w-full" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Логи в реальном времени</h2>
          
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Логи появятся здесь...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setLogs([])}
            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Очистить логи
          </button>
        </div>
      </div>
    </div>
  );
}