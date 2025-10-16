import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types';
import Modal from './ui/Modal';
import { PlusIcon, TrashIcon, EditIcon } from './ui/Icons';

const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      alert('Impossibile recuperare i clienti.');
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentClient({});
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setIsEditing(true);
    setCurrentClient(client);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentClient({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentClient.name || currentClient.gross_daily_rate === undefined || String(currentClient.gross_daily_rate).trim() === '') {
        alert('Per favore, compila tutti i campi obbligatori (Nome Cliente e Tariffa Lorda).');
        return;
    }

    try {
      const grossRate = parseFloat(String(currentClient.gross_daily_rate));
      if (isNaN(grossRate)) {
        alert('La tariffa lorda deve essere un numero valido.');
        return;
      }
      
      const clientData = {
          name: currentClient.name,
          gross_daily_rate: grossRate,
          user_id: user.id
      };

      if (isEditing) {
          const { error } = await supabase
              .from('clients')
              .update(clientData)
              .match({ id: currentClient.id });
          if (error) throw error;
      } else {
          const { error } = await supabase
              .from('clients')
              .insert([clientData]);
          if (error) throw error;
      }

      closeModal();
      fetchClients();
    } catch (error: any) {
        console.error('Error saving client:', error);
        alert(`Errore nel salvataggio del cliente: ${error.message || 'Si è verificato un errore imprevisto.'}`);
    }
  };
  
  const handleDelete = async (clientId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo cliente? Questa operazione potrebbe influire sulle giornate lavorative esistenti.')) {
      try {
        const { error } = await supabase
            .from('clients')
            .delete()
            .match({ id: clientId });

        if (error) {
            throw error;
        }
        fetchClients();
      } catch (error: any) {
          console.error('Error deleting client:', error);
          alert(`Errore nella cancellazione del cliente: ${error.message || 'Si è verificato un errore imprevisto.'}`);
      }
    }
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Clienti</h1>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Aggiungi Cliente
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Caricamento clienti...</p>
      ) : (
        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tariffa Lorda</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tariffa Netta</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">{client.gross_daily_rate.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">{(client.gross_daily_rate * 0.65).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => openEditModal(client)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <EditIcon />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                        <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {clients.length === 0 && <p className="text-center py-8 text-gray-500 dark:text-gray-400">Nessun cliente trovato. Aggiungine uno per iniziare.</p>}
        </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? 'Modifica Cliente' : 'Aggiungi Cliente'}>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Cliente</label>
                  <input
                      type="text"
                      name="name"
                      id="name"
                      value={currentClient.name || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-gray-700 dark:border-dark-border"
                      required
                  />
              </div>
              <div>
                  <label htmlFor="gross_daily_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tariffa Lorda (€)</label>
                  <input
                      type="number"
                      name="gross_daily_rate"
                      id="gross_daily_rate"
                      value={currentClient.gross_daily_rate || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-gray-700 dark:border-dark-border"
                      required
                      step="0.01"
                      placeholder="es. 300"
                  />
                  <p className="text-xs text-gray-500 mt-1">La tariffa netta verrà calcolata automaticamente (sottraendo il 35%).</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-dark-border dark:text-gray-200 dark:hover:bg-gray-600">Annulla</button>
                  <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salva Cliente</button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default ClientsPage;