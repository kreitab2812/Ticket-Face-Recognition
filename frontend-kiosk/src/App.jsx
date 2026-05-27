import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { ShieldCheck, ShieldAlert, ScanFace } from 'lucide-react';

export default function App() {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [message, setMessage] = useState('Đang kết nối tới hệ thống an ninh...');

  // 1. Khởi tạo đường ống WebSocket ngay khi mở web
  useEffect(() => {
    // Tự động nhận diện domain đang chạy (localhost:4000)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/scan`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ Đã thông đường ống WebSocket!');
      setMessage('Đang chờ quét khuôn mặt...');
    };

    // 2. Lắng nghe Backend trả kết quả Đỏ/Xanh qua ống nước
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'success') {
        setStatus('success');
        setMessage(`✅ ${data.message}`);
        resetAfterDelay();
      } else if (data.status === 'error' && data.access === 'denied') {
        setStatus('error');
        setMessage(`🚨 ${data.message}`);
        resetAfterDelay();
      } else if (data.status === 'error') {
        setStatus('error');
        setMessage(`❌ ${data.message}`);
        resetAfterDelay();
      }
      // Nếu data.status === 'idle' (không thấy mặt), web tự hiểu là im lặng quét tiếp
    };

    wsRef.current.onclose = () => {
      setMessage('Mất kết nối tới máy chủ. Vui lòng tải lại trang.');
      setStatus('error');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const resetAfterDelay = () => {
    setTimeout(() => {
      setStatus('idle');
      setMessage('Đang chờ quét khuôn mặt...');
    }, 3000);
  };

  // 3. Vòng lặp bơm ảnh vào ống nước (Mỗi 1 giây)
  useEffect(() => {
    const interval = setInterval(() => {
      // Chỉ gửi ảnh khi WebSocket đã mở VÀ hệ thống đang rảnh (idle)
      if (status === 'idle' && wsRef.current?.readyState === WebSocket.OPEN) {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          // Bơm thẳng Base64 qua WebSocket, không cần FormData
          wsRef.current.send(imageSrc); 
        }
      }
    }, 1000); 

    return () => clearInterval(interval);
  }, [status]);

  // UI Render (Giữ nguyên giao diện Cyberpunk)
  let borderColor = 'border-blue-500';
  let bgColor = 'bg-slate-900';
  let Icon = ScanFace;
  let iconColor = 'text-blue-500';

  if (status === 'success') {
    borderColor = 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]';
    bgColor = 'bg-green-950';
    Icon = ShieldCheck;
    iconColor = 'text-green-500';
  } else if (status === 'error') {
    borderColor = 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.7)]';
    bgColor = 'bg-red-950';
    Icon = ShieldAlert;
    iconColor = 'text-red-500';
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${bgColor}`}>
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold text-white tracking-wider mb-2">HỆ THỐNG KIỂM SOÁT AN NINH</h1>
        <p className="text-slate-400">Vui lòng nhìn thẳng vào camera để xác thực vé</p>
      </div>

      <div className={`relative rounded-2xl overflow-hidden border-4 transition-all duration-300 ${borderColor}`}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-[800px] h-[600px] object-cover mirrored"
          style={{ transform: 'scaleX(-1)' }}
        />
        <div className="absolute inset-0 pointer-events-none border-[100px] border-black/40">
           <div className={`w-full h-full border-2 border-dashed ${iconColor} opacity-50`}></div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 bg-slate-800/80 px-8 py-4 rounded-xl border border-slate-700 backdrop-blur-sm">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <span className={`text-xl font-semibold text-white`}>{message}</span>
      </div>
    </div>
  );
}
