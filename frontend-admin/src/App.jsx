import React, { useState } from 'react';
import { LayoutDashboard, Users, UserPlus, ShieldAlert, ShieldCheck, Lock, User as UserIcon, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Import tất cả các trang ta đã tạo
import Dashboard from './pages/Dashboard';
import TicketManagement from './pages/TicketManagement'; 
import SecurityLogs from './pages/SecurityLogs'; 
import AddAttendee from './pages/AddAttendee'; 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  
  // State cho Form Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
      toast.success('Đăng nhập thành công!');
    } else {
      toast.error('Sai tài khoản hoặc mật khẩu!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    toast.success('Đã đăng xuất an toàn');
  };

  // ---------------- MÀN HÌNH ĐĂNG NHẬP ----------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 p-4 rounded-full">
              <ShieldCheck className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center tracking-wider mb-2">HỆ THỐNG AN NINH</h2>
          <p className="text-slate-400 text-center mb-8">Vui lòng đăng nhập để quản trị</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30">
              TRUY CẬP HỆ THỐNG
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- MÀN HÌNH ADMIN (KHI ĐÃ LOGIN) ----------------
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'tickets': return <TicketManagement />;
      case 'add_attendee': return <AddAttendee />;
      case 'security_logs': return <SecurityLogs />;
      default: return <TicketManagement />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 shadow-xl z-10 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <h2 className="text-xl font-bold tracking-wider">EventAdmin</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5" /> Tổng Quan
          </button>
          <button onClick={() => setActiveTab('tickets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'tickets' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Users className="w-5 h-5" /> Quản Lý Khách
          </button>
          <button onClick={() => setActiveTab('add_attendee')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'add_attendee' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <UserPlus className="w-5 h-5" /> Đăng Ký Khách
          </button>
          <button onClick={() => setActiveTab('security_logs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'security_logs' ? 'bg-red-600 shadow-md text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <ShieldAlert className="w-5 h-5" /> Nhật Ký An Ninh
          </button>
        </nav>

        <div className="pt-6 mt-6 border-t border-slate-700 flex flex-col gap-3">
          <a href={`http://${window.location.hostname}:4000`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg transition-colors text-sm font-medium">
            Mở Kiosk Quét Mặt
          </a>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-slate-800 py-3 rounded-lg transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Đăng Xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto bg-slate-100">
        {renderContent()}
      </div>
    </div>
  );
}
