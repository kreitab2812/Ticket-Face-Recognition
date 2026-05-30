import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, ImageOff, UserX, CheckCircle, AlertTriangle, ShieldCheck, Loader2, Camera, X, Eye, ShieldAlert as AlertIcon } from 'lucide-react';
import { getCheckInLogs } from '../services/api';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State phục vụ mở Pop-up chi tiết sự cố vi phạm
  const [selectedLog, setSelectedLog] = useState(null);

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
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const getLogDetails = (status) => {
    if (status.includes("Hợp lệ")) {
        return { type: "SUCCESS", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: ShieldCheck, severity: "Bình thường", sevClass: "bg-green-100 text-green-700", category: "Thông qua hợp lệ", desc: "Khách mời đã quét mặt trùng khớp sinh trắc học và check-in thành công." };
    } else if (status.includes("che tối") || status.includes("che khuất")) {
        return { type: "WARNING", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Camera, severity: "Cảnh báo Kiosk", sevClass: "bg-amber-100 text-amber-700", category: "Vô hiệu hóa Camera", desc: "Hệ thống phát hiện độ sáng sụt giảm nghiêm trọng, nghi ngờ có hành vi che khuất Webcam vật lý cố tình." };
    } else if (status.includes("Cảnh báo") || status.includes("Vé đã dùng")) {
        return { type: "CRITICAL", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: ShieldAlert, severity: "Báo động Đỏ", sevClass: "bg-red-100 text-red-700 animate-pulse", category: "Gian lận mã vé đen", desc: "Hệ thống phát hiện đối tượng cố tình sử dụng lại một mã định danh vé điện tử đã được kích hoạt từ trước." };
    } else {
        return { type: "UNKNOWN", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", icon: UserX, severity: "Cảnh báo ngầm", sevClass: "bg-slate-200 text-slate-700", category: "Sự cố không xác định", desc: "Hệ thống ghi nhận hành vi bất thường nằm ngoài danh mục cấu hình lõi." };
    }
  };

  return (
    <div className="space-y-6 p-8 h-full flex flex-col relative">
      
      {/* POP-UP MODAL PHÓNG TO PHÂN TÍCH TANG CHỨNG */}
      {selectedLog && (() => {
          const detailInfo = getLogDetails(selectedLog.status);
          const ModalIcon = detailInfo.icon;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertIcon className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-bold tracking-wide">Phân Tích Chi Tiết Sự Cố An Ninh</h3>
                        </div>
                        <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        
                        {/* Nhãn phân loại sự cố */}
                        <div className={`p-4 rounded-xl border ${detailInfo.border} ${detailInfo.bg} flex items-start gap-3`}>
                            <ModalIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${detailInfo.color}`} />
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-base mb-0.5">{detailInfo.category}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{detailInfo.desc}</p>
                            </div>
                        </div>

                        {/* Thông số kỹ thuật */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border text-sm font-medium">
                            <div>
                                <span className="text-slate-400 text-xs block mb-0.5 uppercase font-bold">Thời điểm ghi nhận</span>
                                <span className="text-slate-800 font-mono font-bold">{new Date(selectedLog.check_time).toLocaleString('vi-VN')}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-xs block mb-0.5 uppercase font-bold">Đối tượng liên đới</span>
                                <span className="text-slate-800 font-bold">
                                    {selectedLog.attendee_id ? `Khách mời ID: #${selectedLog.attendee_id}` : 'Đối tượng ẩn danh'}
                                </span>
                            </div>
                        </div>

                        {/* KHU VỰC PHÓNG TO TANG CHỨNG HÌNH ẢNH */}
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hình ảnh camera lập biên bản (Tang Chứng)</span>
                            <div className="w-full h-72 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-inner flex items-center justify-center relative group">
                                {selectedLog.image_url ? (
                                    <img src={selectedLog.image_url} alt="HD Tang Chứng" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center text-slate-500">
                                        <ImageOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <span className="font-bold text-sm">Hệ thống không thu thập dữ liệu ảnh cho sự cố này</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin thô */}
                        <div className="bg-slate-50 p-3 rounded-lg border font-mono text-xs text-slate-500 break-all">
                            <b>RAW_STATUS:</b> {selectedLog.status}
                        </div>

                    </div>

                    <div className="bg-slate-50 p-4 border-t flex justify-end">
                        <button onClick={() => setSelectedLog(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-colors shadow">Đóng Cửa Sổ</button>
                    </div>

                </div>
            </div>
          );
      })()}

      {/* TIÊU ĐỀ TRANG CHÍNH */}
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

      {/* DANH SÁCH NHẬT KÝ */}
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
                  onClick={() => setSelectedLog(log)} // Bấm vào bất cứ đâu trên thẻ để bung Pop-up phân tích
                  className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border ${details.border} ${details.bg} transition-all hover:shadow-md cursor-pointer group relative`}
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

                  {/* Nút mắt xem nhanh ở góc thẻ khi hover */}
                  <div className="absolute top-4 right-4 md:right-36 p-2 bg-white rounded-lg border shadow-sm transition-opacity opacity-0 group-hover:opacity-100 hidden md:block">
                      <Eye className="w-4 h-4 text-slate-600" />
                  </div>

                  <div className="flex-shrink-0 w-full md:w-auto flex items-center justify-center">
                    {log.image_url ? (
                        <div className="h-24 w-24 md:h-20 md:w-32 rounded-lg overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105 bg-slate-100">
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
