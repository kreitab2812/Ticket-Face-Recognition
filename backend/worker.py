<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hệ Thống Nhận Diện & Chống Giả Mạo</title>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@4.11.1/dist/full.min.css" rel="stylesheet" type="text/css" />
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200 min-h-screen flex items-center justify-center p-4">
    <div class="card w-full max-w-4xl bg-base-100 shadow-2xl">
        <div class="card-body items-center text-center">
            <h2 class="card-title text-3xl font-bold mb-2">Kiểm Soát Ra Vào Cấp Độ Cao</h2>
            <p class="text-base-content/70 mb-6">Hệ thống trang bị Camera RGB và cảm biến Hồng ngoại (IR)</p>
            
            <div class="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-4 border-neutral shadow-inner">
                <video id="videoRGB" class="w-full h-full object-cover transform -scale-x-100" autoplay muted></video>
                
                <div class="absolute bottom-4 right-4 w-1/4 aspect-video bg-black rounded-lg border-2 border-error overflow-hidden shadow-lg z-10">
                    <span class="absolute top-1 left-1 bg-error text-white text-[10px] font-bold px-1 rounded z-20">IR SENSOR</span>
                    <video id="videoIR" class="w-full h-full object-cover transform -scale-x-100 grayscale contrast-125" autoplay muted></video>
                </div>

                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="w-64 h-64 border-2 border-primary border-dashed rounded-3xl opacity-50"></div>
                </div>
            </div>

            <div id="resultAlert" class="alert alert-info mt-6 w-full max-w-md shadow-lg transition-all duration-300">
                <span id="resultText" class="font-medium text-lg">Đang khởi động cảm biến...</span>
            </div>
        </div>
    </div>

    <script>
        const videoRGB = document.getElementById('videoRGB');
        const videoIR = document.getElementById('videoIR');
        const resultAlert = document.getElementById('resultAlert');
        const resultText = document.getElementById('resultText');
        
        let isProcessing = false;

        // Khởi động hệ thống Dual Camera
        async function startCameras() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                
                if (videoDevices.length === 0) {
                    throw new Error("Không tìm thấy camera nào!");
                }

                // Luồng RGB (Lấy camera đầu tiên)
                const streamRGB = await navigator.mediaDevices.getUserMedia({ 
                    video: { deviceId: videoDevices[0].deviceId } 
                });
                videoRGB.srcObject = streamRGB;

                // Luồng IR (Lấy camera thứ 2 nếu có, nếu không lấy lại camera 1 để test tạm)
                const irDeviceId = videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0].deviceId;
                const streamIR = await navigator.mediaDevices.getUserMedia({ 
                    video: { deviceId: irDeviceId } 
                });
                videoIR.srcObject = streamIR;

                resultText.innerText = "Hệ thống sẵn sàng. Vui lòng nhìn thẳng.";

            } catch (err) {
                console.error("Lỗi khởi động camera: ", err);
                resultText.innerText = "Lỗi kết nối Camera!";
                resultAlert.classList.replace('alert-info', 'alert-error');
            }
        }

        // Hàm chụp ảnh từ video và trả về Blob
        function captureVideoToBlob(videoElement) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 640;
                const scale = Math.min(MAX_WIDTH / videoElement.videoWidth, 1);
                
                canvas.width = videoElement.videoWidth * scale;
                canvas.height = videoElement.videoHeight * scale;
                canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
        }

        async function captureAndRecognize() {
            if (isProcessing || !videoRGB.videoWidth || !videoIR.videoWidth) return;
            isProcessing = true;

            try {
                // Chụp song song cả 2 camera
                const [blobRGB, blobIR] = await Promise.all([
                    captureVideoToBlob(videoRGB),
                    captureVideoToBlob(videoIR)
                ]);

                if (!blobRGB || !blobIR) throw new Error("Lỗi trích xuất khung hình");

                const formData = new FormData();
                formData.append('file_rgb', blobRGB, 'rgb.jpg');
                formData.append('file_ir', blobIR, 'ir.jpg');

                resultText.innerText = "Đang phân tích Liveness & ArcFace...";
                resultAlert.className = "alert alert-warning mt-6 w-full max-w-md shadow-lg";

                // Gọi API backend qua port 8080 (Docker Nginx)
                const response = await fetch('http://127.0.0.1:8000/recognize', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();

                if (data.status === "success" && data.access === "granted") {
                    resultText.innerText = `[Thật] Xin chào ${data.employee}! (Khớp: ${Math.round(data.score * 100)}%)`;
                    resultAlert.className = "alert alert-success mt-6 w-full max-w-md shadow-lg text-white";
                } else if (data.status === "error") {
                    // Xử lý lỗi giả mạo hoặc lỗi hệ thống
                    resultText.innerText = data.message;
                    resultAlert.className = "alert alert-error mt-6 w-full max-w-md shadow-lg text-white";
                } else {
                    resultText.innerText = "Truy cập bị từ chối! Người lạ.";
                    resultAlert.className = "alert alert-error mt-6 w-full max-w-md shadow-lg text-white";
                }
            } catch (error) {
                console.error("Lỗi API:", error);
                resultText.innerText = "Lỗi kết nối máy chủ!";
                resultAlert.className = "alert alert-error mt-6 w-full max-w-md shadow-lg text-white";
            } finally {
                // Đợi 2 giây mới quét mặt tiếp theo
                setTimeout(() => {
                    isProcessing = false;
                }, 2000);
            }
        }

        startCameras();
        videoRGB.addEventListener('playing', () => {
            setInterval(captureAndRecognize, 500); 
        });
    </script>
</body>
</html>
