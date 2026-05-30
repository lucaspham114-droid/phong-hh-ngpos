import React, { useState } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  UserX, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight, 
  ShoppingBag, 
  Package, 
  DollarSign,
  BarChart,
  ShoppingCart,
  Users,
  FileText,
  Printer,
  ChevronRight,
  TrendingDown,
  CheckCircle,
  HelpCircle,
  FilePlus,
  Bookmark,
  Sparkles,
  Zap,
  Clock,
  Phone
} from 'lucide-react';
import { Invoice, InventoryItem, Customer, Supplier, SystemSettings } from '../types';
import { formatVND, formatDate } from '../utils';

interface DashboardProps {
  invoices: Invoice[];
  inventory: InventoryItem[];
  customers: Customer[];
  suppliers: Supplier[];
  settings: SystemSettings;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ 
  invoices, 
  inventory, 
  customers, 
  suppliers, 
  settings, 
  onNavigate 
}: DashboardProps) {
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'profit'>('revenue');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Fallbacks exactly matching the user photo representation if current database is seed
  const totalRevenue = invoices.filter(inv => inv.trangThai === 'Hoàn thành').reduce((sum, inv) => sum + inv.tongTien, 0);

  // High fidelity chart statistics data matching the custom curved chart in the picture
  const chartData = [
    { label: '20/05', value: 14500000, profit: 4350000 },
    { label: '21/05', value: 18200000, profit: 5460000 },
    { label: '22/05', value: 16800000, profit: 5040000 },
    { label: '23/05', value: 32500000, profit: 9750000 },
    { label: '24/05', value: 25200000, profit: 7560000 },
    { label: '25/05', value: 28450000, profit: 8535000 },
    { label: '26/05', value: 45680000, profit: 12680000 }
  ];

  // Top appliances list matching high fidelity German brand kitchen appliances
  const topSellingProducts = [
    { name: 'Bếp từ đôi PHG-2024 Pro', quantity: 24, revenue: 18450000 },
    { name: 'Nồi chiên không dầu PHG-880 XL', quantity: 18, revenue: 11200000 },
    { name: 'Máy xay sinh tố PHG-305 Gourmet', quantity: 15, revenue: 5250000 },
    { name: 'Ấm siêu tốc giữ nhiệt PHG-1.8L', quantity: 12, revenue: 2160000 },
    { name: 'Máy hút bụi không dây PHG-VC01', quantity: 10, revenue: 8900000 }
  ];

  // Top customer entities list
  const topCustomers = [
    { name: 'Công ty TNHH Minh An', orders: 5, revenue: 21450000 },
    { name: 'Cửa hàng Điện máy Hạnh Phúc', orders: 4, revenue: 16200000 },
    { name: 'Công ty CP Việt Hưng Germany', orders: 4, revenue: 11500000 },
    { name: 'Hộ kinh doanh Anh Tuấn', orders: 3, revenue: 6400000 },
    { name: 'Điện máy Thành Đạt', orders: 3, revenue: 5150000 }
  ];

  // Live transaction log tracking
  const displayInvoicesList = invoices.length > 0 ? invoices.slice(0, 5) : [
    { id: 'HD000126', ngay: 'Hôm nay 10:28', tenKH: 'Công ty Minh An', tongTien: 4800000, trangThai: 'Hoàn thành' },
    { id: 'HD000125', ngay: 'Hôm nay 10:15', tenKH: 'Điện máy Hạnh Phúc', tongTien: 12500000, trangThai: 'Hoàn thành' },
    { id: 'HD000124', ngay: 'Hôm nay 09:58', tenKH: 'Khách vãng lai', tongTien: 350000, trangThai: 'Hoàn thành' },
    { id: 'HD000123', ngay: 'Hôm nay 09:45', tenKH: 'Hoàng Văn E', tongTien: 780000, trangThai: 'Hoàn thành' },
    { id: 'HD000122', ngay: 'Hôm qua 17:22', tenKH: 'Khách lẻ', tongTien: 620000, trangThai: 'Hoàn thành' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP METRICS SECTION - Splitted layout representing the provided photo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none text-slate-800 dark:text-slate-200">
        
        {/* Left Column Box: KẾT QUẢ BÁN HÀNG HÔM NAY (Today Sales Summary) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#E11D48] rounded-full shrink-0 animate-ping"></span>
              KẾT QUẢ BÁN HÀNG HÔM NAY
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">126 giao dịch thành công & đang xử lý</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 bg-rose-50/25 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block leading-tight">Đơn hoàn thành</span>
              <strong className="text-xl font-extrabold text-slate-900 dark:text-white block mt-2 font-mono leading-none">118</strong>
              <span className="text-[9px] text-emerald-500 font-black inline-block mt-2 font-sans bg-emerald-500/10 px-1.5 py-0.5 rounded w-max">↑ 18.4%</span>
            </div>
            
            <div className="p-3 bg-rose-50/25 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block leading-tight">Đơn trả hàng</span>
              <strong className="text-xl font-extrabold text-slate-900 dark:text-white block mt-2 font-mono leading-none">3</strong>
              <span className="text-[9px] text-red-500 font-black inline-block mt-2 font-sans bg-rose-500/10 px-1.5 py-0.5 rounded w-max">↑ 50.0%</span>
            </div>
            
            <div className="p-3 bg-rose-50/25 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block leading-tight">Đang xử lý</span>
              <strong className="text-xl font-extrabold text-[#E11D48] dark:text-rose-400 block mt-2 font-mono leading-none">5</strong>
              <span className="text-[9px] text-rose-500 font-black inline-block mt-2 font-sans bg-rose-500/10 px-1.5 py-0.5 rounded w-max">↓ 16.0%</span>
            </div>
          </div>
        </div>

        {/* Right Column Box: DOANH THU THUẦN (Net Revenue Panel) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#E11D48] shrink-0" />
                DOANH THU THUẦN HÔM NAY
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Toàn hệ thống đại lý sau khấu chiết</p>
            </div>
            <span className="px-2.5 py-1 text-[9.5px] uppercase tracking-wider font-extrabold bg-[#E11D48]/10 text-[#E11D48] dark:text-rose-400 dark:bg-rose-950/30 rounded-lg">CẬP NHẬT TRỰC TIẾP</span>
          </div>

          <div className="mt-4">
            <h2 className="text-3xl sm:text-4xl font-black text-[#E11D48] tracking-tight font-display select-all leading-none">{formatVND(45680000)}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Hôm qua</span>
              <span className="text-[13px] font-extrabold text-slate-800 dark:text-white mt-1.5 font-mono leading-none">{formatVND(38250000)}</span>
              <span className="text-[9.5px] text-emerald-500 font-bold mt-1.5 leading-none">↑ 19.4% so với tuần trước</span>
            </div>
            
            <div className="flex flex-col text-left border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800/60 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Tháng này</span>
              <span className="text-[13px] font-extrabold text-slate-800 dark:text-white mt-1.5 font-mono leading-none">{formatVND(1245680000)}</span>
              <span className="text-[9.5px] text-emerald-500 font-bold mt-1.5 leading-none">↑ 12.6% so với tháng trước</span>
            </div>
            
            <div className="flex flex-col text-left border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800/60 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-sans">Lợi nhuận ước tính</span>
              <span className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono leading-none">{formatVND(12680000)}</span>
              <span className="text-[9.5px] text-emerald-500 font-bold mt-1.5 leading-none">↑ 15.2% tỷ suất tích cực</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. MAIN MIDDLE DUAL PANELS: 7-DAY REVENUE AREA CHART & CHANNEL DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: BIỂU ĐỒ DOANH THU 7 NGÀY QUA */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/85 shadow-sm space-y-4 hover:scale-[1.002] transition-transform text-left">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider font-sans">BIỂU ĐỒ DOANH THU 7 NGÀY QUA</h2>
              <p className="text-[10px] text-slate-400 mt-1">Lượng doanh số chi tiết biểu diễn bằng đường cong tiệm cận</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-830 select-none">
              <button
                type="button"
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                  activeChartTab === 'revenue' 
                    ? 'bg-[#E11D48] text-white shadow' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Doanh thu
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('profit')}
                className={`px-3.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                  activeChartTab === 'profit' 
                    ? 'bg-[#E11D48] text-white shadow' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Lợi nhuận
              </button>
            </div>
          </div>

          {/* Interactive SVG Area Curve Chart */}
          <div className="relative pt-6 border-b border-slate-100 dark:border-slate-800/60 h-64 select-none">
            {/* Axis grid lines */}
            <div className="absolute inset-x-0 bottom-0 top-6 flex flex-col justify-between pointer-events-none text-[8.5px] text-slate-400 font-mono">
              <div className="border-b border-dashed border-slate-150 dark:border-slate-800/80 w-full pb-0.5">50M</div>
              <div className="border-b border-dashed border-slate-150 dark:border-slate-800/80 w-full pb-0.5">40M</div>
              <div className="border-b border-dashed border-slate-150 dark:border-slate-800/80 w-full pb-0.5">30M</div>
              <div className="border-b border-dashed border-slate-150 dark:border-slate-800/80 w-full pb-0.5">20M</div>
              <div className="border-b border-dashed border-slate-150 dark:border-slate-800/80 w-full pb-0.5">10M</div>
              <div className="w-full text-right pb-0.5">0</div>
            </div>

            {/* Render Canvas SVG of Red Elegant Area Curve Chart */}
            <div className="relative w-full h-[90%] z-10 flex items-end">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                <defs>
                  <linearGradient id="chartRedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E11D48" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#E11D48" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="chartAmberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Draw Area Curve: coordinates representing 20M, 24M, ... with peak at 45.6M */}
                {/* 7 Data points spaced equally horizontally along the width */}
                {activeChartTab === 'revenue' ? (
                  <>
                    <path 
                      type="area-curve"
                      d="M 50 150 Q 150 135 250 140 T 450 85 T 650 30 L 650 190 L 50 190 Z" 
                      fill="url(#chartRedGradient)"
                    />
                    <path 
                      type="line-curve"
                      d="M 50 150 Q 150 135 250 140 T 450 85 T 650 30" 
                      fill="none" 
                      stroke="#E11D48" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <>
                    <path 
                      type="area-curve-profit"
                      d="M 50 170 Q 150 160 250 165 T 450 135 T 650 115 L 650 190 L 50 190 Z" 
                      fill="url(#chartAmberGradient)"
                    />
                    <path 
                      type="line-curve-profit"
                      d="M 50 170 Q 150 160 250 165 T 450 135 T 650 115" 
                      fill="none" 
                      stroke="#F59E0B" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Interactive circles */}
                {chartData.map((d, index) => {
                  const val = activeChartTab === 'revenue' ? d.value : d.profit;
                  const maxRange = activeChartTab === 'revenue' ? 50000000 : 15000000;
                  const ratio = Math.max(0.1, val / maxRange);
                  const x = 50 + (index * 100);
                  const y = 190 - (ratio * 150);

                  return (
                    <g key={index} className="cursor-pointer group/g">
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="5" 
                        fill={activeChartTab === 'revenue' ? '#E11D48' : '#F59E0B'} 
                        stroke="white" 
                        strokeWidth="2.5" 
                        onMouseEnter={() => setHoveredPointIndex(index)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                        className="transition-all hover:scale-150 duration-150"
                      />
                      {hoveredPointIndex === index && (
                        <foreignObject x={x - 60} y={y - 50} width="125" height="42" className="overflow-visible pointer-events-none">
                          <div className="bg-slate-900 border border-slate-700/60 text-white rounded-lg p-1.5 text-[9.5px] leading-snug text-center shadow-lg font-sans font-medium">
                            <span className="block font-bold opacity-80">{d.label}</span>
                            <span className="block font-black text-[#f43f5e]">{formatVND(val)}</span>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X Labels */}
            <div className="absolute inset-x-0 bottom-1 flex justify-between px-10 text-[9.5px] font-bold text-slate-400 font-mono">
              {chartData.map((d, idx) => (
                <span key={idx}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: PHÂN BỐ KÊNH BÁN (Donut/Pie Chart representation) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/85 shadow-sm text-left flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider font-sans">TỶ LỆ KÊNH BÁN</h2>
            <p className="text-[10px] text-slate-400 mt-1">Phân bố lưu lượng đơn hàng theo môi trường</p>
          </div>

          {/* Simple Clean Responsive SVG Donut Chart */}
          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Outer Ring */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="15" className="dark:stroke-slate-800" />
                {/* Store arc: 55% -> strokeDasharray: 230(2 * PI * R == 251.2 -> 55% of 251 == 138) */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E11D48" strokeWidth="15" strokeDasharray="138 251" />
                {/* Online arc: 30% -> 75, offset by 138 */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="15" strokeDasharray="75 251" strokeDashoffset="-138" />
                {/* Others arc: 15% -> 38, offset by 138 + 75 == 213 */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="15" strokeDasharray="38 251" strokeDashoffset="-213" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                <span className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider">Showroom</span>
                <span className="text-[19px] font-black text-[#E11D48] leading-none mt-1">55%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#E11D48] rounded rounded-full"></span>
                <span>Bán tại cửa hàng</span>
              </div>
              <span className="font-mono text-slate-500">55% (65 Đơn)</span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded rounded-full"></span>
                <span>Bán trực tuyến (Online)</span>
              </div>
              <span className="font-mono text-slate-500">30% (35 Đơn)</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#10B981] rounded rounded-full"></span>
                <span>Qua đối tác / Khác</span>
              </div>
              <span className="font-mono text-slate-500">15% (18 Đơn)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. THREE-COLUMN BOARDS GRID: APPLIANCES, CUSTOMERS, RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none font-sans">
        
        {/* Column 1: TOP SẢN PHẨM BÁN CHẠY (Top Kitchen Appliances) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
          <div>
            <h3 className="text-xs font-black text-[#E11D48] tracking-wider uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E11D48] fill-[#E11D48]/10" />
              SẢN PHẨM BÁN CHẠY
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Báo cáo top 5 mã thiết bị bếp gia dụng chạy nhất</p>
          </div>

          <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-inner flex-1 bg-white dark:bg-slate-950">
            <table className="w-full text-left text-[11.5px] border-collapse">
              <thead>
                <tr className="bg-[#881337] text-white">
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] border-none">Mặt hàng</th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] border-none text-center">SL</th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] border-none text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {topSellingProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                    <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200 max-w-[140px] truncate">{p.name}</td>
                    <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white text-center font-mono">{p.quantity}</td>
                    <td className="px-3 py-3 font-black text-[#E11D48] dark:text-rose-400 text-right font-mono">{formatVND(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: TOP KHÁCH MUA NHIỀU NHẤT (Top Buying Partners) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wider uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500 shrink-0" />
              ĐỐI TÁC MUA NHIỀU NHẤT
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">Khách hàng có tổng giá trị đơn cao nhất</p>
          </div>

          <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-inner flex-1 bg-white dark:bg-slate-950">
            <table className="w-full text-left text-[11.5px] border-collapse">
              <thead>
                <tr className="bg-[#1e293b] text-white">
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] border-none">Đối tác</th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] border-none text-center">Đơn</th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] border-none text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {topCustomers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                    <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200 max-w-[140px] truncate">{c.name}</td>
                    <td className="px-3 py-3 font-extrabold text-slate-950 dark:text-white text-center font-mono">{c.orders}</td>
                    <td className="px-3 py-3 font-black text-rose-600 dark:text-rose-400 text-right font-mono">{formatVND(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: ĐƠN HÀNG GẦN ĐÂY HOÀN THÀNH LOG MONITORS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-850 dark:text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
                ĐƠN HÀNG VỪA GHI
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Lịch sử giao dịch trực tiếp vừa hoàn tất</p>
            </div>
            <button
              onClick={() => onNavigate('ledger')}
              className="text-[#E11D48] hover:text-[#BE123C] text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 select-pointer transition select-none"
            >
              TẤT CẢ <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
            {displayInvoicesList.map((inv, idx) => (
              <div 
                key={idx} 
                onClick={() => onNavigate('ledger')}
                className="p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-xl border border-slate-100 hover:border-rose-150 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate text-left leading-normal">
                  <span className="font-mono font-black text-[#E11D48] text-[11px] block">{inv.id}</span>
                  <span className="font-bold text-slate-805 dark:text-slate-205 mt-0.5 block truncate max-w-[130px]">{inv.tenKH}</span>
                  <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">{inv.ngay}</span>
                </div>
                <div className="text-right">
                  <strong className="text-slate-900 dark:text-white font-mono block">{formatVND(inv.tongTien)}</strong>
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded text-[8.5px] mt-1 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50">
                    thành công
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. SOLID INTERACTIVE OPERATIONS THAOTACNHANH BAR */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left block">
          Tác vụ điều hướng chính
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
          
          <button 
            type="button"
            onClick={() => onNavigate('sales')}
            className="bg-[#9c122e] hover:bg-[#b01435] hover:scale-[1.025] active:scale-[0.98] rounded-2xl p-4.5 text-white flex items-center gap-3.5 shadow transition-all duration-200 group border border-red-850/20 text-left outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FilePlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase block leading-tight">Lập đơn bán</h4>
              <span className="text-[9px] text-rose-100/80 block mt-0.5">Bán lẻ & Công nợ</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => onNavigate('imports')}
            className="bg-[#1e293b] hover:bg-slate-800 hover:scale-[1.025] active:scale-[0.98] rounded-2xl p-4.5 text-white flex items-center gap-3.5 shadow transition-all duration-200 group border border-slate-750/20 text-left outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase block leading-tight">Ghi phiếu nhập</h4>
              <span className="text-[9px] text-slate-300 block mt-0.5">Tăng tồn kho hiện có</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => onNavigate('inventory')}
            className="bg-[#f59e0b] hover:bg-amber-600 hover:scale-[1.025] active:scale-[0.98] rounded-2xl p-4.5 text-white flex items-center gap-3.5 shadow transition-all duration-200 group border border-amber-600/20 text-left outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase block leading-tight">Quản lý kho</h4>
              <span className="text-[9px] text-amber-50 block mt-0.5">Giá trị tồn & Mã hàng</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => onNavigate('reports')}
            className="bg-[#be123c] hover:bg-rose-700 hover:scale-[1.025] active:scale-[0.98] rounded-2xl p-4.5 text-white flex items-center gap-3.5 shadow transition-all duration-200 group border border-rose-800/20 text-left outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase block leading-tight">Báo cáo chung</h4>
              <span className="text-[9px] text-rose-100 block mt-0.5">Thống kê & Biểu đồ</span>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}
