import React, { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { Menu, HardDrive, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast';

export default function SuperAdminBackup() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackupInfo, setLastBackupInfo] = useState(null);

  const collectionsToBackup = ["colleges", "users", "events", "scans", "clubs"];

  const handleBackup = async () => {
    setBackingUp(true);
    toast.loading("Generating backup, please wait...", { id: 'backup' });
    
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        collections: {}
      };

      for (const colName of collectionsToBackup) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(colRef);
          backupData.collections[colName] = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (e) {
          console.warn(`Could not fetch collection ${colName}`, e);
          // Collection might not exist or permission denied
        }
      }

      // Convert to JSON and create Blob
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `updone-mark-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackupInfo({
        date: new Date().toLocaleString(),
        size: (blob.size / 1024).toFixed(2) + " KB"
      });

      toast.success("Backup downloaded successfully", { id: 'backup' });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate backup", { id: 'backup' });
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center px-6 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white mr-4">
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
            <HardDrive className="text-primary" /> Backup Center
          </h2>
        </header>

        <div className="p-6 md:p-8 flex-1">
          <div className="max-w-3xl">
            <div className="card mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal">
                  <Download size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy dark:text-white">Export Database</h3>
                  <p className="text-gray-500 mt-1">Download a complete JSON snapshot of all system collections including colleges, users, events, and attendance records.</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-navy-soft rounded-xl p-4 mb-6 border border-gray-200 dark:border-white/5">
                <h4 className="font-semibold text-navy dark:text-white mb-2 text-sm">Included Collections:</h4>
                <div className="flex flex-wrap gap-2">
                  {collectionsToBackup.map(c => (
                    <span key={c} className="px-3 py-1 bg-white dark:bg-navy rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleBackup}
                disabled={backingUp}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3"
              >
                {backingUp ? 'Processing...' : 'Download Backup JSON'}
              </button>

              {lastBackupInfo && (
                <div className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle size={16} /> Last backup: {lastBackupInfo.date} ({lastBackupInfo.size})
                </div>
              )}
            </div>

            <div className="bg-rust/10 border border-rust/20 rounded-xl p-5 flex items-start gap-3">
              <div className="text-rust mt-0.5"><AlertTriangle size={20} /></div>
              <div>
                <h4 className="font-semibold text-navy dark:text-white">Security Notice</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Backups contain sensitive user data and attendance records. Ensure you store the downloaded JSON files in a secure, compliant environment. Never share backup files publicly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
