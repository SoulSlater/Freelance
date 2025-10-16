import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { WorkDay } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, DocumentArrowDownIcon } from './ui/Icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ClientBreakdownItem {
  clientName: string;
  days: number;
  grossRevenue: number;
  netRevenue: number;
  // Fix: Add index signature for recharts compatibility
  [key: string]: any;
}

const COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const RevenuePieChart: React.FC<{ data: ClientBreakdownItem[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="grossRevenue"
          nameKey="clientName"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} />
        <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};


const RevenuePage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const fetchWorkDays = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('work_days')
      .select('*, clients(*)')
      .eq('user_id', user.id)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching work days:', error);
      alert('Impossibile recuperare i dati sul fatturato.');
    } else {
      setWorkDays((data as WorkDay[]) || []);
    }
    setLoading(false);
  }, [user, currentDate]);

  useEffect(() => {
    fetchWorkDays();
  }, [fetchWorkDays]);

  const { totalGross, totalNet, totalDays, clientBreakdown } = useMemo(() => {
    const breakdown: { [key: string]: ClientBreakdownItem } = {};

    workDays.forEach(day => {
      if (!day.clients) return;
      const clientName = day.clients.name;
      if (!breakdown[clientName]) {
        breakdown[clientName] = {
          clientName: clientName,
          days: 0,
          grossRevenue: 0,
          netRevenue: 0
        };
      }
      breakdown[clientName].days += 1;
      breakdown[clientName].grossRevenue += day.clients.gross_daily_rate;
      breakdown[clientName].netRevenue += day.clients.gross_daily_rate * 0.65;
    });
    
    const clientBreakdownArray = Object.values(breakdown).sort((a, b) => b.grossRevenue - a.grossRevenue);
    const totalGross = clientBreakdownArray.reduce((sum, item) => sum + item.grossRevenue, 0);
    const totalNet = totalGross * 0.65;

    return {
      totalGross,
      totalNet,
      totalDays: workDays.length,
      clientBreakdown: clientBreakdownArray
    };
  }, [workDays]);
  
 const handleExportPdf = async () => {
      if (workDays.length === 0) {
          alert("Nessun dato da esportare per il mese selezionato.");
          return;
      }
      setIsExporting(true);
      
      const source = document.getElementById('pdf-content-source');
      if (!source) {
          setIsExporting(false);
          return;
      }

      // Crea un clone dell'elemento sorgente. Il clone erediterà gli stili
      // del sorgente, incluso 'left: -9999px' che lo posiziona fuori schermo.
      const clonedSource = source.cloneNode(true) as HTMLElement;
      
      // Aggiungiamo il clone al body. Non è necessario applicare altri stili
      // che causavano la pagina bianca (es. opacity: 0). È già posizionato 
      // correttamente fuori dalla vista dell'utente.
      document.body.appendChild(clonedSource);

      // Attendi un breve istante per assicurarti che il browser abbia renderizzato il clone
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Esegui html2canvas sul clone
        const canvas = await html2canvas(clonedSource, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        let finalImgWidth = pdfWidth - 20; // 10mm margin on each side
        let finalImgHeight = finalImgWidth / ratio;

        // Se l'immagine è troppo alta, ricalcola le dimensioni basandoti sull'altezza
        if (finalImgHeight > pdfHeight - 20) {
            finalImgHeight = pdfHeight - 20;
            finalImgWidth = finalImgHeight * ratio;
        }

        const x = (pdfWidth - finalImgWidth) / 2;
        const y = 10;

        pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);

        const monthName = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        pdf.save(`Fatturato_${monthName}_${year}.pdf`);

      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Si è verificato un errore durante la creazione del PDF.");
      } finally {
        // Rimuovi il clone dal DOM
        document.body.removeChild(clonedSource);
        setIsExporting(false);
      }
  };


  const changeMonth = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Fatturato</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-white dark:bg-dark-card rounded-lg shadow-sm p-1">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border" aria-label="Mese precedente">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="font-semibold w-32 text-center" aria-live="polite">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border" aria-label="Mese successivo">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
            <button
              onClick={handleExportPdf}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              title="Esporta come PDF"
              disabled={isExporting || workDays.length === 0}
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              {isExporting ? 'Esportazione...' : 'Esporta PDF'}
            </button>
        </div>
      </div>
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-10">Caricamento dati...</p>
        ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fatturato Lordo</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{totalGross.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                 <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fatturato Netto (stima)</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{totalNet.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                 <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Giornate Lavorate</h3>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{totalDays}</p>
                </div>
            </div>
            
            {clientBreakdown.length > 0 &&
                <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Ripartizione Fatturato Lordo</h2>
                    <RevenuePieChart data={clientBreakdown} />
                </div>
            }

            <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                <h2 className="text-xl font-semibold p-6 text-gray-800 dark:text-gray-100">Dettaglio Clienti</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giornate</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fatturato Lordo</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fatturato Netto</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                        {clientBreakdown.map(item => (
                            <tr key={item.clientName} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">{item.days}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">{item.grossRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">{item.netRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                 {workDays.length === 0 && !loading && <p className="text-center py-8 text-gray-500 dark:text-gray-400">Nessuna giornata lavorativa trovata per questo mese.</p>}
            </div>
            
            {/* Contenuto sorgente per il PDF, non visibile */}
            <div id="pdf-content-source" style={{ position: 'absolute', left: '-9999px', width: '800px', backgroundColor: 'white', padding: '40px', color: '#111827', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Report Fatturato</h1>
                    <h2 style={{ fontSize: '20px', margin: '4px 0 0 0', color: '#374151' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '32px', textAlign: 'center', gap: '20px' }}>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', flex: 1, backgroundColor: '#f9fafb' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#6b7280' }}>Fatturato Lordo</h3>
                        <p style={{ fontSize: '24px', fontWeight: '600', margin: '8px 0 0 0', color: '#111827' }}>{totalGross.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                    </div>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', flex: 1, backgroundColor: '#f9fafb' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#6b7280' }}>Fatturato Netto</h3>
                        <p style={{ fontSize: '24px', fontWeight: '600', margin: '8px 0 0 0', color: '#111827' }}>{totalNet.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                    </div>
                     <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', flex: 1, backgroundColor: '#f9fafb' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#6b7280' }}>Giornate Lavorate</h3>
                        <p style={{ fontSize: '24px', fontWeight: '600', margin: '8px 0 0 0', color: '#111827' }}>{totalDays}</p>
                    </div>
                </div>
                
                <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Dettaglio Clienti</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: '#374151' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left', color: '#4b5563' }}>Cliente</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#4b5563' }}>Giornate</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#4b5563' }}>Fatturato Lordo</th>
                                <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#4b5563' }}>Fatturato Netto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientBreakdown.map(item => (
                                <tr key={item.clientName} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontWeight: '500', color: '#111827' }}>{item.clientName}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.days}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.grossRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.netRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
        )}
    </div>
  );
};

export default RevenuePage;