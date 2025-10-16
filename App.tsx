import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import ClientsPage from './components/ClientsPage';
import RevenuePage from './components/RevenuePage';
import ConfirmationPage from './components/ConfirmationPage';
import { useTheme } from './hooks/useTheme';
import { AppView } from './types';
import { SunIcon, MoonIcon, LogoutIcon, DashboardIcon, UsersIcon, ChartBarIcon, UserIcon } from './components/ui/Icons';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [isConfirmation, setIsConfirmation] = useState(false);

  useEffect(() => {
    // Supabase usa # per i token di autenticazione nel link di conferma.
    // Verifichiamo la presenza di 'access_token' per identificare questo caso specifico.
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=signup')) {
      setIsConfirmation(true);
      // Pulisce l'hash dall'URL per evitare che il check si ripeta
      // e per non lasciare i token visibili nella barra degli indirizzi.
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (isConfirmation) {
    return <ConfirmationPage />;
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

const MainApp: React.FC = () => {
  const { session } = useAuth();
  const [theme, toggleTheme] = useTheme();

  return (
    <div className={`${theme} font-sans bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-gray-100 min-h-screen`}>
      {session ? <Layout toggleTheme={toggleTheme} theme={theme} /> : <AuthPage />}
    </div>
  );
};

const Layout: React.FC<{ toggleTheme: () => void; theme: string }> = ({ toggleTheme, theme }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.Dashboard);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.Dashboard:
        return <DashboardPage />;
      case AppView.Clients:
        return <ClientsPage />;
      case AppView.Revenue:
        return <RevenuePage />;
      default:
        return <DashboardPage />;
    }
  };

  // Fix: Specify that the icon prop is a React element that accepts a className.
  // This allows React.cloneElement to pass the className prop without a type error.
  const NavLink: React.FC<{ view: AppView; icon: React.ReactElement<{ className?: string }>; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-colors duration-200 ${
        currentView === view
          ? 'text-brand-primary'
          : 'text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary'
      }`}
    >
      {React.cloneElement(icon, { className: 'w-6 h-6 mb-1' })}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-dark-card shadow-md z-40">
        <h1 className="text-xl font-bold text-brand-primary">FreelanceApp</h1>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border"
            >
              <UserIcon className="w-6 h-6" />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-dark-border">
                  <p className="font-medium">Accesso come</p>
                  <p className="truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogoutIcon className="mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t dark:border-dark-border flex justify-around z-40">
        <NavLink view={AppView.Dashboard} icon={<DashboardIcon />} label={AppView.Dashboard} />
        <NavLink view={AppView.Clients} icon={<UsersIcon />} label={AppView.Clients} />
        <NavLink view={AppView.Revenue} icon={<ChartBarIcon />} label={AppView.Revenue} />
      </nav>
    </div>
  );
};

export default App;
