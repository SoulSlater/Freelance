import React, { useEffect } from 'react';

const ConfirmationPage: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reindirizza alla pagina di login dopo 3 secondi
      window.location.href = '/';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-lg shadow-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Email Confermata!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          La tua registrazione è stata completata con successo.
        </p>
        <p className="text-gray-500 dark:text-gray-500 mt-4">
          Verrai reindirizzato alla pagina di login tra pochi secondi...
        </p>
        <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
