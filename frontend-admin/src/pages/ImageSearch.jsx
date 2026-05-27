import React, { useState } from 'react';
import { Search, Upload, User } from 'lucide-react';

const ImageSearch = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Tim Kiem Dinh Danh Banh Hinh Anh</h2>
      <p className="text-slate-500 mb-8">Tai len hinh anh de truy van co so du lieu Vector Qdrant xem nguoi nay la ai.</p>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">Chon anh can tim</label>
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 text-center">
             <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
             <input type="file" onChange={handleFileChange} className="hidden" id="upload-search" accept="image/*" />
             <label htmlFor="upload-search" className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition">
                Duyet file tren may
             </label>
          </div>
          
          <button className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2">
            <Search className="w-5 h-5" /> Bat Dau Quet AI
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center border-l border-slate-200 pl-8">
          <div className="text-sm text-slate-500 mb-4 font-medium uppercase tracking-wider">Ket qua nhan dien</div>
          {preview ? (
             <div className="text-center">
                <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-full border-4 border-slate-200 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-800">Ket qua se hien thi o day</h4>
                <p className="text-sm text-slate-500">Do tuong dong (Cosine): --</p>
             </div>
          ) : (
             <div className="text-center text-slate-400">
                <User className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Chua co du lieu</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSearch;
