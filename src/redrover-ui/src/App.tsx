import React, { useState, useEffect, useCallback } from 'react';
import { Absence, DistrictMetrics, School, Teacher, Substitute } from './types';
import { api, createSignalRConnection } from './services/api';
import { Navbar } from './components/Navbar';
import { AdminPortal } from './components/AdminPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { SubstitutePortal } from './components/SubstitutePortal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [signalRConnected, setSignalRConnected] = useState<boolean>(false);

  // Core Data
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [, setMetrics] = useState<DistrictMetrics>({
    totalAbsencesToday: 4,
    filledCount: 3,
    openCount: 1,
    fillRatePercentage: 75.0,
    substitutesAvailable: 6,
  });
  const [, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);

  // Load initial data from backend API
  const loadData = useCallback(async () => {
    try {
      const [abs, met, sch, tch, sub] = await Promise.all([
        api.getAbsences(),
        api.getMetrics(),
        api.getSchools(),
        api.getTeachers(),
        api.getSubstitutes(),
      ]);

      setAbsences(abs);
      setMetrics(met);
      setSchools(sch);
      setTeachers(tch);
      setSubstitutes(sub);
    } catch (err) {
      console.error('Error loading initial data', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Establish SignalR WebSocket connection for real-time absence updates
  useEffect(() => {
    const hubConnection = createSignalRConnection(
      (newAbsence: Absence) => {
        setAbsences(prev => [newAbsence, ...prev.filter(a => a.id !== newAbsence.id)]);
        api.getMetrics().then(setMetrics);
      },
      (updatedAbsence: Absence) => {
        setAbsences(prev => prev.map(a => a.id === updatedAbsence.id ? updatedAbsence : a));
        api.getMetrics().then(setMetrics);
      }
    );

    hubConnection.start()
      .then(() => {
        setSignalRConnected(true);
        console.log('✅ SignalR Connected to /hubs/absences');
      })
      .catch((err) => {
        console.warn('SignalR fallback: local mode active', err);
        setSignalRConnected(false);
      });

    return () => {
      hubConnection.stop();
    };
  }, []);

  return (
    <div className="app-container">
      {/* Top Demo Navigation Switcher (Admin / Teacher / Substitute) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        signalRConnected={signalRConnected}
      />

      {/* Main 100% Pixel-Mirrored Red Rover Portals */}
      <main className="main-content-wrapper">
        {activeTab === 'admin' && (
          <AdminPortal
            absences={absences}
            substitutes={substitutes}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherPortal
            absences={absences}
            teachers={teachers}
            onAbsenceCreated={loadData}
          />
        )}

        {activeTab === 'substitute' && (
          <SubstitutePortal
            absences={absences}
            substitutes={substitutes}
            onShiftClaimed={loadData}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span>
            Red Rover K-12 Absence Management System • 100% Training MP4 Pixel Mirror
          </span>
          <span className="text-muted">
            .NET Core Web API + React 18 + Azure SignalR Hub
          </span>
        </div>
      </footer>
    </div>
  );
};
