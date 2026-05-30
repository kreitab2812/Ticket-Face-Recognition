import axios from 'axios';

// Tao ra mot instance cua axios de dung chung cho toan bo du an
const apiClient = axios.create({
    baseURL: '/api', 
    headers: {
        'Content-Type': 'application/json', // Cái này tốt cho GET/DELETE, nhưng độc hại cho Upload File
    },
    timeout: 10000,
});

export const getAttendees = async () => {
    try {
        const response = await apiClient.get('/admin/attendees');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getCheckInLogs = async () => {
    try {
        const response = await apiClient.get('/admin/logs');
        return response.data;
    } catch (error) {
        throw error;
    }
};

// [FIX DỨT ĐIỂM LỖI 422 & LỖI TEXT/PLAIN]
export const addAttendee = async (formData) => {
    try {
        // Dùng thẳng axios gốc (không dùng apiClient) để browser tự do set Multipart Form-Data
        const response = await axios.post('/api/admin/add_attendee', formData);
        return response; 
    } catch (error) {
        throw error;
    }
};

export const deleteAttendeeApi = async (id) => {
    try {
        const response = await apiClient.delete(`/admin/attendee/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default apiClient;
