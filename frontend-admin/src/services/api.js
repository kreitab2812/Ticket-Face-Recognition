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
// KHOI ADMIN API
// ==========================================

export const getAttendees = async () => {
    try {
        const response = await apiClient.get('/admin/attendees');
        return response.data;
    } catch (error) {
        console.error("[-] Loi call API getAttendees:", error);
        throw error;
    }
};

export const getCheckInLogs = async () => {
    try {
        const response = await apiClient.get('/admin/logs');
        return response.data;
    } catch (error) {
        console.error("[-] Loi call API getCheckInLogs:", error);
        throw error;
    }
};

// Sau nay cau co API Thong ke Dashboard thi chi viec viet them vao day:
// export const getDashboardStats = async () => { ... }

export default apiClient;
