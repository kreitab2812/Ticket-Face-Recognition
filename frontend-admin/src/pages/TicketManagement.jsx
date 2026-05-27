import React, { useState, useEffect } from 'react';

const TicketManagement = () => {
    const [attendees, setAttendees] = useState([]);

    // Goi API lay danh sach khach hang
    const fetchAttendees = async () => {
        try {
            const res = await fetch('/api/admin/attendees');
            const data = await res.json();
            setAttendees(data);
        } catch (err) {
            console.error("[-] Loi lay du lieu:", err);
        }
    };

    useEffect(() => {
        fetchAttendees();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>QUAN LY VE SU KIEN (ADMIN PORTAL)</h2>
            <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f4f4f4' }}>
                    <tr>
                        <th>ID</th>
                        <th>Ten Khach Hang</th>
                        <th>Ma Ve</th>
                        <th>Trang Thai Check-in</th>
                    </tr>
                </thead>
                <tbody>
                    {attendees.map(a => (
                        <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.name}</td>
                            <td>{a.ticket_code}</td>
                            <td style={{ color: a.is_checked_in ? 'green' : 'orange', fontWeight: 'bold' }}>
                                {a.is_checked_in ? 'Da vao cong' : 'Chua su dung'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TicketManagement;
