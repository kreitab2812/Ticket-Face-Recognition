import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const CheckInGate = () => {
    const webcamRef = useRef(null);
    const wsRef = useRef(null);
    const [statusData, setStatusData] = useState({ status: 'idle', message: 'Dang cho quet khuon mat...' });

    // Ket noi WebSocket toi Backend
    useEffect(() => {
        // Luu y: Chinh lai IP neu chay tren mang LAN
        wsRef.current = new WebSocket('ws://localhost:4000/api/ws/scan');
        
        wsRef.current.onopen = () => console.log('[+] Ket noi WebSocket thanh cong');
        
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setStatusData(data); // Cap nhat giao dien (Xanh/Do)
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    // Ham chup anh va gui di moi 1 giay (tranh lam qua tai server)
    const captureAndSend = useCallback(() => {
        if (webcamRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                wsRef.current.send(imageSrc);
            }
        }
    }, [webcamRef]);

    useEffect(() => {
        const interval = setInterval(captureAndSend, 1000);
        return () => clearInterval(interval);
    }, [captureAndSend]);

    return (
        <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1>KIOSK CHECK-IN SU KIEN</h1>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    style={{ border: '5px solid #333', borderRadius: '10px' }}
                />
            </div>
            
            {/* Hien thi trang thai (Xanh = Hop le, Do = Ve cho den/Loi) */}
            <div style={{ 
                marginTop: '20px', 
                padding: '20px', 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: statusData.status === 'success' ? 'green' : (statusData.status === 'error' ? 'red' : 'gray') 
            }}>
                {statusData.message}
            </div>
        </div>
    );
};

export default CheckInGate;
