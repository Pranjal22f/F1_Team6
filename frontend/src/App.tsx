import React, { useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GuidedDemoModal } from './components/GuidedDemoModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { TopologyPage } from './pages/TopologyPage';
import { VlanAddressingPage } from './pages/VlanAddressingPage';
import { RoutingSimulatorPage } from './pages/RoutingSimulatorPage';
import { FaultTolerancePage } from './pages/FaultTolerancePage';
import { SecurityCenterPage } from './pages/SecurityCenterPage';
import { TrafficQoSPage } from './pages/TrafficQoSPage';
import { NetworkServicesPage } from './pages/NetworkServicesPage';
import { ProtocolLabPage } from './pages/ProtocolLabPage';
import { ExperimentReportsPage } from './pages/ExperimentReportsPage';
import { SettingsDocsPage } from './pages/SettingsDocsPage';

export function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} />;
      case 'topology':
        return <TopologyPage key={refreshKey} />;
      case 'vlans':
        return <VlanAddressingPage key={refreshKey} />;
      case 'routing':
        return <RoutingSimulatorPage key={refreshKey} />;
      case 'fault-tolerance':
        return <FaultTolerancePage key={refreshKey} />;
      case 'security':
        return <SecurityCenterPage key={refreshKey} />;
      case 'qos':
        return <TrafficQoSPage key={refreshKey} />;
      case 'services':
        return <NetworkServicesPage key={refreshKey} />;
      case 'protocols':
        return <ProtocolLabPage key={refreshKey} />;
      case 'reports':
        return <ExperimentReportsPage key={refreshKey} />;
      case 'docs':
        return <SettingsDocsPage key={refreshKey} />;
      default:
        return <Dashboard key={refreshKey} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-noc-bg text-noc-text">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        onOpenDemo={() => setIsDemoModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          activePage={activePage}
          onOpenDemo={() => setIsDemoModalOpen(true)}
          onRefresh={handleRefresh}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Guided Demonstration Modal */}
      <GuidedDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigate={(page) => setActivePage(page)}
      />
    </div>
  );
}

export default App;
