import React, { useState } from 'react';
import { ShieldAlert, Clock, ImageOff, UserX } from 'lucide-react';

// === DỮ LIỆU DEMO: Các vụ cố tình qua mặt Kiosk ===
const mockSecurityLogs = [
  {
    id: 1,
    type: "UNKNOWN_FACE",
    message: "Phát hiện khuôn mặt không có trong hệ thống",
    time: "15:42:12 28/05/2026",
    camera_id: "Kiosk Cổng Chính",
    severity: "high"
  },
  {
    id: 2,
    type: "DUPLICATE_TICKET",
    message: "Phát hiện người lạ sử dụng vé đã Check-in của [VIP_001]",
    time: "14:15:05 28/05/2026",
    camera_id: "Kiosk Cổng VIP",
    severity: "critical"
  },
  {
    id: 3,
    type: "SPOOFING_ATTEMPT",
    message: "Chặn nỗ lực dùng điện thoại giơ ảnh giả mạo (Liveness Failed)",
    time: "09:30:22 28/05/2026",
    camera_id: "Kiosk Cổng Chính",
    severity: "high"
  }
];

const SecurityLogs = () => {
  const [logs] = useState(mockSecurityLogs);

  return (
    <div className="space-y-6 p-8 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-100 p-3 rounded-xl shadow-sm border border-red-200">
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Nhật Ký Cảnh Báo An Ninh</h2>
          <p className="text-slate-500">Lưu vết các hành vi bất thường và từ chối truy cập tại Kiosk</p>
        </div>
      </div>

      <div className="grid gap-4">
        {logs.map(log => (
          <div key={log.id} className="bg-white border-l-4 border-red-500 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:shadow-md transition-shadow">
            
            <div className="flex items-start gap-4">
              <div className="bg-slate-100 p-4 rounded-lg flex-shrink-0">
                {log.type === 'UNKNOWN_FACE' ? <UserX className="w-8 h-8 text-slate-500" /> : <ShieldAlert className="w-8 h-8 text-red-500" />}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-800">{log.message}</h3>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase border border-red-200">
                    {log.severity}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {log.time}</span>
                  <span className="text-slate-300">|</span>
                  <span>{log.camera_id}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              {/* Vị trí render ảnh bằng chứng bị Kiosk chụp lại */}
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 flex items-center justify-center gap-2 text-sm text-slate-500 h-20 w-32 cursor-not-allowed">
                 <ImageOff className="w-5 h-5" /> Ảnh lỗi
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityLogs;
