
export interface HistoryLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  details: string;
}

export const logAction = (action: string, details: string): HistoryLog[] => {
  const newLog: HistoryLog = {
    id: crypto.randomUUID(),
    action,
    details,
    timestamp: new Date().toISOString(),
    user: 'Admin'
  };
  
  const logs = JSON.parse(localStorage.getItem('mailflow_logs') || '[]');
  // Limit to 20 entries as requested
  const updatedLogs = [newLog, ...logs].slice(0, 20);
  localStorage.setItem('mailflow_logs', JSON.stringify(updatedLogs));
  
  return updatedLogs;
};

export const getLogs = (): HistoryLog[] => {
  return JSON.parse(localStorage.getItem('mailflow_logs') || '[]');
};
