import axios from 'axios';

// Tao ra mot instance cua axios de dung chung cho toan bo du an
const apiClient = axios.create({
    // Nho Nginx da proxy /api/ qua cho backend, nen ta chi can dung base URL nay
    baseURL: '/api', 
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Timeout neu server backend khong tra loi sau 10 giay
});

// ==========================================
// KHOI ADMIN API - QUẢN LÝ DỮ LIỆU
// ==========================================

// Lấy danh sách khách mời
export const getAttendees = async () => {
    try {
        const response = await apiClient.get('/admin/attendees');
        return response.data;
    } catch (error) {
        console.error("[-] Loi call API getAttendees:", error);
        throw error;
    }
};

// Lấy lịch sử log an ninh/check-in
export const getCheckInLogs = async () => {
    try {
        const response = await apiClient.get('/admin/logs');
        return response.data;
    } catch (error) {
        console.error("[-] Loi call API getCheckInLogs:", error);
        throw error;
    }
};

// ==========================================
// KHOI ADMIN API - THAO TÁC HÀNH ĐỘNG
// ==========================================

// API: Thêm khách mời mới (Hỗ trợ upload File ảnh)
export const addAttendee = async (formData) => {
    try {
        // Ghi đè header Content-Type thành multipart/form-data cho riêng API này để gửi được File
        const response = await apiClient.post('/admin/add_attendee', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    } catch (error) {
        console.error("[-] Loi call API addAttendee:", error);
        throw error;
    }
};

// API: Xóa khách mời (Quyền sinh sát của Admin)
export const deleteAttendeeApi = async (id) => {
    try {
        const response = await apiClient.delete(`/admin/attendee/${id}`);
        return response.data;
    } catch (error) {
        console.error(`[-] Loi call API deleteAttendeeApi (${id}):`, error);
        throw error;
    }
};

export default apiClient;
