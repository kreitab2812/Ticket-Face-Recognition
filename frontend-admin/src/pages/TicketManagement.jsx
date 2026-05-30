import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, Clock, Trash2, Image as ImageIcon, Search, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAttendees, deleteAttendeeApi } from '../services/api';

const TicketManagement = () => {
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); 
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAttendees = async () => {
        try {
            const data = await getAttendees(); 
            setAttendees(data);
        } catch (err) {
            console.error("[-] Khong the tai danh sach khach hang.");
            toast.error("Lỗi mất kết nối với Server!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendees();
        // Tự động làm mới danh sách mỗi 10 giây để bắt trạng thái Check-in Live
        const interval = setInterval(fetchAttendees, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async () => {
        try {
            await deleteAttendeeApi(selectedUser.id);
            setAttendees(prev => prev.filter(a => a.id !== selectedUser.id));
            toast.success(`Đã xóa toàn bộ dữ liệu của ${selectedUser.name}`);
            setShowDeleteConfirm(false);
            setSelectedUser(null);
        } catch (error) {
            toast.error("Không thể xóa khách mời này. Vui lòng kiểm tra lại Server!");
        }
    };

    // Lọc tìm kiếm
    const filteredAttendees = attendees.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.ticket_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-8 relative h-full flex flex-col">
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-100">
                        <div className="flex items-center gap-4 mb-4 text-red-600">
                            <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="w-8 h-8" /></div>
                            <h3 className="text-2xl font-bold">Cảnh báo nghiêm trọng</h3>
                        </div>
                        <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn xóa hồ sơ của <b>{selectedUser?.name}</b>? Toàn bộ dữ liệu sinh trắc học và lịch sử check-in sẽ bị xóa vĩnh viễn.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Hủy Bỏ</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-colors">Xác Nhận Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
                        <Users className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Quản Lý Khách Mời</h2>
                        <p className="text-slate-500 font-medium">Hồ sơ định danh và dữ liệu sinh trắc học</p>
                    </div>
                </div>
                
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm Tên hoặc Mã vé..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium w-72"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1 p-2">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-sm font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                                <th className="p-4 rounded-tl-xl">Khách Mời</th>
                                <th className="p-4">Mã Vé / ID</th>
                                <th className="p-4">Trạng Thái Kiosk</th>
                                <th className="p-4">TG Đăng Ký</th>
                                <th className="p-4 text-right rounded-tr-xl">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Đang tải dữ liệu...</td></tr>
                            ) : filteredAttendees.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Chưa có dữ liệu khách mời nào.</td></tr>
                            ) : (
                                filteredAttendees.map(attendee => (
                                    <tr key={attendee.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                    {attendee.image_url ? (
                                                        <img src={attendee.image_url} alt={attendee.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-800 text-base">{attendee.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-blue-600 bg-blue-50/30 rounded-lg">{attendee.ticket_code}</td>
                                        <td className="p-4">
                                            {attendee.is_checked_in ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-green-100 text-green-700 border border-green-200">
                                                    <CheckCircle className="w-4 h-4" /> Đã Vào Cửa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    <Clock className="w-4 h-4" /> Chờ Check-in
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-500 font-medium text-sm">
                                            {new Date(attendee.created_at).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => { setSelectedUser(attendee); setShowDeleteConfirm(true); }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Xóa hồ sơ"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TicketManagement;
