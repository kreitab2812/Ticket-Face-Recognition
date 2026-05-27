import React, { useState } from 'react';
import { LayoutDashboard, Users, ScanSearch, MonitorPlay, ShieldCheck } from 'lucide-react';

// Import cac trang con da duoc tach file (Ban phai chac chan file ton tai nhe)
import Dashboard from './pages/Dashboard';
import TicketManagement from './pages/TicketManagement'; 
import ImageSearch from './pages/ImageSearch';
import VideoScanner from './pages/VideoScanner';

export default function App() {
  // Quan ly state de chuyen doi giua cac tab ma khong can tai lai trang
  const [activeTab, setActiveTab] = useState('dashboard');

  // Ham render noi dung tuy thuoc vao tab dang chon
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tickets':
        return <TicketManagement />;
      case 'search':
        return <ImageSearch />;
      case 'scanner':
        return <VideoScanner />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      
      {/* Sidebar - Thanh dieu huong ben trai */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 shadow-xl z-10 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <h2 className="text-xl font-bold tracking-wide">EventAdmin</h2>
        </div>
        
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Tong Quan
          </button>
          
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'tickets' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" /> Quan Ly Ve & Log
          </button>

          <button 
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'search' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <ScanSearch className="w-5 h-5" /> Tim Kiem AI
          </button>

          <button 
            onClick={() => setActiveTab('scanner')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'scanner' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <MonitorPlay className="w-5 h-5" /> Test Camera
          </button>
        </nav>

        <div className="pt-6 mt-6 border-t border-slate-700">
           {/* Link mo truc tiep Kiosk Front-end tren cong 4000 (cau hinh qua Nginx) */}
          <a href="http://localhost:4000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg transition-colors border border-slate-600">
            Mo Cong Kiosk (Thuc te)
          </a>
        </div>
      </div>

      {/* Main Content - Khu vuc noi dung chinh hien thi dong */}
      <div className="flex-1 p-8 overflow-auto">
         {renderContent()}
      </div>
      
    </div>
  );
}
