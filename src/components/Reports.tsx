import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Award, 
  BarChart, 
  PieChart, 
  LineChart, 
  RefreshCw 
} from 'lucide-react';
import { Invoice, Product, Customer, Supplier } from '../types';
import { formatVND, formatDate } from '../utils';

interface ReportsProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
}

export default function Reports({
  invoices,
  products,
  customers,
  suppliers
}: ReportsProps) {
  // Date filters: default from week ago (2026-05-24) to today (2026-05-30)
  const [startDateStr, setStartDateStr] = useState('2026-05-24');
  const [endDateStr, setEndDateStr] = useState('2026-05-30');

  // Filtered invoices by active Completed and Date range
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.trangThai !== 'Hoàn thành') return false;
      const invDate = inv.ngay.split('T')[0];
      return invDate >= startDateStr && invDate <= endDateStr;
    });
  }, [invoices, startDateStr, endDateStr]);

  // General metrics calculations
  const totalRevenue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.tongTien, 0);
  }, [filteredInvoices]);

  // Compute Cost of Goods Sold (Giá vốn) for filtered sales
  const totalCostOfGoods = useMemo(() => {
    let cost = 0;
    filteredInvoices.forEach(inv => {
      inv.details?.forEach(det => {
        const prod = products.find(p => p.maSP === det.maSP);
        const costPrice = prod ? prod.giaNhap : 0;
        cost += costPrice * det.soLuong;
      });
    });
    return cost;
  }, [filteredInvoices, products]);

  // Estimated gross profit margin (Lợi nhuận gộp định tính)
  const estimatedProfit = useMemo(() => {
    return totalRevenue - totalCostOfGoods;
  }, [totalRevenue, totalCostOfGoods]);

  const profitMarginPercentage = useMemo(() => {
    if (totalRevenue === 0) return 0;
    return Math.round((estimatedProfit / totalRevenue) * 100);
  }, [totalRevenue, estimatedProfit]);

  // Product sales aggregate
  const productSalesMap = useMemo(() => {
    const map: { [maSP: string]: { maSP: string; tenSP: string; qty: number; revenue: number } } = {};
    filteredInvoices.forEach(inv => {
      inv.details?.forEach(det => {
        if (!map[det.maSP]) {
          map[det.maSP] = { maSP: det.maSP, tenSP: det.tenSP, qty: 0, revenue: 0 };
        }
        map[det.maSP].qty += det.soLuong;
        map[det.maSP].revenue += det.thanhTien;
      });
    });
    return Object.values(map);
  }, [filteredInvoices]);

  // Best selling products sorted by qty
  const topProducts = useMemo(() => {
    return [...productSalesMap].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [productSalesMap]);

  // Category shares
  const categoryChartData = useMemo(() => {
    const map: { [cat: string]: number } = {
      'Điện gia dụng': 0,
      'Đồ nhựa': 0,
      'Nhà bếp': 0,
      'Sành sứ': 0,
      'Khác': 0
    };

    filteredInvoices.forEach(inv => {
      inv.details?.forEach(det => {
        const prod = products.find(p => p.maSP === det.maSP);
        const nhom = prod ? prod.nhomHang : 'Khác';
        if (nhom in map) {
          map[nhom] += det.thanhTien;
        } else {
          map['Khác'] += det.thanhTien;
        }
      });
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredInvoices, products]);

  const maxCategoryValue = useMemo(() => {
    return Math.max(...categoryChartData.map(c => c.value), 1);
  }, [categoryChartData]);

  // Debts reports
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.conNo, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.conNo, 0);

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Filtering Header panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Báo cáo Hoạt động Cửa hàng</h2>
          <p className="text-xs text-gray-500">Thống kê doanh số, lợi nhuận dự kiến và nợ đọng phải thu chi.</p>
        </div>

        {/* Date picking box */}
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Từ ngày</span>
          <input
            type="date"
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs focus:ring-red-500 focus:border-red-500"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
          />
          <span>đến</span>
          <input
            type="date"
            className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
          />
        </div>
      </div>

      {/* 3 Metric Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Doanh thu bán ra</span>
            <h3 className="text-xl font-black text-gray-950 font-mono">{formatVND(totalRevenue)}</h3>
            <span className="text-[10px] text-gray-500 block">
              Ghi từ {filteredInvoices.length} hóa đơn đã hoàn thành
            </span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Khấu hao vốn gốc</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono">{formatVND(totalCostOfGoods)}</h3>
            <span className="text-[10px] text-gray-400 block font-light">
              Giá nhập kho tính theo mẫu
            </span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Lợi nhuận tạm tính</span>
            <h3 className="text-xl font-black text-emerald-700 font-mono">{formatVND(estimatedProfit)}</h3>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full inline-block mt-1 font-bold font-mono">
              Suất sinh lời: ~{profitMarginPercentage}%
            </span>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Reports Graph Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Top Selling Items with Custom Beautiful SVG Bars */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              Sản phẩm bán chạy nhất trong kỳ
            </h3>
            <span className="text-[11px] text-gray-400">Sắp xếp theo số lượng bán ra</span>
          </div>

          <div className="space-y-4 pt-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-16 text-center">Không phát sinh giao dịch bán chạy trong tầm lọc.</p>
            ) : (
              topProducts.map((p, index) => {
                const maxQty = Math.max(...topProducts.map(t => t.qty), 1);
                const percent = (p.qty / maxQty) * 100;
                
                return (
                  <div key={p.maSP} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">
                        Top {index + 1}: {p.tenSP}
                      </span>
                      <span className="text-slate-500 font-medium">
                        Đã bán: <strong className="text-gray-950 font-mono">{p.qty}</strong> cái | <span className="font-mono">{formatVND(p.revenue)}</span>
                      </span>
                    </div>

                    {/* Progress slider bar representation */}
                    <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-amber-500 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Category Shares details list */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 select-none">
            <PieChart className="w-4.5 h-4.5 text-indigo-500" />
            Cơ cấu doanh thu theo Nhóm hàng hóa
          </h3>

          <div className="space-y-4 pt-2">
            {categoryChartData.length === 0 ? (
              <p className="text-xs text-gray-400 py-16 text-center text-slate-400">Chưa ghi nhận danh mục bán ra trong kỳ.</p>
            ) : (
              categoryChartData.map((cat, index) => {
                const percent = Math.round((cat.value / totalRevenue) * 100);
                const barWidth = (cat.value / maxCategoryValue) * 100;
                
                // Color mapping
                const colorMap: any = {
                  'Điện gia dụng': 'bg-indigo-500',
                  'Đồ nhựa': 'bg-amber-500',
                  'Nhà bếp': 'bg-rose-500',
                  'Sành sứ': 'bg-emerald-500',
                  'Khác': 'bg-slate-500'
                };
                const color = colorMap[cat.name] || 'bg-slate-500';

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs items-center">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                        {cat.name}
                      </span>
                      <span className="text-gray-500">
                        {formatVND(cat.value)} (<strong className="text-indigo-700 font-mono font-bold">{percent}%</strong>)
                      </span>
                    </div>

                    <div className="w-full bg-slate-50 h-2 rounded overflow-hidden">
                      <div 
                        className={`h-full rounded ${color}`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Debts Summary and reports */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Tổng kiểm kê nợ tồn kho đọng khách & NCC</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 bg-red-50/20 rounded-xl border border-red-100 flex flex-col justify-between min-h-[90px]">
            <div>
              <p className="text-xs text-gray-500 font-medium font-sans">Tổng các khách hàng nợ cửa hàng (Fải thu):</p>
              <h4 className="text-xl font-extrabold text-red-600 font-mono mt-1">{formatVND(totalCustomerDebt)}</h4>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-sans">* Nhắc nhở: Thu nợ đầy đủ tránh thất thoát vốn quay vòng.</p>
          </div>

          <div className="p-4 bg-amber-50/20 rounded-xl border border-amber-100 flex flex-col justify-between min-h-[90px]">
            <div>
              <p className="text-xs text-gray-500 font-medium font-sans">Tổng mình nợ nhà cung cấp (Phải trả):</p>
              <h4 className="text-xl font-extrabold text-amber-700 font-mono mt-1">{formatVND(totalSupplierDebt)}</h4>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-sans">* Góp ý: Trả nợ đúng quý kỳ giúp duy trì chất lượng nguồn hàng ưu tú.</p>
          </div>

        </div>
      </div>

    </div>
  );
}
