import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Specifichiamo esplicitamente l'URL di reindirizzamento
            // per essere sicuri che Supabase sappia dove mandare l'utente.
            emailRedirectTo: `${window.location.origin}`,
          },
        });
        if (error) throw error;
        setMessage('Registrazione avvenuta! Controlla la tua email per la verifica.');
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Inserisci la tua email per resettare la password.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      setMessage('Email di recupero password inviata! Controlla la tua casella di posta.');
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
          {isLogin ? 'Accedi' : 'Registrati'}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Gestisci le tue attività da freelance
        </p>
        
        {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <form onSubmit={handleAuthAction}>
          <div className="mb-4">
            <label className="block text-gray-600 dark:text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-primary"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="latua@email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-600 dark:text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-primary"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>
        <div className="text-center mt-6">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-brand-primary hover:underline">
            {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
          <span className="mx-2 text-gray-400">|</span>
          <button onClick={handlePasswordReset} className="text-sm text-brand-primary hover:underline">
            Password dimenticata?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;