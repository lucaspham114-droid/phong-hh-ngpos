import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Settings, 
  Trash2, 
  Eye, 
  Printer, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  History 
} from 'lucide-react';
import { Invoice, ImportSlip, Staff } from '../types';
import { formatVND, formatDate, smartMatch } from '../utils';

interface InvoicesListProps {
  invoices: Invoice[];
  importSlips: ImportSlip[];
  currentUserRole: 'Admin' | 'Quản lý' | 'Nhân viên kho';
  currentStaffName: string;
  onCancelInvoice: (maHD: string, reason: string, staffName: string) => void;
  onCancelImportSlip: (maPN: string, reason: string, staffName: string) => void;
  onSelectPrintInvoice: (invoice: Invoice) => void;
  onSelectPrintImport: (slip: ImportSlip) => void;
}

export default function InvoicesList({
  invoices,
  importSlips,
  currentUserRole,
  currentStaffName,
  onCancelInvoice,
  onCancelImportSlip,
  onSelectPrintInvoice,
  onSelectPrintImport
}: InvoicesListProps) {
  // Tabs for Hóa Đơn vs Phiếu Nhập
  const [activeLedger, setActiveLedger] = useState<'sales' | 'imports'>('sales');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for inline details view
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetType, setCancelTargetType] = useState<'sales' | 'imports' | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState('');

  // Filtering for Sales Invoices (HD)
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const match = smartMatch(inv.maHD, searchQuery) || 
                    smartMatch(inv.tenKH, searchQuery) ||
                    smartMatch(inv.sdtKH, searchQuery) ||
                    smartMatch(inv.nhanVien, searchQuery);
      return match;
    });
  }, [invoices, searchQuery]);

  // Filtering for Imports slips (PN)
  const filteredSlips = useMemo(() => {
    return importSlips.filter(slip => {
      const match = smartMatch(slip.maPN, searchQuery) || 
                    smartMatch(slip.tenNCC, searchQuery) ||
                    smartMatch(slip.sdtNCC, searchQuery) ||
                    smartMatch(slip.nhanVien, searchQuery);
      return match;
    });
  }, [importSlips, searchQuery]);

  // Selected details
  const activeInvoice = useMemo(() => {
    return invoices.find(inv => inv.maHD === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  const activeSlip = useMemo(() => {
    return importSlips.find(slip => slip.maPN === selectedSlipId) || null;
  }, [importSlips, selectedSlipId]);

  // Trigger Cancel checks
  const handleOpenCancelConfirmation = (id: string, type: 'sales' | 'imports') => {
    if (currentUserRole !== 'Admin') {
      alert("⚠️ Lỗi phân quyền: Chỉ tài khoản Admin mới có thẩm quyền HỦY hóa đơn/phiếu nhập để đảm bảo tính minh bạch sổ sách. Tài khoản của bạn hiện là: " + currentUserRole);
      return;
    }
    
    // Find item state first
    if (type === 'sales') {
      const item = invoices.find(inv => inv.maHD === id);
      if (item?.trangThai === 'Đã hủy') {
        alert("Hóa đơn này đã được hủy trước đó.");
        return;
      }
    } else {
      const item = importSlips.find(pn => pn.maPN === id);
      if (item?.trangThai === 'Đã hủy') {
        alert("Phiếu nhập này đã được hủy trước đó.");
        return;
      }
    }

    setCancelTargetType(type);
    setCancelTargetId(id);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert("Vui lòng ghi nhận lý do hủy giao dịch.");
      return;
    }

    if (cancelTargetType === 'sales') {
      onCancelInvoice(cancelTargetId, cancelReason.trim(), currentStaffName);
      alert(`Đã hủy thành công hóa đơn ${cancelTargetId}. Tồn kho và công nợ khách hàng đã được hoàn trả lại.`);
    } else if (cancelTargetType === 'imports') {
      onCancelImportSlip(cancelTargetId, cancelReason.trim(), currentStaffName);
      alert(`Đã hoàn trả/hủy thành công phiếu nhập ${cancelTargetId}. Tồn kho và dư nợ nhà CC đã được khấu trừ lại.`);
    }

    setShowCancelModal(false);
    setCancelReason('');
    setCancelTargetId('');
    setCancelTargetType(null);
  };

  return (
    <div className="space-y-4 text-left font-sans">
      
      {/* Top Ledger Filtering Header */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Nhật ký Giao dịch</h2>
          <p className="text-xs text-gray-500">Tra cứu, in hóa đơn K80 và hủy bỏ các phiếu sỉ, phiếu mua sắm lỗi.</p>
        </div>

        {/* Search & Selector tabs */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick toggle tab buttons */}
          <div className="bg-gray-100 rounded-xl p-1 flex">
            <button
              type="button"
              onClick={() => {
                setActiveLedger('sales');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                activeLedger === 'sales' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Hóa đơn Bán hàng ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLedger('imports');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                activeLedger === 'imports' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Phiếu Nhập hàng ({importSlips.length})
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs"
              placeholder={activeLedger === 'sales' ? "Tìm theo mã HD, Tên KH..." : "Tìm theo mã Phiếu, NCC..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLS: THE LIST */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Mã số</th>
                  <th className="p-3.5">Ngày lập</th>
                  <th className="p-3.5">{activeLedger === 'sales' ? 'Tên Khách hàng' : 'Nhà cung cấp'}</th>
                  <th className="p-3.5 text-right">Tổng cộng tiền</th>
                  <th className="p-3.5 text-right">Đã trả</th>
                  <th className="p-3.5 text-right">Còn nợ</th>
                  <th className="p-3.5 text-center">Trạng thái</th>
                  <th className="p-3.5 text-center">In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                
                {/* 1. SALES INVOICE LIST */}
                {activeLedger === 'sales' && (
                  filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">Không tìm thấy hóa đơn nào khớp.</td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isSelected = selectedInvoiceId === inv.maHD;
                      const isCanceled = inv.trangThai === 'Đã hủy';
                      return (
                        <tr 
                          key={inv.maHD}
                          className={`hover:bg-gray-50/50 cursor-pointer ${isSelected ? 'bg-red-50/15' : ''} ${isCanceled ? 'opacity-65 line-through decoration-gray-400' : ''}`}
                          onClick={() => setSelectedInvoiceId(inv.maHD)}
                        >
                          <td className="p-3.5 font-mono font-bold text-gray-900">{inv.maHD}</td>
                          <td className="p-3.5 text-gray-500 font-sans">{formatDate(inv.ngay)}</td>
                          <td className="p-3.5 font-bold text-gray-800">{inv.tenKH}</td>
                          <td className="p-3.5 text-right font-bold text-gray-900 font-mono">{formatVND(inv.tongTien)}</td>
                          <td className="p-3.5 text-right text-emerald-700 font-semibold font-mono">{formatVND(inv.daTra)}</td>
                          <td className="p-3.5 text-right text-red-600 font-semibold font-mono">{formatVND(inv.conNo)}</td>
                          
                          <td className="p-3.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isCanceled ? 'bg-red-50 text-red-700 font-sans' : 'bg-green-50 text-green-700 font-sans'
                            }`}>
                              {inv.trangThai}
                            </span>
                          </td>

                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onSelectPrintInvoice(inv)}
                              className="p-1 text-gray-400 hover:text-red-650 hover:bg-gray-100 rounded cursor-pointer"
                              title="Xem hóa đơn để in"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}

                {/* 2. IMPORT SLIPS LIST */}
                {activeLedger === 'imports' && (
                  filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">Chưa có phiếu nhập hàng hóa nào phát sinh.</td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip) => {
                      const isSelected = selectedSlipId === slip.maPN;
                      const isCanceled = slip.trangThai === 'Đã hủy';
                      return (
                        <tr 
                          key={slip.maPN}
                          className={`hover:bg-gray-50/50 cursor-pointer ${isSelected ? 'bg-amber-50/15' : ''} ${isCanceled ? 'opacity-65 line-through decoration-gray-400' : ''}`}
                          onClick={() => setSelectedSlipId(slip.maPN)}
                        >
                          <td className="p-3.5 font-mono font-bold text-gray-900">{slip.maPN}</td>
                          <td className="p-3.5 text-gray-500 font-sans">{formatDate(slip.ngayMoi)}</td>
                          <td className="p-3.5 font-bold text-gray-800">{slip.tenNCC}</td>
                          <td className="p-3.5 text-right font-bold text-gray-900 font-mono">{formatVND(slip.tongTien)}</td>
                          <td className="p-3.5 text-right text-emerald-700 font-semibold font-mono">{formatVND(slip.daTra)}</td>
                          <td className="p-3.5 text-right text-amber-700 font-semibold font-mono">{formatVND(slip.conNo)}</td>
                          
                          <td className="p-3.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isCanceled ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                            }`}>
                              {slip.trangThai}
                            </span>
                          </td>

                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onSelectPrintImport(slip)}
                              className="p-1 text-gray-400 hover:text-amber-700 hover:bg-gray-100 rounded cursor-pointer"
                              title="In phiếu nhập kho"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}

              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT 1 COL: EXPANDED DETAILED REVERSIBLE VIEW */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[400px]">
          
          {/* Active selection contents */}
          <div>
            
            {/* NO SELECTION DEFAULT PLACEMENT */}
            {!activeInvoice && !activeSlip && (
              <p className="text-xs text-gray-400 text-center py-20">Chọn bất cứ dòng giao dịch nào bên trái để mở bảng tra cứu hạch toán và khả năng hoàn hủy nợ/tồn.</p>
            )}

            {/* 1. SALES INVOICE EXPAND PANEL */}
            {activeLedger === 'sales' && activeInvoice && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      Đơn hàng {activeInvoice.maHD}
                    </h3>
                    <span className="text-[10px] text-gray-400">Lập: {formatDate(activeInvoice.ngay)}</span>
                  </div>
                  
                  {activeInvoice.trangThai === 'Hoàn thành' ? (
                    <button
                      type="button"
                      id="open-invoice-cancel-panel-btn"
                      onClick={() => handleOpenCancelConfirmation(activeInvoice.maHD, 'sales')}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 hover:text-red-700 text-[10px] border border-red-200 text-red-600 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hủy hóa đơn
                    </button>
                  ) : (
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">Đã hủy bỏ</span>
                  )}
                </div>

                <div className="text-[11px] text-gray-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p>Khách hàng: <strong>{activeInvoice.tenKH}</strong> ({activeInvoice.sdtKH})</p>
                  <p>Thu ngân lập: <strong>{activeInvoice.nhanVien}</strong></p>
                  {activeInvoice.trangThai === 'Đã hủy' && (
                    <div className="pt-2 mt-1 border-t border-dashed border-red-200 text-red-600 space-y-0.5 text-[10px]">
                      <p>⚠️ Lý do hủy: {activeInvoice.lyDoHuy}</p>
                      <p>Người đóng: {activeInvoice.nguoiHuy} ({formatDate(activeInvoice.ngayHuy || '')})</p>
                    </div>
                  )}
                </div>

                {/* Items lists */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Chi tiết hàng bán</p>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg pr-1">
                    {activeInvoice.details?.map((det, index) => (
                      <div key={index} className="p-2 flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-bold text-gray-700 truncate max-w-[150px]">{det.tenSP}</p>
                          <p className="text-[10px] text-gray-400 font-mono">SL: {det.soLuong} | Đơn giá: {formatVND(det.donGia)}</p>
                        </div>
                        <span className="font-bold font-mono text-gray-900">{formatVND(det.thanhTien)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals detail board */}
                <div className="space-y-1 pt-2 border-t border-gray-100 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Giảm giá chiết khấu:</span>
                    <span className="font-mono text-red-650">-{formatVND(activeInvoice.giamGia)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-950">
                    <span>Tổng thu thanh toán:</span>
                    <span className="font-mono">{formatVND(activeInvoice.tongTien)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Đã nhận thanh toán:</span>
                    <span className="font-mono font-bold">{formatVND(activeInvoice.daTra)}</span>
                  </div>
                  <div className="flex justify-between text-red-700 font-bold">
                    <span>Công nợ ghi nhận:</span>
                    <span className="font-mono">{formatVND(activeInvoice.conNo)}</span>
                  </div>
                </div>

              </div>
            )}

            {/* 2. IMPORT SLIP EXPAND PANEL */}
            {activeLedger === 'imports' && activeSlip && (
              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-800 text-xs">Phần phiếu nhập {activeSlip.maPN}</h3>
                    <span className="text-[10px] text-gray-400">Lập: {formatDate(activeSlip.ngayMoi)}</span>
                  </div>

                  {activeSlip.trangThai === 'Hoàn thành' ? (
                    <button
                      type="button"
                      id="open-import-cancel-panel-btn"
                      onClick={() => handleOpenCancelConfirmation(activeSlip.maPN, 'imports')}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 hover:text-red-700 text-[10px] border border-red-200 text-red-650 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hủy phiếu nhập
                    </button>
                  ) : (
                    <span className="text-[10px] bg-red-150 text-red-800 px-2.5 py-0.5 rounded font-extrabold">Đã hủy</span>
                  )}
                </div>

                <div className="text-[11px] text-gray-650 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p>Nhà Cung cấp: <strong>{activeSlip.tenNCC}</strong> ({activeSlip.sdtNCC})</p>
                  <p>Thủ kho tiếp nhận: <strong>{activeSlip.nhanVien}</strong></p>
                  {activeSlip.trangThai === 'Đã hủy' && (
                    <div className="pt-2 mt-1 border-t border-dashed border-red-200 text-red-600 space-y-0.5 text-[10px]">
                      <p>⚠️ Lý do hủy: {activeSlip.lyDoHuy}</p>
                      <p>Người hủy: {activeSlip.nguoiHuy} ({formatDate(activeSlip.ngayHuy || '')})</p>
                    </div>
                  )}
                </div>

                {/* Items lists */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Chi tiết sản phẩm nhập</p>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg pr-1">
                    {activeSlip.details?.map((det, index) => (
                      <div key={index} className="p-2 flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-bold text-gray-800 truncate max-w-[150px]">{det.tenSP}</p>
                          <p className="text-[10px] text-gray-550 font-mono">SL: {det.soLuong} | Đội giá: {formatVND(det.donGiaNhap)}</p>
                        </div>
                        <span className="font-bold font-mono text-gray-900">{formatVND(det.thanhTien)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals detail block */}
                <div className="space-y-1 pt-2 border-t border-gray-100 text-[11px]">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Tổng tiền trị nhập hàng:</span>
                    <span className="font-mono">{formatVND(activeSlip.tongTien)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Đã thanh toán cho NCC:</span>
                    <span className="font-mono">{formatVND(activeSlip.daTra)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Còn nợ nhà cung cấp:</span>
                    <span className="font-mono">{formatVND(activeSlip.conNo)}</span>
                  </div>
                </div>

              </div>
            )}

          </div>

          <p className="text-[10px] text-gray-400 font-sans border-t border-dashed border-gray-100 pt-3 leading-snug">
            * Quy trình hủy phiếu: Hệ thống đảo ngược toàn bộ giá trị nợ, hoàn trả hoặc trừ bớt số lượng thực tế trong Kho hàng lập tức.
          </p>

        </div>

      </div>

      {/* DETAILED CANCELLATION DIALOG REQUIRED REASON */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCancelSubmit}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-red-700 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                Xác nhận Hủy giao dịch
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              <div className="p-3 bg-red-50 text-red-850 rounded-xl border border-red-200 leading-snug">
                Bạn đang thực hiện hủy bỏ <strong className="font-mono uppercase text-red-950">{cancelTargetId}</strong>.<br />
                Hành động này sẽ:
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] font-sans">
                  <li>{cancelTargetType === 'sales' ? 'Phục hồi tăng tồn kho cho sản phẩm đã bán.' : 'Hạch toán giảm bớt lượng tồn kho vừa nhập.'}</li>
                  <li>Khấu trừ xóa nợ/ghi có cho đối tác tương thích.</li>
                  <li>Hóa đơn sẽ chuyển sang trạng thái <strong>Đã hủy</strong> vĩnh viễn (Lịch sử vẫn ghi nhận).</li>
                </ul>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Lý do hủy đơn *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  placeholder="Lý do: Khách đổi ý không mua nữa, nhập hàng sai mẫu, v.v..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Bỏ qua
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white cursor-pointer transition shadow-sm"
              >
                Đồng ý hủy giao dịch
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
