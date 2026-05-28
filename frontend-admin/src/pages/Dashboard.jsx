import React, { useState, useEffect } from 'react';
import { Users, Ticket, AlertTriangle, ShieldCheck, Loader2, Activity, Server } from 'lucide-react';
import { getAttendees } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAttendees();
        const total = data.length;
        const checkedIn = data.filter(a => a.is_checked_in).length;
        const pending = total - checkedIn;
        
        setStats({ total, checkedIn, pending });
      } catch (error) {
        console.error("Lỗi lấy dữ liệu thống kê", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Tự động làm mới dữ liệu mỗi 10 giây (Auto-refresh)
    // Giúp Admin luôn thấy số liệu mới nhất khi khách quẹt ở Kiosk
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Tính phần trăm cho thanh Progress Bar
  const progressPercent = stats.total === 0 ? 0 : Math.round((stats.checkedIn / stats.total) * 100);

  if (loading) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
              <p className="font-medium text-lg">Đang tổng hợp dữ liệu toàn hệ thống...</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 p-8 h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
          <Activity className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Tổng Quan Hệ Thống</h2>
          <p className="text-slate-500">Giám sát tiến độ sự kiện thời gian thực</p>
        </div>
      </div>
      
      {/* 4 THẺ THỐNG KÊ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-blue-100 p-4 rounded-xl"><Ticket className="w-8 h-8 text-blue-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Tổng Số Vé</p>
            <p className="text-4xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-green-100 p-4 rounded-xl"><ShieldCheck className="w-8 h-8 text-green-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Đã Check-in</p>
            <p className="text-4xl font-bold text-slate-800">{stats.checkedIn}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-orange-100 p-4 rounded-xl"><Users className="w-8 h-8 text-orange-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Chưa Đến</p>
            <p className="text-4xl font-bold text-slate-800">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-red-100 p-4 rounded-xl"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Cảnh Báo</p>
            <p className="text-4xl font-bold text-slate-800">3</p> {/* Hardcode lấy từ list log demo */}
          </div>
        </div>
      </div>
      
      {/* KHU VỰC TIẾN ĐỘ & TRẠNG THÁI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
        {/* Thanh Tiến Độ Sự Kiện */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Tiến Độ Nhập Tiệc
            </h3>
            
            <div className="mb-4 flex justify-between items-end">
                <span className="text-4xl font-bold text-blue-600">{progressPercent}%</span>
                <span className="text-slate-500 font-medium">Đã lấp đầy hội trường</span>
            </div>
            
            {/* Thanh Progress */}
            <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${progressPercent}%` }}
                >
                    {/* Hiệu ứng sọc chuyển động trên thanh progress */}
                    <div className="absolute inset-0 bg-white/20 w-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}></div>
                </div>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">Biểu đồ cập nhật tự động mỗi 10 giây</p>
        </div>

        {/* Trạng Thái Server Kiosk */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" /> Trạng Thái Máy Chủ
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-600">Database (Postgres)</span>
                    <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-600">AI Két Sắt (Qdrant)</span>
                    <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-600">RabbitMQ Worker</span>
                    <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
