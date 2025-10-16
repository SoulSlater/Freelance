import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    if (password.length < 6) {
        setError('La password deve essere di almeno 6 caratteri.');
        return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
        // Il client Supabase JS rileva automaticamente il token di accesso dall'URL.
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) throw error;
        
        setMessage('Password aggiornata con successo! Sarai reindirizzato al login tra poco.');
        
        // Pulisce l'URL dopo l'aggiornamento per rimuovere il token.
        window.history.replaceState(null, "", window.location.pathname);

        setTimeout(() => {
            window.location.href = '/';
        }, 3000);

    } catch (error: any) {
        setError(error.error_description || error.message || 'Si è verificato un errore imprevisto.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
          Imposta Nuova Password
        </h2>
        
        {message && (
            <div className="text-center">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>
                <div className="mt-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                </div>
            </div>
        )}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        {!message && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-600 dark:text-gray-300 mb-2" htmlFor="password">
                Nuova Password
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
            <div className="mb-6">
              <label className="block text-gray-600 dark:text-gray-300 mb-2" htmlFor="confirm-password">
                Conferma Nuova Password
              </label>
              <input
                id="confirm-password"
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-brand-primary"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;