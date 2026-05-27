import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, Ticket, Image as ImageIcon, Upload, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({ name: '', ticket_code: '' });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const fileInputRef = useRef(null);

  // Lấy dữ liệu Log từ Backend
  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/admin/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Lỗi khi tải log:', error);
    }
  };

  // Tự động fetch log mỗi 3 giây
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý gửi Form đăng ký vé
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setAlert({ show: true, type: 'error', message: 'Vui lòng chọn ảnh khuôn mặt!' });
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('ticket_code', formData.ticket_code);
    data.append('file', file);

    try {
      const response = await axios.post('/api/admin/add_attendee', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.status === 'success') {
        setAlert({ show: true, type: 'success', message: response.data.message });
        // Reset form
        setFormData({ name: '', ticket_code: '' });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setAlert({ show: true, type: 'error', message: response.data.message });
      }
    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Lỗi kết nối tới máy chủ!' });
    }
    
    setIsSubmitting(false);
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Thanh điều hướng bên trái */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 shadow-xl z-10">
        <div className="flex items-center gap-3 mb-10">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <h2 className="text-xl font-bold tracking-wide">EventAdmin</h2>
        </div>
        <nav className="space-y-4">
          <a href="#" className="flex items-center gap-3 bg-blue-600 px-4 py-3 rounded-lg font-medium shadow-md">
            <Users className="w-5 h-5" /> Đăng ký vé
          </a>
          <a href="#" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg font-medium transition-colors">
            <Activity className="w-5 h-5" /> Báo cáo an ninh
          </a>
          <div className="pt-8 mt-8 border-t border-slate-700">
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg font-medium transition-colors">
              <Upload className="w-5 h-5" /> Mở cổng Kiosk
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content - Khu vực nội dung chính */}
      <div className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Bảng Điều Khiển Sự Kiện</h1>
          <p className="text-slate-500 mt-1">Quản lý khách tham dự và giám sát cổng Check-in thời gian thực.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Form Đăng ký */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-500" /> Cấp Vé Mới
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã Vé (Ticket Code)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.ticket_code}
                    onChange={(e) => setFormData({...formData, ticket_code: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                    placeholder="VD: VIP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh Khuôn Mặt</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 text-center hover:bg-slate-50 transition-colors">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files[0])}
                      className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {alert.show && (
                  <div className={`p-4 rounded-lg text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {alert.message}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:bg-blue-400"
                >
                  {isSubmitting ? 'Đang trích xuất AI...' : 'Lưu vào hệ thống'}
                </button>
              </form>
            </div>
          </div>

          {/* Cột phải: Bảng Log */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Nhật Ký Qua Cổng
                </h3>
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-sm font-medium text-slate-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-500 uppercase tracking-wider">Mã Vé</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-500 uppercase tracking-wider">Khách Hàng</th>
                      <th className="px-6 py-4 text-sm font-medium text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu check-in.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">{log.check_time}</td>
                          <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">{log.ticket_code}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{log.attendee_name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              log.status === 'Hợp lệ' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {log.status === 'Hợp lệ' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
