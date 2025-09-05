import React, { useState } from 'react';
import { MessageCircle, BarChart3, Calendar, Users, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import Chat from './components/Chat/Chat';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import WorkoutCalendar from './components/WorkoutCalendar/WorkoutCalendar';
import TrainerDashboard from './components/TrainerDashboard/TrainerDashboard';

function AppContent() {
  const [activeTab, setActiveTab] = useState('chat');
  const { user, signOut, loading } = useAuth();

  const handleNavigateToTab = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col px-2 sm:px-4">
        <header className="border-b p-3 sm:p-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">SportChat</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Выход
            </Button>
          </div>
        </header>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-2 sm:mx-4 mb-0 mt-2 sm:mt-4">
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5">
              <MessageCircle className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Чат</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5">
              <Users className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Дашборд</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5">
              <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Календарь</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5">
              <BarChart3 className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">История</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 m-0">
            <Chat userId={1} />
          </TabsContent>
          
          <TabsContent value="dashboard" className="flex-1 m-0 overflow-auto p-4">
            <TrainerDashboard onNavigate={handleNavigateToTab} />
          </TabsContent>
          
          <TabsContent value="calendar" className="flex-1 m-0 overflow-auto">
            <WorkoutCalendar userId={1} />
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 m-0">
            <WorkoutHistory userId={1} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
