import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Briefcase, 
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  signalRConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  signalRConnected,
}) => {
  const tabs = [
    { 
      id: 'admin', 
      label: 'School Admin', 
      sublabel: 'Live Board & Dispatch', 
      icon: Building2 
    },
    { 
      id: 'teacher', 
      label: 'Teacher', 
      sublabel: 'Absence & Coverage Tracker', 
      icon: GraduationCap 
    },
    { 
      id: 'substitute', 
      label: 'Substitute', 
      sublabel: 'Accept / Decline & Schedule', 
      icon: Briefcase 
    },
  ];

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand-section">
          <div className="logo-badge">
            <span className="logo-dot"></span>
            <span className="logo-text">RED ROVER</span>
          </div>
          <span className="brand-subtitle">Official UI Mirror Demo</span>
        </div>

        {/* 3 Main Persona Tabs */}
        <nav className="nav-tabs role-switcher-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn role-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} className="tab-icon" />
                <div className="tab-text-group">
                  <span className="tab-title">{tab.label}</span>
                  <span className="tab-sublabel">{tab.sublabel}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="nav-right">
          <div className={`status-pill ${signalRConnected ? 'live' : 'fallback'}`}>
            <Radio size={13} className={signalRConnected ? 'pulse' : ''} />
            <span>{signalRConnected ? 'Azure SignalR Live' : 'Local Connected'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
