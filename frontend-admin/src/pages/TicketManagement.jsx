import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getAttendees } from '../services/api';

const TicketManagement = () => {
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-6 p-2">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Quan Ly Ve Su Kien</h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wider text-slate-500 font-medium">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Ten Khach Hang</th>
                                <th className="px-6 py-4">Ma Ve</th>
                                <th className="px-6 py-4">Trang Thai Check-in</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        Dang tai du lieu...
                                    </td>
                                </tr>
                            ) : attendees.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        Chua co du lieu khach hang.
                                    </td>
                                </tr>
                            ) : (
                                attendees.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-800 font-medium">#{a.id}</td>
                                        <td className="px-6 py-4 text-slate-700">{a.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-mono border border-slate-200">
                                                {a.ticket_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {a.is_checked_in ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                    Da vao cong
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                    Chua su dung
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
        </div>
    );
};

export default TicketManagement;
