import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { UserPlus, Camera, Upload, CheckCircle, XCircle, Loader2, Image as ImageIcon, Save, AlertOctagon } from 'lucide-react';
import toast from 'react-hot-toast';
import { addAttendee } from '../services/api'; 

const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
};

const AddAttendee = () => {
    const webcamRef = useRef(null);
    
    const [name, setName] = useState('');
    const [ticketCode, setTicketCode] = useState('');
    const [inputMode, setInputMode] = useState('camera'); 
    
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isValidFace, setIsValidFace] = useState(null); 
    const [submitError, setSubmitError] = useState(''); // [STATE MỚI] Ghi nhận lỗi an ninh

    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
                setIsModelLoaded(true);
            } catch (error) {
                toast.error('Lỗi tải Model AI kiểm duyệt ảnh!');
            }
        };
        loadModels();
    }, []);

    const validateImageWithAI = async (imageSrc) => {
        setIsProcessing(true);
        setIsValidFace(null);
        setSubmitError(''); // Xóa lỗi cũ khi check ảnh mới

        try {
            const img = new Image();
            img.src = imageSrc;
            await new Promise(resolve => img.onload = resolve);

            const faces = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }));
            
            if (faces.length === 0) {
                setIsValidFace(false);
                toast.error('AI Cảnh báo: Không tìm thấy khuôn mặt trong ảnh!');
                setSelectedFile(null); 
            } else if (faces.length > 1) {
                setIsValidFace(false);
                toast.error('AI Cảnh báo: Ảnh có chứa nhiều hơn 1 khuôn mặt!');
                setSelectedFile(null);
            } else {
                setIsValidFace(true);
                toast.success('AI Xác nhận: Khuôn mặt hợp lệ, có thể đăng ký!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi quá trình quét ảnh!');
        } finally {
            setIsProcessing(false);
        }
    };

    const capturePhoto = () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setPreviewImage(imageSrc);
            const file = dataURLtoFile(imageSrc, `webcam_${ticketCode || 'guest'}.jpg`);
            setSelectedFile(file);
            validateImageWithAI(imageSrc);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageSrc = URL.createObjectURL(file);
            setPreviewImage(imageSrc);
            setSelectedFile(file);
            validateImageWithAI(imageSrc);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(''); // Làm sạch lỗi cũ
        
        if (!name || !ticketCode) return toast.error('Vui lòng nhập Tên và Mã vé!');
        if (!selectedFile || isValidFace !== true) return toast.error('Vui lòng cung cấp hình ảnh chân dung hợp lệ!');

        setIsProcessing(true);
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('ticket_code', ticketCode);
        formData.append('file', selectedFile);

        try {
            const response = await addAttendee(formData);
            
            if(response.data && response.data.status === 'success') {
                toast.success(`Đã thêm khách mời ${name} thành công!`);
                // Clear form
                setName('');
                setTicketCode('');
                setPreviewImage(null);
                setSelectedFile(null);
                setIsValidFace(null);
                setSubmitError('');
            } else {
                // [TÍNH NĂNG MỚI]: Hiện bảng đỏ chót khi bị trùng mặt, KHÔNG xóa dữ liệu Form
                setSubmitError(response.data?.message || 'Lỗi dữ liệu: Backend từ chối lưu!');
                toast.error('Thêm thất bại, vui lòng kiểm tra lại vấn đề an ninh!');
            }
        } catch (error) {
            toast.error('Lỗi mạng hoặc Backend đang sập!');
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
                    <UserPlus className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Đăng Ký Khách Mới</h2>
                    <p className="text-slate-500">Khai báo thông tin và nhận diện sinh trắc học</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Thông Tin Định Danh</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Họ và Tên Khách Mời <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" value={name} onChange={(e) => setName(e.target.value)} 
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-slate-800"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Mã Vé / ID <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" value={ticketCode} onChange={(e) => setTicketCode(e.target.value.toUpperCase())} 
                                    placeholder="Ví dụ: VIP-001"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono font-bold text-slate-800 uppercase"
                                />
                            </div>
                        </div>

                        {/* HIỂN THỊ CẢNH BÁO TRÙNG MẶT Ở ĐÂY */}
                        {submitError && (
                            <div className="mt-6 p-4 bg-red-100 border-2 border-red-500 rounded-xl flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
                                <AlertOctagon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                                <span className="font-bold text-sm leading-relaxed">{submitError}</span>
                            </div>
                        )}

                        <button 
                            onClick={handleSubmit} 
                            disabled={!name || !ticketCode || isValidFace !== true || isProcessing}
                            className={`w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                                (!name || !ticketCode || isValidFace !== true || isProcessing) 
                                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                            }`}
                        >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isProcessing ? 'Đang xác thực...' : 'Lưu Hồ Sơ Khách Mời'}
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-2/3">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                        
                        <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Dữ Liệu Khuôn Mặt</h3>
                                <p className="text-sm text-slate-500">Kiosk sẽ dùng ảnh này để so khớp sinh trắc học</p>
                            </div>
                            
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setInputMode('camera')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${inputMode === 'camera' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <Camera className="w-4 h-4" /> Dùng Webcam
                                </button>
                                <button onClick={() => setInputMode('upload')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${inputMode === 'upload' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                                    <Upload className="w-4 h-4" /> Tải file lên
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex gap-6">
                            
                            <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 relative overflow-hidden">
                                {!isModelLoaded ? (
                                    <div className="text-center text-blue-500 flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        <p className="font-medium text-sm">Đang tải Engine AI...</p>
                                    </div>
                                ) : (
                                    <>
                                        {inputMode === 'camera' ? (
                                            <div className="w-full flex flex-col items-center">
                                                <div className="rounded-lg overflow-hidden border-2 border-slate-800 shadow-md mb-4 bg-black w-full">
                                                    <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} className="w-full h-auto object-cover mirrored" style={{ transform: 'scaleX(-1)' }} />
                                                </div>
                                                <button onClick={capturePhoto} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                                                    <Camera className="w-5 h-5" /> Chụp Ảnh Trực Tiếp
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-600 font-medium mb-4">Kéo thả ảnh vào đây, hoặc</p>
                                                <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" id="upload-btn" />
                                                <label htmlFor="upload-btn" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold shadow-lg cursor-pointer inline-block transition-colors">
                                                    Chọn file từ máy tính
                                                </label>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="w-64 flex flex-col items-center justify-center border-l border-slate-100 pl-6">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Kết Quả AI</p>
                                
                                <div className={`w-48 h-48 rounded-2xl border-4 flex items-center justify-center overflow-hidden mb-4 relative transition-all duration-300 ${isValidFace === true ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]' : isValidFace === false ? 'border-red-400' : 'border-slate-200 bg-slate-50'}`}>
                                    {previewImage ? (
                                        <>
                                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                            {isProcessing && (
                                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-slate-300" />
                                    )}
                                </div>

                                <div className="text-center w-full h-16 flex items-center justify-center">
                                    {isValidFace === true && (
                                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200 flex items-center gap-2 font-bold text-sm w-full justify-center">
                                            <CheckCircle className="w-5 h-5" /> Ảnh hợp lệ
                                        </div>
                                    )}
                                    {isValidFace === false && (
                                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-200 flex items-center gap-2 font-bold text-sm w-full justify-center">
                                            <XCircle className="w-5 h-5" /> Ảnh bị từ chối
                                        </div>
                                    )}
                                    {isValidFace === null && !isProcessing && (
                                        <p className="text-sm text-slate-400 font-medium">Chưa có ảnh tải lên</p>
                                    )}
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddAttendee;
