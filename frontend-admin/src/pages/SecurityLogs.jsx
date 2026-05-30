import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, ImageOff, UserX, CheckCircle, AlertTriangle, ShieldCheck, Loader2, Camera } from 'lucide-react';
import { getCheckInLogs } from '../services/api';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = await getCheckInLogs();
      setLogs(data);
    } catch (error) {
      console.error("[-] Lỗi tải nhật ký an ninh", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // [LIVE STREAMING]: Cứ 3 giây làm mới một lần để bắt ngay khi có người Check-in
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hàm phân loại Cấp độ Cảnh báo (Dựa vào status từ Backend)
  const getLogDetails = (status) => {
    if (status.includes("Hợp lệ")) {
        return { type: "SUCCESS", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: ShieldCheck, severity: "Bình thường", sevClass: "bg-green-100 text-green-700" };
    } else if (status.includes("che tối") || status.includes("che khuất")) {
        return { type: "WARNING", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Camera, severity: "Cảnh báo Kiosk", sevClass: "bg-amber-100 text-amber-700" };
    } else if (status.includes("Cảnh báo")) {
        return { type: "CRITICAL", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: ShieldAlert, severity: "Báo động Đỏ", sevClass: "bg-red-100 text-red-700 animate-pulse" };
    } else {
        return { type: "UNKNOWN", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", icon: UserX, severity: "Không xác định", sevClass: "bg-slate-200 text-slate-700" };
    }
  };

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-3 rounded-xl shadow-sm">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              Nhật Ký An Ninh Kiosk
              <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wider border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE
              </span>
            </h2>
            <p className="text-slate-500 font-medium">Giám sát theo thời gian thực mọi hoạt động quét khuôn mặt</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto p-6 space-y-4 flex-1">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                 <p className="font-bold">Đang đồng bộ dữ liệu an ninh...</p>
             </div>
          ) : logs.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                 <ShieldCheck className="w-12 h-12 text-green-200" />
                 <p className="font-bold text-lg text-slate-500">Hệ thống an toàn, chưa có ghi nhận nào.</p>
             </div>
          ) : (
            logs.map((log) => {
              const details = getLogDetails(log.status);
              const LogIcon = details.icon;

              return (
                <div 
                  key={log.id} 
                  className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border ${details.border} ${details.bg} transition-all hover:shadow-md`}
                >
                  <div className={`p-4 rounded-xl flex-shrink-0 flex items-center justify-center bg-white border ${details.border}`}>
                    <LogIcon className={`w-8 h-8 ${details.color}`} />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className={`text-lg font-bold ${details.type === 'CRITICAL' ? 'text-red-700' : 'text-slate-800'}`}>
                          {log.status}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase border ${details.sevClass}`}>
                        {details.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> 
                          {new Date(log.check_time).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1.5">
                          <UserX className="w-4 h-4" /> 
                          {log.attendee_id ? `ID Khách: #${log.attendee_id}` : 'Đối tượng ẩn danh'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 w-full md:w-auto flex items-center justify-center">
                    {log.image_url ? (
                        <div className="h-24 w-24 md:h-20 md:w-32 rounded-lg overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform">
                            <img src={log.image_url} alt="Tang chứng" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="bg-white/50 border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center gap-1 text-xs font-medium text-slate-400 h-24 w-24 md:h-20 md:w-32">
                            <ImageOff className="w-5 h-5 opacity-50" />
                            <span>Không có ảnh</span>
                        </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;
