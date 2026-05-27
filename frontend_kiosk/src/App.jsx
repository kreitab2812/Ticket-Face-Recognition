import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ShieldCheck, ShieldAlert, ScanFace } from 'lucide-react';
import axios from 'axios';

export default function App() {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [message, setMessage] = useState('Đang chờ quét khuôn mặt...');
  const [isProcessing, setIsProcessing] = useState(false);

  const captureAndSend = useCallback(async () => {
    if (isProcessing || status !== 'idle') return;

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    // Chuyển base64 thành Blob (File) để gửi đi
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    
    const formData = new FormData();
    formData.append('file_rgb', blob, 'capture.jpg');

    try {
      setIsProcessing(true);
      
      const response = await axios.post('/api/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;

      if (data.status === 'success' && data.access === 'granted') {
        setStatus('success');
        setMessage(`✅ ${data.message}`);
      } else if (data.status === 'success' && data.access === 'denied') {
        setStatus('error');
        setMessage(`🚨 ${data.message}`);
      } else if (data.status === 'denied') {
        setStatus('error');
        setMessage(`❌ ${data.message}`);
      } else {
        // Lỗi vặt (không thấy mặt), bỏ qua để quét tiếp
        setIsProcessing(false);
        return;
      }

      // Giữ thông báo 3 giây rồi reset
      setTimeout(() => {
        setStatus('idle');
        setMessage('Đang chờ quét khuôn mặt...');
        setIsProcessing(false);
      }, 3000);

    } catch (error) {
      console.error("Lỗi API:", error);
      setIsProcessing(false);
    }
  }, [isProcessing, status]);

  // Vòng lặp quét tự động mỗi 2 giây
  useEffect(() => {
    const interval = setInterval(captureAndSend, 2000);
    return () => clearInterval(interval);
  }, [captureAndSend]);

  // Xử lý giao diện dựa trên trạng thái (status)
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

      {/* Khung Camera */}
      <div className={`relative rounded-2xl overflow-hidden border-4 transition-all duration-300 ${borderColor}`}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-[800px] h-[600px] object-cover mirrored"
          style={{ transform: 'scaleX(-1)' }} // Lật camera như gương
        />
        
        {/* Lớp mờ Bounding Box */}
        <div className="absolute inset-0 pointer-events-none border-[100px] border-black/40">
           <div className={`w-full h-full border-2 border-dashed ${iconColor} opacity-50`}></div>
        </div>
      </div>

      {/* Bảng thông báo */}
      <div className="mt-8 flex items-center gap-4 bg-slate-800/80 px-8 py-4 rounded-xl border border-slate-700 backdrop-blur-sm">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <span className={`text-xl font-semibold text-white`}>{message}</span>
      </div>

      <div className="absolute top-4 right-4">
        <a href="/admin.html" className="text-slate-400 hover:text-white text-sm underline">
          Quản trị hệ thống
        </a>
      </div>
    </div>
  );
}
