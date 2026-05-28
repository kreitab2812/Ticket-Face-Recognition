import React, { useState, useEffect } from 'react';
import { Users, X, Image as ImageIcon, CheckCircle, Clock, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAttendees, deleteAttendeeApi } from '../services/api';

const TicketManagement = () => {
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); 
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State cho modal xoa

    const fetchAttendees = async () => {
        try {
            const data = await getAttendees(); 
            setAttendees(data);
        } catch (err) {
            console.error("[-] Khong the tai danh sach khach hang.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendees();
    }, []);

    const handleDelete = async () => {
        try {
        // GỌI API XÓA THỰC TẾ
        await deleteAttendeeApi(selectedUser.id);
        
        setAttendees(prev => prev.filter(a => a.id !== selectedUser.id));
        toast.success(`Đã xóa toàn bộ dữ liệu của ${selectedUser.name}`);
        setShowDeleteConfirm(false);
        setSelectedUser(null);
    } catch (error) {
        toast.error("Không thể xóa khách mời này. Vui lòng kiểm tra lại Server!");
    }
};

    return (
        <div className="space-y-6 p-8 relative h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
                    <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Danh Sách Khách Mời</h2>
                    <p className="text-slate-500">Quản lý và đối chiếu thông tin check-in</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-6 py-5">ID</th>
                                <th className="px-6 py-5">Tên Khách Hàng</th>
                                <th className="px-6 py-5">Mã Vé</th>
                                <th className="px-6 py-5">Trạng Thái Check-in</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : attendees.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500">Chưa có dữ liệu khách hàng.</td></tr>
                            ) : (
                                attendees.map(a => (
                                    <tr key={a.id} onClick={() => setSelectedUser(a)} className="hover:bg-blue-50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 text-slate-400 font-medium">#{a.id}</td>
                                        <td className="px-6 py-4 text-slate-800 font-semibold group-hover:text-blue-600 transition-colors">{a.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-mono border border-slate-200">{a.ticket_code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {a.is_checked_in ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Đã vào cổng
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Chưa sử dụng
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL HỒ SƠ */}
            {selectedUser && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Hồ Sơ Đối Chiếu An Ninh</h3>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            <div className="flex-1 p-8 bg-white flex flex-col justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Ảnh Gốc (Lúc Đăng Ký)</div>
                                    <div className="aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden mb-6">
                                        {selectedUser.original_image_url ? <img src={selectedUser.original_image_url} alt="Goc" className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Chưa load được ảnh gốc</p></div>}
                                    </div>
                                    <div className="space-y-4">
                                        <div><p className="text-sm text-slate-500 font-medium mb-1">Họ và Tên</p><p className="text-lg font-bold text-slate-800">{selectedUser.name}</p></div>
                                        <div><p className="text-sm text-slate-500 font-medium mb-1">Mã Vé Cấp Phát</p><span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-mono border border-slate-200">{selectedUser.ticket_code}</span></div>
                                    </div>
                                </div>
                                {/* NÚT XÓA KHÁCH HÀNG */}
                                <button onClick={() => setShowDeleteConfirm(true)} className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                                    <Trash2 className="w-5 h-5" /> Gỡ bỏ Khách mời này
                                </button>
                            </div>

                            <div className="flex-1 p-8 bg-slate-50">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Ghi Nhận Tại Kiosk</div>
                                <div className={`aspect-square rounded-2xl border-4 flex items-center justify-center overflow-hidden mb-6 bg-white ${selectedUser.is_checked_in ? 'border-green-400' : 'border-slate-200'}`}>
                                    {selectedUser.is_checked_in ? (selectedUser.evidence_image_url ? <img src={selectedUser.evidence_image_url} alt="Check-in" className="w-full h-full object-cover" /> : <div className="text-center text-green-600"><CheckCircle className="w-16 h-16 mx-auto mb-2 opacity-80" /><p className="font-bold">ĐÃ XÁC THỰC</p></div>) : <div className="text-center text-slate-400"><Clock className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="font-medium text-slate-500">Khách Chưa Đến</p></div>}
                                </div>
                                {selectedUser.is_checked_in && (
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Thời gian qua cửa</p>
                                        <p className="text-lg font-bold text-green-800">{selectedUser.checkin_time ? new Date(selectedUser.checkin_time).toLocaleString('vi-VN') : "Đã Check-in"}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CẢNH BÁO XÓA (Xác nhận lớp 2) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-100">
                        <div className="flex items-center gap-4 mb-4 text-red-600">
                            <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="w-8 h-8" /></div>
                            <h3 className="text-2xl font-bold">Cảnh báo nghiêm trọng</h3>
                        </div>
                        <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa hồ sơ của <b>{selectedUser?.name}</b>? Toàn bộ dữ liệu sinh trắc học và lịch sử check-in sẽ bị xóa vĩnh viễn khỏi két sắt Qdrant và cơ sở dữ liệu.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Hủy Bỏ</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-colors">Xác Nhận Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketManagement;
