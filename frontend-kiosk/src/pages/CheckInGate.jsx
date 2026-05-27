import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ShieldCheck, ShieldAlert, ScanFace, Loader2 } from 'lucide-react';

const CheckInGate = () => {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const isProcessingRef = useRef(false); 
  
  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('Dang ket noi toi he thong an ninh...');

  const connectWebSocket = useCallback(() => {
    setStatus('connecting');
    setMessage('Dang thiet lap duong truyen...');

    // Tu dong lay IP host cua mang hien tai, khong fix cung localhost
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/scan`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ Da thong duong ong WebSocket!');
      setStatus('idle');
      setMessage('Dang cho quet khuon mat...');
    };

    wsRef.current.onmessage = (event) => {
      isProcessingRef.current = false; // Mo khoa cho phep gui anh tiep theo
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
        setStatus('idle');
        setMessage('Dang cho quet khuon mat...');
      }
    };

    wsRef.current.onclose = () => {
      setStatus('connecting');
      setMessage('Mat ket noi den May chu. Dang thu lai...');
      setTimeout(connectWebSocket, 3000); // Tu dong thu ket noi lai sau 3 giay
    };

    wsRef.current.onerror = (error) => {
      console.error('[-] Loi WebSocket:', error);
      wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  useEffect(() => {
    const captureInterval = setInterval(() => {
      // Co che chong spam: Chi gui anh khi ong nuoc mo VA khong co anh nao dang xu ly
      if (wsRef.current?.readyState === WebSocket.OPEN && !isProcessingRef.current && status === 'idle') {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          isProcessingRef.current = true; // Khoa trang thai
          wsRef.current.send(imageSrc);
        }
      }
    }, 1500); 

    return () => clearInterval(captureInterval);
  }, [status]);

  const resetAfterDelay = () => {
    setTimeout(() => {
      setStatus('idle');
      setMessage('Dang cho quet khuon mat...');
    }, 3000);
  };

  // UI Setup bang Tailwind CSS
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
        <h1 className="text-4xl font-bold text-white tracking-wider mb-2">KIOSK CHECK-IN SU KIEN</h1>
        <p className="text-slate-400">Vui long nhin thang vao camera de xac thuc</p>
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

      <div className="mt-8 bg-slate-800/80 backdrop-blur px-8 py-4 rounded-full flex items-center gap-4 border border-slate-700">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <span className="text-xl font-medium text-white">{message}</span>
      </div>
    </div>
  );
};

export default CheckInGate;
