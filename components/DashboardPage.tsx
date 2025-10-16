import React, { useState, useEffect, useCallback } from 'react';
import { Client, WorkDay } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from './ui/Modal';
import { ChevronLeftIcon, ChevronRightIcon } from './ui/Icons';

const Calendar: React.FC<{
    workDays: WorkDay[];
    clients: Client[];
    onDateSelect: (date: Date) => void;
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}> = ({ workDays, onDateSelect, currentDate, setCurrentDate }) => {
    
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    
    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
        return (
            <div className="grid grid-cols-7 gap-1 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
                {days.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const totalDays = daysInMonth(month, year);
        let firstDay = firstDayOfMonth(month, year);
        firstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust to start week on Monday
        
        const cells: React.ReactElement[] = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="p-1"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const dayWork = workDays.find(wd => wd.date === dateString);
            const isToday = new Date().toDateString() === date.toDateString();

            cells.push(
                <div key={day} className="p-1">
                    <button
                        onClick={() => onDateSelect(date)}
                        className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-colors duration-200 ${isToday ? 'bg-brand-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-border'}`}
                    >
                        <span className="text-sm">{day}</span>
                        {dayWork && (
                            <span className="text-xs truncate px-1 bg-brand-secondary text-white rounded mt-1">{dayWork.clients.name}</span>
                        )}
                    </button>
                </div>
            );
        }
        return <div className="grid grid-cols-7 gap-1">{cells}</div>;
    };
    
    return (
        <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [workDays, setWorkDays] = useState<WorkDay[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchClients = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('clients').select('*');
        if (error) console.error("Error fetching clients:", error);
        else setClients(data || []);
    }, [user]);

    const fetchWorkDays = useCallback(async () => {
        if (!user) return;
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('work_days')
            .select('*, clients(*)')
            .gte('date', firstDay)
            .lte('date', lastDay);
        if (error) console.error("Error fetching work days:", error);
        else setWorkDays(data as WorkDay[] || []);
    }, [user, currentDate]);

    useEffect(() => {
        fetchClients();
        fetchWorkDays();
    }, [fetchClients, fetchWorkDays]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        const existingWorkDay = workDays.find(wd => wd.date === date.toISOString().split('T')[0]);
        setSelectedClientId(existingWorkDay ? String(existingWorkDay.client_id) : '');
        setIsModalOpen(true);
    };

    const handleSaveWorkDay = async () => {
        if (!selectedDate || !user) return;
        const dateString = selectedDate.toISOString().split('T')[0];
        
        const existingWorkDay = workDays.find(wd => wd.date === dateString);

        if(selectedClientId === 'remove') { // Handle removal
             if(existingWorkDay) {
                const { error } = await supabase.from('work_days').delete().match({ id: existingWorkDay.id });
                if (error) alert("Errore nella rimozione della giornata lavorativa");
             }
        } else if (selectedClientId) { // Handle add/update
            const upsertData = {
                date: dateString,
                client_id: selectedClientId,
                user_id: user.id
            };
            if (existingWorkDay) { // Update
                const { error } = await supabase.from('work_days').update({ client_id: selectedClientId }).match({ id: existingWorkDay.id });
                if (error) alert("Errore nell'aggiornamento della giornata lavorativa");
            } else { // Insert
                const { error } = await supabase.from('work_days').insert(upsertData);
                if (error) alert("Errore nell'inserimento della giornata lavorativa");
            }
        }

        setIsModalOpen(false);
        fetchWorkDays();
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
            
            <div className="max-w-2xl mx-auto">
                <Calendar workDays={workDays} clients={clients} onDateSelect={handleDateSelect} currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Gestisci ${selectedDate?.toLocaleDateString('it-IT')}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleziona Cliente</label>
                        <select
                            id="client-select"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-dark-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                            <option value="">Nessun Cliente</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                             <option value="remove" className="text-red-500 font-bold">-- Rimuovi Giorno --</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-dark-border dark:text-gray-200 dark:hover:bg-gray-600">Annulla</button>
                        <button onClick={handleSaveWorkDay} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salva</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardPage;