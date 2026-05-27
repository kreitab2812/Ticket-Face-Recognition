import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ShieldCheck, ShieldAlert, ScanFace, Loader2 } from 'lucide-react';

export default function App() {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const isProcessingRef = useRef(false); // Khoa trang thai de chong spam AI
  
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error', 'connecting'
  const [message, setMessage] = useState('Dang ket noi toi he thong an ninh...');

  const connectWebSocket = useCallback(() => {
    setStatus('connecting');
    setMessage('Dang thiet lap duong truyen WebSocket...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/scan`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ Da thong duong ong WebSocket!');
      setStatus('idle');
      setMessage('Dang cho quet khuon mat...');
    };

    wsRef.current.onmessage = (event) => {
      // Nhieu duoc ket qua tu Backend -> Mo khoa de cho phep gui anh tiep theo
      isProcessingRef.current = false; 
      
      const data = JSON.parse(event.data);
      
      if (data.status === 'success') {
        setStatus('success');
        setMessage(`✅ ${data.message}`);
        resetAfterDelay();
      } else if (data.status === 'error' && data.access === 'denied') {
        setStatus('error');
        setMessage(`🚨 ${data.message}`);
        resetAfterDelay();
      } else if (data.status === 'idle') {
        // Khong tim thay mat, cho phep quet tiep luon
        setStatus('idle');
        setMessage('Dang cho quet khuon mat...');
      }
    };

    wsRef.current.onclose = () => {
      console.log('❌ Mat ket noi WebSocket. Thu ket noi lai sau 3 giay...');
      setStatus('connecting');
      setMessage('Mat ket noi den May chu. Dang thu lai...');
      // Tu dong ket noi lai sau 3 giay neu mang bi rot
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('[-] Loi WebSocket:', error);
      wsRef.current.close();
    };
  }, []);

  // Khoi tao WebSocket lan dau tien
  useEffect(() => {
    connectWebSocket();
    
    // Don dep khi tat component
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Vong lap chup anh gui len Backend
  useEffect(() => {
    const captureInterval = setInterval(() => {
      // CHI GUI ANH KHI: Tuyen cap dang mo VA khong co buc anh nao dang bi ket lai cho AI xu ly
      if (wsRef.current?.readyState === WebSocket.OPEN && !isProcessingRef.current && status === 'idle') {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          isProcessingRef.current = true; // Khoa lai khong cho gui nua
          wsRef.current.send(imageSrc);
        }
      }
    }, 1500); // Cu 1.5 giay chup 1 lan

    return () => clearInterval(captureInterval);
  }, [status]);

  // Ham reset giao dien sau khi hien thi thong bao Xanh/Do
  const resetAfterDelay = () => {
    setTimeout(() => {
      setStatus('idle');
      setMessage('Dang cho quet khuon mat...');
    }, 3000); // Hien thi canh bao trong 3 giay roi tro lai binh thuong
  };

  // UI Setup (Giu nguyen bo cuc cua cau, chi them mau sac cho trang thai connecting)
  let borderColor = 'border-blue-500';
  let bgColor = 'bg-slate-900';
  let Icon = ScanFace;
  let iconColor = 'text-blue-400';

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
  } else if (status === 'connecting') {
    borderColor = 'border-orange-500';
    Icon = Loader2;
    iconColor = 'text-orange-500 animate-spin';
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${bgColor}`}>
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold text-white tracking-wider mb-2">HE THONG KIEM SOAT AN NINH</h1>
        <p className="text-slate-400">Vui long nhin thang vao camera de xac thuc ve</p>
      </div>

      <div className={`relative rounded-2xl overflow-hidden border-4 transition-all duration-300 ${borderColor}`}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-[800px] h-[600px] object-cover mirrored"
          style={{ transform: 'scaleX(-1)' }} // Lat nguoc camera cho giong guong
        />
        <div className="absolute inset-0 pointer-events-none border-[100px] border-black/40">
           <div className={`w-full h-full border-2 border-dashed ${iconColor} opacity-50`}></div>
        </div>
      </div>

      <div className="mt-8 bg-slate-800/80 backdrop-blur px-8 py-4 rounded-full flex items-center gap-4 border border-slate-700">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <span className="text-xl font-medium text-white">{message}</span>
      </div>
    </div>
  );
}
