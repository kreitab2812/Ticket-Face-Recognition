import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { ShieldCheck, ShieldAlert, ScanFace, Loader2, Settings, User, EyeOff, Users, Moon, ScanEye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Hàm tính khoảng cách giữa 2 điểm (Toán học Euclid)
const euclideanDist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

// Hàm tính tỷ lệ mở mắt (EAR - Eye Aspect Ratio)
const getEAR = (eye) => {
  const d1 = euclideanDist(eye[1], eye[5]);
  const d2 = euclideanDist(eye[2], eye[4]);
  const d3 = euclideanDist(eye[0], eye[3]);
  return (d1 + d2) / (2.0 * d3);
};

export default function App() {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  
  // Refs quan ly logic ngam
  const isProcessingRef = useRef(false); 
  const cooldownRef = useRef(false);
  const lastActiveTimeRef = useRef(Date.now()); // Dem gio de ngu dong
  const blinkStateRef = useRef('open'); // Theo doi mat dang mo hay nham
  const hasBlinkedRef = useRef(false); // Xac nhan da chop mat thanh cong chua
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState('loading_model'); 
  const [message, setMessage] = useState('Đang tải bộ não AI (Vui lòng chờ)...');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [attendee, setAttendee] = useState(null);
  const [faceBox, setFaceBox] = useState(null); 

  // 1. TẢI CẢ MODEL KHUÔN MẶT LẪN MODEL ĐIỂM NEO (MẮT/MŨI/MIỆNG)
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL) // Tai them mang luoi phan tich mat
        ]);
        setIsModelLoaded(true);
        setStatus('connecting');
        setMessage('Đang thiết lập kết nối an ninh...');
      } catch (error) {
        toast.error('Lỗi tải Model AI. Vui lòng kiểm tra mạng!');
      }
    };
    loadModels();
  }, []);

  // 2. ĐỒNG HỒ REAL-TIME
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. KẾT NỐI WEBSOCKET NHƯ CŨ
  const connectWebSocket = useCallback(() => {
    if (!isModelLoaded) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/scan`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setStatus('idle'); setMessage('Hệ thống sẵn sàng. Vui lòng nhìn thẳng');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'success') {
        setStatus('success'); setMessage(data.message); setFaceBox(null); 
        const guestName = data.message.replace('Hop le: Xin chao ', '');
        setAttendee({ name: guestName || 'Khách VIP', ticket: 'VIP-ACCESS', time: new Date().toLocaleTimeString() });
        triggerCooldown(); 
      } 
      else if (data.status === 'error' && data.access === 'denied') {
        setStatus('error'); setMessage(data.message); setFaceBox(null);
        toast.error(`Từ chối truy cập: ${data.message}`, { position: 'top-left', duration: 5000 });
        triggerCooldown();
      } 
      else if (data.status === 'idle') {
        toast.error('Người lạ (Không tìm thấy dữ liệu)', { position: 'top-left' });
        isProcessingRef.current = false; 
        setStatus('idle'); setMessage('Vui lòng thử lại...');
      } 
      else if (data.status === 'error') {
        toast.error(`Lỗi hệ thống: ${data.message}`, { position: 'top-left' });
        isProcessingRef.current = false; setStatus('idle');
      }
    };

    wsRef.current.onclose = () => {
      setStatus('connecting');
      setTimeout(connectWebSocket, 5000);
    };
  }, [isModelLoaded]);

  useEffect(() => {
    connectWebSocket(); return () => { if (wsRef.current) wsRef.current.close(); };
  }, [connectWebSocket]);

  // HÀM RESET MỌI THỨ SAU KHI QUÉT XONG
  const triggerCooldown = () => {
    cooldownRef.current = true;
    setTimeout(() => {
      setStatus('idle');
      setMessage('Hệ thống sẵn sàng. Vui lòng nhìn thẳng');
      setAttendee(null); 
      cooldownRef.current = false;
      isProcessingRef.current = false;
      hasBlinkedRef.current = false; // Reset chop mat
      blinkStateRef.current = 'open';
      lastActiveTimeRef.current = Date.now();
    }, 4000); 
  };

  // ĐÁNH THỨC KIOSK KHI CHẠM
  const wakeUpKiosk = () => {
    if (status === 'sleeping') {
      lastActiveTimeRef.current = Date.now();
      setStatus('idle');
      setMessage('Hệ thống sẵn sàng. Vui lòng nhìn thẳng');
    }
  };

  // 4. VÒNG LẶP MẮT THẦN (AI SCANNER + LIVENESS + SLEEP MODE)
  useEffect(() => {
    if (!isModelLoaded || status === 'connecting' || status === 'loading_model') return;

    const scanInterval = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4 || isProcessingRef.current || cooldownRef.current) return;

      // KIỂM TRA NGỦ ĐÔNG (30s không ai tương tác)
      if (Date.now() - lastActiveTimeRef.current > 30000) {
        if (status !== 'sleeping') setStatus('sleeping');
      }

      // QUÉT KHUÔN MẶT CÓ TÍCH HỢP LẤY 68 ĐIỂM (LANDMARKS)
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      const faces = await faceapi.detectAllFaces(video, options).withFaceLandmarks(true);

      if (faces.length > 0) {
        lastActiveTimeRef.current = Date.now(); // Co nguoi -> Reset dong ho ngu dong
        if (status === 'sleeping') {
          setStatus('idle'); setMessage('Hệ thống sẵn sàng. Vui lòng nhìn thẳng');
        }
      }

      if (status === 'sleeping') return;

      // KIỂM TRA BỊ CHE CAMERA (Đo độ sáng)
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 64, 48);
      const imageData = ctx.getImageData(0, 0, 64, 48).data;
      let sum = 0;
      for (let i = 0; i < imageData.length; i += 4) sum += (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
      if ((sum / (64 * 48)) < 15) { 
        setStatus('blocked'); setMessage('Camera đang bị che khuất!'); setFaceBox(null); return;
      }

      if (faces.length > 1) {
        setStatus('multiple'); setMessage('Vui lòng đứng một mình!'); setFaceBox(null); return;
      }

      if (faces.length === 0) {
        setStatus('idle'); setMessage('Vui lòng nhìn thẳng vào Camera'); setFaceBox(null); 
        hasBlinkedRef.current = false; 
        blinkStateRef.current = 'open';
        return;
      }

      // LOGIC XỬ LÝ 1 MẶT
      const face = faces[0];
      const box = face.detection.box;
      setFaceBox({ x: 800 - box.x - box.width, y: box.y, width: box.width, height: box.height });

      if (box.width < 120) {
        setStatus('idle'); setMessage('Vui lòng tiến lại gần Camera hơn...');
        return;
      }

      // ================= LIVENESS DETECTION (PHÁT HIỆN CHỚP MẮT) =================
      if (!hasBlinkedRef.current) {
        setStatus('waiting_blink');
        setMessage('Xác thực người thật: VUI LÒNG CHỚP MẮT!');
        
        const leftEye = face.landmarks.getLeftEye();
        const rightEye = face.landmarks.getRightEye();
        const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

        if (ear < 0.25) {
          blinkStateRef.current = 'closed';
        } 
        else if (ear > 0.3 && blinkStateRef.current === 'closed') {
          hasBlinkedRef.current = true;
          blinkStateRef.current = 'open';
        }
        return; 
      }
      // =========================================================================

      // NẾU ĐÃ CHỚP MẮT XONG -> BẮT ĐẦU GỬI ẢNH QUA WEBSOCKET
      if (hasBlinkedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          isProcessingRef.current = true; 
          setStatus('scanning');
          setMessage('Đang trích xuất sinh trắc học...');
          wsRef.current.send(imageSrc);
        }
      }

    }, 200); 

    return () => clearInterval(scanInterval);
  }, [isModelLoaded, status]);

  // ================= BỐ CỤC GIAO DIỆN (NỀN TRẮNG SÁNG CỦA CẬU ĐÂY) =================
  let borderColor = 'border-slate-300';
  let bgColor = 'bg-white'; // Màn hình chính mặc định là màu trắng
  let Icon = ScanFace;
  let iconColor = 'text-blue-500';

  if (status === 'success') {
    borderColor = 'border-green-400 shadow-[0_0_50px_rgba(34,197,94,0.3)]'; bgColor = 'bg-green-50'; Icon = ShieldCheck; iconColor = 'text-green-500';
  } else if (status === 'error') {
    borderColor = 'border-red-400 shadow-[0_0_50px_rgba(220,38,38,0.3)]'; bgColor = 'bg-red-50'; Icon = ShieldAlert; iconColor = 'text-red-500';
  } else if (status === 'blocked') {
    borderColor = 'border-orange-400 border-dashed'; Icon = EyeOff; iconColor = 'text-orange-500';
  } else if (status === 'multiple') {
    borderColor = 'border-yellow-400'; Icon = Users; iconColor = 'text-yellow-500';
  } else if (status === 'scanning') {
    borderColor = 'border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.3)]'; Icon = Loader2; iconColor = 'text-blue-500 animate-spin';
  } else if (status === 'waiting_blink') {
    borderColor = 'border-cyan-400 border-dashed shadow-[0_0_40px_rgba(6,182,212,0.3)]'; Icon = ScanEye; iconColor = 'text-cyan-500 animate-bounce';
  }

  return (
    <div onClick={wakeUpKiosk} className={`relative min-h-screen flex flex-col items-center justify-center transition-colors duration-700 overflow-hidden ${bgColor}`}>
      <Toaster toastOptions={{ className: 'bg-slate-800 text-white border border-slate-700', style: { backdropFilter: 'blur(8px)' } }} />

      {/* MÀN HÌNH NGỦ ĐÔNG (Vẫn giữ nền đen cho đỡ tốn pin và tạo sự tương phản khi thức) */}
      <div className={`absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-1000 ${status === 'sleeping' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
         <Moon className="w-24 h-24 text-slate-500 animate-pulse mb-8" />
         <h1 className="text-5xl font-bold text-white tracking-widest mb-4">KIOSK ĐANG NGHỈ</h1>
         <p className="text-xl text-slate-400">Chạm vào màn hình hoặc bước vào khung hình để đánh thức</p>
      </div>

      {/* MÀN HÌNH LOADING */}
      {(status === 'connecting' || status === 'loading_model') && (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
          <h2 className="text-3xl font-bold text-white tracking-widest">HỆ THỐNG AN NINH</h2>
          <p className="text-slate-400 mt-2">{message}</p>
        </div>
      )}

      {/* NÚT ADMIN (Nhỏ gọn, tối màu để nổi bật trên nền trắng) */}
      <a href="http://localhost:5000" className="absolute top-6 right-6 z-40 bg-slate-800/90 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 transition-all shadow-lg text-sm font-medium">
        <Settings className="w-4 h-4" /> Quản trị viên
      </a>

      {/* CAMERA BOX */}
      <div className="z-10 flex flex-col items-center w-full px-4">
        <div className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-300 shadow-2xl ${borderColor}`}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user", width: 800, height: 600 }}
            className="w-[800px] h-[600px] object-cover mirrored bg-slate-100"
            style={{ transform: 'scaleX(-1)' }} 
          />
          
          {/* Ô CHỮ NHẬT NHẬN DIỆN MẶT */}
          {faceBox && (status === 'idle' || status === 'waiting_blink') && (
            <div 
              className={`absolute border-2 transition-all duration-75 border-dashed ${status === 'waiting_blink' ? 'border-cyan-400 bg-cyan-500/10' : 'border-blue-400 bg-blue-500/10'}`}
              style={{ left: `${faceBox.x}px`, top: `${faceBox.y}px`, width: `${faceBox.width}px`, height: `${faceBox.height}px` }}
            >
              <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${status === 'waiting_blink' ? 'border-cyan-500' : 'border-blue-500'}`}></div>
              <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${status === 'waiting_blink' ? 'border-cyan-500' : 'border-blue-500'}`}></div>
              <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${status === 'waiting_blink' ? 'border-cyan-500' : 'border-blue-500'}`}></div>
              <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${status === 'waiting_blink' ? 'border-cyan-500' : 'border-blue-500'}`}></div>
            </div>
          )}
        </div>

        {/* STATUS BOX (Đã được thu gọn kích thước, chữ nhỏ lại, gọn gàng, tinh tế) */}
        <div className="mt-6 bg-slate-800/90 backdrop-blur-md px-8 py-4 rounded-2xl flex items-center gap-4 border border-slate-700 shadow-xl max-w-xl w-full justify-center transition-all">
          <Icon className={`w-8 h-8 ${iconColor} ${(status === 'idle' || status === 'blocked') ? 'animate-pulse' : ''}`} />
          <span className={`text-lg font-bold tracking-wide ${status === 'error' ? 'text-red-400' : 'text-white'}`}>
            {message}
          </span>
        </div>
      </div>

      {/* THẺ KHÁCH MỜI VIP */}
      <div className={`absolute bottom-6 left-6 z-40 transition-all duration-700 transform ${attendee && status === 'success' ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-800/95 backdrop-blur-xl border border-green-500/30 p-5 rounded-2xl shadow-[0_10px_40px_rgba(34,197,94,0.2)] flex items-center gap-5 w-80">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-green-500 overflow-hidden shrink-0">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-green-400 font-bold text-[10px] tracking-widest mb-1">XÁC THỰC THÀNH CÔNG</p>
            <h3 className="text-white text-xl font-bold mb-1 truncate">{attendee?.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">{attendee?.ticket}</span>
              <span>{attendee?.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ĐỒNG HỒ (Thu nhỏ font chữ, bọc trong nền tối để nổi bật trên nền trắng) */}
      <div className="absolute bottom-6 right-6 z-40 text-right backdrop-blur-md bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-xl">
        <div className="text-2xl font-mono text-white font-bold tracking-tight">
          {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
        </div>
        <div className="text-slate-400 text-sm font-medium mt-1">
          {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
