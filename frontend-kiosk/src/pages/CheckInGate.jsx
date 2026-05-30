import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { ShieldCheck, ShieldAlert, ScanFace, Loader2, CameraOff, WifiOff } from 'lucide-react';

const CheckInGate = () => {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  
  const canvasRef = useRef(document.createElement('canvas'));

  const isProcessingRef = useRef(false); 
  const isCooldownRef = useRef(false);
  const isFacePresentRef = useRef(false);
  const facePresentTimerRef = useRef(null);
  
  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('Đang kết nối tới hệ thống an ninh...');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // [TÁCH UI]: Toast đỏ góc màn hình dành riêng cho mất mạng
  const [sysError, setSysError] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setIsModelLoaded(true);
      } catch (e) {
        setSysError('Lỗi không thể tải được mô hình AI Kiosk!');
      }
    };
    loadModels();
  }, []);

  const startCooldown = (delayTime) => {
    isCooldownRef.current = true;
    isFacePresentRef.current = false;
    clearTimeout(facePresentTimerRef.current);
    
    setTimeout(() => {
      isCooldownRef.current = false;
      isProcessingRef.current = false;
      setStatus('idle');
      setMessage('Đang chờ quét khuôn mặt...');
    }, delayTime); 
  };

  const connectWebSocket = useCallback(() => {
    setSysError('');

    const wsUrl = `ws://${window.location.hostname}:8000/ws/scan`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setSysError('');
      setStatus('idle');
      setMessage('Đang chờ quét khuôn mặt...');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      let cooldownTime = 1500; 

      if (data.status === 'success') {
        setStatus('success');
        setMessage(`✅ ${data.message}`);
        cooldownTime = 3000; 
      } else if (data.status === 'error' && data.access === 'denied') {
        setStatus('denied');
        setMessage(`🚨 ${data.message}`);
        cooldownTime = 3000;
      } else if (data.status === 'error' || data.status === 'failed') { 
        setStatus('failed');
        setMessage(`❌ ${data.message || 'Không nhận diện được khuôn mặt.'}`);
      }
      
      startCooldown(cooldownTime);
    };

    wsRef.current.onclose = () => {
      setSysError('Mất kết nối đến Máy chủ AI. Đang thử lại...');
      setTimeout(connectWebSocket, 3000); 
    };

    wsRef.current.onerror = (error) => {
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
    const detectFaceLoop = async () => {
      if (!isModelLoaded || !webcamRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
      if (isProcessingRef.current || isCooldownRef.current) return;

      const video = webcamRef.current.video;
      if (video && video.readyState === 4) {
          
        const canvas = canvasRef.current;
        canvas.width = 64; canvas.height = 48; 
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        let sum = 0;
        for (let i = 0; i < imgData.length; i += 4) {
          sum += imgData[i] + imgData[i+1] + imgData[i+2];
        }
        const avgBrightness = sum / (imgData.length / 4 * 3);

        if (avgBrightness < 15) { 
           if (status !== 'covered') {
               setStatus('covered');
               setMessage('🚨 CẢNH BÁO: CAMERA BỊ CHE KHUẤT!');
               isFacePresentRef.current = false;
               clearTimeout(facePresentTimerRef.current);
               
               // [BẮN LOG TANG CHỨNG]
               const imageSrc = webcamRef.current?.getScreenshot();
               if (imageSrc) {
                   fetch(`http://${window.location.hostname}:8000/log_security`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ image_data: imageSrc, status: "Cảnh báo an ninh: Camera bị che tối" })
                   }).catch(e => console.error("Loi gui log:", e));
               }
           }
           return;
        } else if (status === 'covered') {
           setStatus('idle');
           setMessage('Đang chờ quét khuôn mặt...');
        }

        const faces = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }));

        if (faces.length > 0) {
          if (!isFacePresentRef.current) {
            isFacePresentRef.current = true;
            setStatus('detecting');
            setMessage('Đã phát hiện khuôn mặt, giữ nguyên 1.5 giây...');
            
            facePresentTimerRef.current = setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN && !isProcessingRef.current) {
                const imageSrc = webcamRef.current?.getScreenshot();
                if (imageSrc) {
                  isProcessingRef.current = true;
                  setStatus('processing');
                  setMessage('Đang trích xuất và đối chiếu dữ liệu...');
                  wsRef.current.send(imageSrc);
                } else {
                  isFacePresentRef.current = false;
                }
              } else {
                isFacePresentRef.current = false;
              }
            }, 1500);
          }
        } else {
          if (isFacePresentRef.current) {
            isFacePresentRef.current = false;
            clearTimeout(facePresentTimerRef.current);
            if (status === 'detecting' || status === 'idle') {
              setStatus('idle');
              setMessage('Đang chờ quét khuôn mặt...');
            }
          }
        }
      }
    };

    // [TĂNG TỐC UI]: Đẩy lên 200ms để bắt phản xạ cực nhanh
    const interval = setInterval(detectFaceLoop, 200);
    return () => clearInterval(interval);
  }, [isModelLoaded, status]);

  let borderColor = 'border-blue-500';
  let bgColor = 'bg-slate-900';
  let Icon = ScanFace;
  let iconColor = 'text-blue-400';

  if (status === 'success') {
    borderColor = 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]';
    bgColor = 'bg-green-950';
    Icon = ShieldCheck;
    iconColor = 'text-green-500';
  } else if (status === 'failed') {
    borderColor = 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.7)]';
    bgColor = 'bg-red-950';
    Icon = ShieldAlert;
    iconColor = 'text-red-500';
  } else if (status === 'denied') {
    borderColor = 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.9)]';
    bgColor = 'bg-red-900';
    Icon = ShieldAlert;
    iconColor = 'text-white';
  } else if (status === 'covered') {
    borderColor = 'border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]';
    bgColor = 'bg-yellow-950';
    Icon = CameraOff;
    iconColor = 'text-yellow-500';
  } else if (status === 'detecting' || status === 'processing') {
    borderColor = 'border-yellow-400';
    Icon = Loader2;
    iconColor = 'text-yellow-400 animate-spin';
  } else if (!isModelLoaded) {
    borderColor = 'border-orange-500';
    Icon = Loader2;
    iconColor = 'text-orange-500 animate-spin';
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${bgColor}`}>
      
      {/* BANNER THÔNG BÁO LỖI HỆ THỐNG */}
      {sysError && (
        <div className="fixed top-6 right-6 bg-red-600/90 backdrop-blur text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border border-red-400 z-50 font-bold tracking-wide">
          <WifiOff className="w-6 h-6" /> {sysError}
        </div>
      )}

      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold text-white tracking-wider mb-2">KIOSK CHECK-IN SỰ KIỆN</h1>
        <p className="text-slate-400">Vui lòng nhìn thẳng vào camera 1.5 giây để xác thực</p>
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

      {/* THANH TRẠNG THÁI TRUNG TÂM */}
      <div className="mt-8 bg-slate-800/80 backdrop-blur px-8 py-4 rounded-full flex items-center gap-4 border border-slate-700 shadow-xl transition-all duration-300">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <span className={`text-xl font-bold ${status === 'denied' ? 'text-red-400 uppercase' : 'text-white'}`}>{message}</span>
      </div>
    </div>
  );
};

export default CheckInGate;
