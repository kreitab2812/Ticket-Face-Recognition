import React from 'react';
import { Users, Ticket, AlertTriangle, ShieldCheck } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tong Quan He Thong</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* The thong ke 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg"><Ticket className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tong So Ve</p>
            <p className="text-2xl font-bold text-slate-800">1,248</p>
          </div>
        </div>

        {/* The thong ke 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg"><ShieldCheck className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Da Check-in</p>
            <p className="text-2xl font-bold text-slate-800">892</p>
          </div>
        </div>

        {/* The thong ke 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg"><Users className="w-6 h-6 text-orange-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Chua Den</p>
            <p className="text-2xl font-bold text-slate-800">356</p>
          </div>
        </div>

        {/* The thong ke 4 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Canh Bao Cho Den</p>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-lg font-semibold mb-4">Bieu do luu luong (Tinh nang mo rong sau nay)</h3>
         <div className="h-64 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
            [Khu vuc tich hop bieu do Recharts/Chart.js]
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
