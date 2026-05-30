import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  User, 
  Phone, 
  MapPin, 
  History, 
  DollarSign, 
  X, 
  Check, 
  PlusCircle,
  Truck,
  Users
} from 'lucide-react';
import { Customer, Invoice, Supplier, ImportSlip } from '../types';
import { formatVND, formatDate, smartMatch } from '../utils';

interface CustomersProps {
  customers: Customer[];
  invoices: Invoice[];
  onAddNewCustomer: (newCustomer: Customer) => void;
  onCollectDebt: (maKH: string, amount: number) => void;

  // Supplier props
  suppliers: Supplier[];
  importSlips: ImportSlip[];
  onAddNewSupplier: (newSupplier: Supplier) => void;
  onPaySupplierDebt: (maNCC: string, amount: number) => void;

  isWarehouseStaff?: boolean;
}

export default function Customers({
  customers,
  invoices,
  onAddNewCustomer,
  onCollectDebt,
  suppliers,
  importSlips,
  onAddNewSupplier,
  onPaySupplierDebt,
  isWarehouseStaff = false
}: CustomersProps) {
  // Main Sub-Tab switcher: 'customers' | 'suppliers'
  const [partnerTab, setPartnerTab] = useState<'customers' | 'suppliers'>(
    isWarehouseStaff ? 'suppliers' : 'customers'
  );

  useEffect(() => {
    const handleOpenModal = () => {
      setPartnerTab('customers');
      setShowAddCustomerModal(true);
    };
    window.addEventListener('open-add-customer-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-customer-modal', handleOpenModal);
  }, []);

  // Customer state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Payment Collector states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentTarget, setPaymentTarget] = useState<Customer | null>(null);

  // New Customer creation form
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');

  // ----------------------------------------
  // Supplier states
  const [supSearchQuery, setSupSearchQuery] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Pay supplier state
  const [showSupPaymentModal, setShowSupPaymentModal] = useState(false);
  const [supPayAmount, setSupPayAmount] = useState<string>('');
  const [supPaymentTarget, setSupPaymentTarget] = useState<Supplier | null>(null);

  // New Supplier form state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supContactPerson, setSupContactPerson] = useState('');

  // ====================================
  // CUSTOMER LOGICS
  // ====================================
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      smartMatch(c.tenKH, searchQuery) || 
      smartMatch(c.sdt, searchQuery) || 
      smartMatch(c.diaChi, searchQuery)
    );
  }, [customers, searchQuery]);

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.maKH === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return invoices.filter(inv => inv.maKH === selectedCustomerId);
  }, [invoices, selectedCustomerId]);

  const handleOpenPayment = (cust: Customer) => {
    if (cust.conNo <= 0) {
      alert("Khách hàng này hiện đã hết công nợ, không cần thu thêm.");
      return;
    }
    setPaymentTarget(cust);
    setPayAmount(cust.conNo.toString());
    setShowPaymentModal(true);
  };

  const handleCollectDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    const parsedPay = parseFloat(payAmount);
    if (isNaN(parsedPay) || parsedPay <= 0) {
      alert("Vui lòng nhập số tiền thu nợ hợp lý.");
      return;
    }

    if (parsedPay > paymentTarget.conNo) {
      if (!confirm(`Số tiền thu vào (${formatVND(parsedPay)}) lớn hơn dư nợ hiện thời (${formatVND(paymentTarget.conNo)}). Bạn có tiếp tục?`)) {
        return;
      }
    }

    onCollectDebt(paymentTarget.maKH, parsedPay);
    alert(`Ghi nhận thu nợ thành công! Đã thu ${formatVND(parsedPay)} từ khách hàng ${paymentTarget.tenKH}.`);
    
    setPayAmount('');
    setPaymentTarget(null);
    setShowPaymentModal(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const prefix = 'KH';
    const nextNum = customers.length + 1;
    const maKH = `${prefix}${String(nextNum).padStart(6, '0')}`;

    const newCust: Customer = {
      maKH,
      tenKH: newCustName.trim(),
      sdt: newCustPhone.trim() || '09xxxxxx',
      diaChi: newCustAddr.trim() || 'Tại cửa hàng',
      tongTien: 0,
      daTra: 0,
      conNo: 0
    };

    onAddNewCustomer(newCust);

    // Reset fields
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddr('');
    setShowAddCustomerModal(false);
  };

  // ====================================
  // SUPPLIER LOGICS
  // ====================================
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      smartMatch(s.tenNCC, supSearchQuery) || 
      smartMatch(s.sdt, supSearchQuery) || 
      smartMatch(s.nguoiLienHe, supSearchQuery)
    );
  }, [suppliers, supSearchQuery]);

  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.maNCC === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  const supplierImportSlips = useMemo(() => {
    if (!selectedSupplierId) return [];
    return importSlips.filter(slip => slip.maNCC === selectedSupplierId);
  }, [importSlips, selectedSupplierId]);

  const handleOpenSupPayment = (sup: Supplier) => {
    if (sup.conNo <= 0) {
      alert("Cửa hàng hiện không còn công nợ nợ đọng với nhà CC này.");
      return;
    }
    setSupPaymentTarget(sup);
    setSupPayAmount(sup.conNo.toString());
    setShowSupPaymentModal(true);
  };

  const handlePaySupDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supPaymentTarget) return;

    const amount = parseFloat(supPayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Vui lòng nhập số tiền thanh toán nợ hợp lý.");
      return;
    }

    if (amount > supPaymentTarget.conNo) {
      if (!confirm(`Số tiền thanh toán (${formatVND(amount)}) lớn hơn dư nợ mình nợ họ (${formatVND(supPaymentTarget.conNo)}). Tiếp tục?`)) {
        return;
      }
    }

    onPaySupplierDebt(supPaymentTarget.maNCC, amount);
    alert(`Đã hoàn tất ghi nhận thanh toán trả nợ số tiền ${formatVND(amount)} cho nhà cung cấp ${supPaymentTarget.tenNCC}.`);

    setSupPayAmount('');
    setSupPaymentTarget(null);
    setShowSupPaymentModal(false);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const nextNum = suppliers.length + 1;
    const maNCC = `NCC${String(nextNum).padStart(6, '0')}`;

    const newSupplier: Supplier = {
      maNCC,
      tenNCC: supName.trim(),
      sdt: supPhone.trim() || '024xxxxxxx',
      diaChi: supAddress.trim() || 'Hà Nội',
      nguoiLienHe: supContactPerson.trim() || 'Đại diện',
      tongNhap: 0,
      daTra: 0,
      conNo: 0
    };

    onAddNewSupplier(newSupplier);

    // Reset fields
    setSupName('');
    setSupPhone('');
    setSupAddress('');
    setSupContactPerson('');
    setShowAddSupplierModal(false);
  };

  return (
    <div className="space-y-4 text-left font-sans">
      
      {/* Top filter section with gorgeous sub-tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
        
        {/* Unified Tab Selector */}
        <div className="space-y-1">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            {!isWarehouseStaff && (
              <button
                type="button"
                onClick={() => setPartnerTab('customers')}
                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer select-none ${
                  partnerTab === 'customers' 
                    ? 'bg-white text-[#E11D48] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Khách hàng
                <span className="bg-rose-50 text-[#E11D48] text-[9.5px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                  {customers.length}
                </span>
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setPartnerTab('suppliers')}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer select-none ${
                partnerTab === 'suppliers' || isWarehouseStaff
                  ? 'bg-white text-[#E11D48] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              Nhà cung cấp
              <span className="bg-rose-50 text-[#E11D48] text-[9.5px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                {suppliers.length}
              </span>
            </button>
          </div>
          
          <p className="text-[11px] text-slate-400 font-medium">
            {partnerTab === 'customers' 
              ? 'Quản lý thông tin, hóa đơn và theo dõi dư nợ của khách hàng của bạn.' 
              : 'Kiểm soát hàng nhập khẩu, công nợ phải trả cho nhà phân phối và tổng kho.'}
          </p>
        </div>

        {/* Action Button depending on active inner tab */}
        <div className="shrink-0">
          {partnerTab === 'customers' ? (
            <button
              type="button"
              id="register-cust-btn"
              onClick={() => setShowAddCustomerModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Đăng ký Khách mới
            </button>
          ) : (
            <button
              type="button"
              id="add-new-supplier-btn"
              onClick={() => setShowAddSupplierModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Thêm Nhà cung cấp mới
            </button>
          )}
        </div>
      </div>

      {partnerTab === 'customers' ? (
        // ====================================================
        // VIEW: CUSTOMER SECTION
        // ====================================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: LIST OF CUSTOMERS */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[640px]">
            
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E11D48] bg-white transition"
                  placeholder="Tìm tên, sđt, địa chỉ khách..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-[11px] font-medium">Không tìm thấy khách hàng nào</p>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerId === cust.maKH;
                  return (
                    <div
                      key={cust.maKH}
                      onClick={() => setSelectedCustomerId(cust.maKH)}
                      className={`p-3 text-xs cursor-pointer transition relative ${
                        isSelected 
                          ? 'bg-rose-50/20 border-l-4 border-[#E11D48]' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-slate-400 uppercase">{cust.maKH}</span>
                        {cust.conNo > 0 && (
                          <span className="text-[9px] bg-red-50 text-[#E11D48] border border-red-150 px-1.5 py-0.5 rounded font-bold font-mono">
                            Nợ: {formatVND(cust.conNo)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-extrabold text-slate-850 mt-1">{cust.tenKH}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {cust.sdt}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTIVE DETAILS & HISTORIES */}
          <div className="lg:col-span-2 space-y-4">
            {activeCustomer ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-6">
                
                {/* Profile Card Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-55 text-[#E11D48] px-2 py-0.5 rounded-full font-mono font-bold border border-rose-100">
                        {activeCustomer.maKH}
                      </span>
                      <h3 className="text-base font-bold text-slate-800">{activeCustomer.tenKH}</h3>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-500 font-sans font-medium">
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Điện thoại: {activeCustomer.sdt}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Địa chỉ giao: {activeCustomer.diaChi}</p>
                    </div>
                  </div>

                  {/* Direct Action */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Dư nợ hiện hành</span>
                    <div className="text-right">
                      <span className={`text-base font-extrabold font-mono ${activeCustomer.conNo > 0 ? 'text-[#E11D48]' : 'text-slate-500'}`}>
                        {formatVND(activeCustomer.conNo)}
                      </span>
                    </div>
                    {activeCustomer.conNo > 0 && (
                      <button
                        type="button"
                        id="collect-debt-trigger-btn"
                        onClick={() => handleOpenPayment(activeCustomer)}
                        className="mt-1 px-3 py-1 bg-green-600 hover:bg-green-700 font-bold text-[10px] text-white rounded-lg flex items-center gap-1 transition shadow-sm cursor-pointer select-none"
                      >
                        <DollarSign className="w-3 h-3" /> Thu nợ khách hàng
                      </button>
                    )}
                  </div>
                </div>

                {/* General Financial Metric Card block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-0.5">Tổng cộng mua hàng</span>
                    <strong className="text-slate-800 text-sm font-mono block">{formatVND(activeCustomer.tongTien)}</strong>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-0.5">Họ đã thanh toán</span>
                    <strong className="text-emerald-700 text-sm font-mono block">{formatVND(activeCustomer.daTra)}</strong>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-0.5">Cửa hàng đang nợ lại</span>
                    <strong className="text-red-700 text-sm font-mono block">{formatVND(activeCustomer.conNo)}</strong>
                  </div>
                </div>

                {/* Transactions histories */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-50">
                    <History className="w-4 h-4 text-slate-400" />
                    Lịch sử mua sắm ({customerInvoices.length} hóa đơn)
                  </h3>

                  {customerInvoices.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center font-medium">Khách hàng này chưa có hóa đơn phát sinh nào.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                      {customerInvoices.map((inv) => (
                        <div key={inv.maHD} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800">{inv.maHD}</span>
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                inv.trangThai === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {inv.trangThai}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded inline-block mt-1 font-mono font-medium">
                              Lập: {formatDate(inv.ngay)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-slate-900 font-mono">{formatVND(inv.tongTien)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Nợ: <strong className="font-mono text-rose-650">{formatVND(inv.conNo)}</strong></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-100 min-h-[300px] flex items-center justify-center font-medium">
                Vui lòng chọn một khách hàng trong danh sách bên trái để lấy thông tin chi tiết.
              </div>
            )}
          </div>

        </div>
      ) : (
        // ====================================================
        // VIEW: SUPPLIER SECTION (INTEGRATED)
        // ====================================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: SUPPLIERS */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[640px]">
            
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E11D48] bg-white transition"
                  placeholder="Tìm tên, SĐT, liên hệ..."
                  value={supSearchQuery}
                  onChange={(e) => setSupSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredSuppliers.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-[11px] font-medium">Không có nhà cung cấp nào được tìm thấy</p>
              ) : (
                filteredSuppliers.map((sup) => {
                  const isSelected = selectedSupplierId === sup.maNCC;
                  return (
                    <div
                      key={sup.maNCC}
                      onClick={() => setSelectedSupplierId(sup.maNCC)}
                      className={`p-3 text-xs cursor-pointer transition relative ${
                        isSelected 
                          ? 'bg-rose-50/20 border-l-4 border-[#E11D48]' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-slate-400 uppercase">{sup.maNCC}</span>
                        {sup.conNo > 0 && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold font-mono">
                            Mình nợ: {formatVND(sup.conNo)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-extrabold text-slate-800 mt-1">{sup.tenNCC}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {sup.nguoiLienHe} — {sup.sdt}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTIVE SUPPLIER DETAIL HISTORIES */}
          <div className="lg:col-span-2 space-y-4">
            {activeSupplier ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-6">
                
                {/* Profile Card Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                        {activeSupplier.maNCC}
                      </span>
                      <h3 className="text-base font-bold text-slate-800">{activeSupplier.tenNCC}</h3>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-500 font-medium">
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> SĐT: {activeSupplier.sdt}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Địa chỉ: {activeSupplier.diaChi}</p>
                      <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Người phụ trách: <strong>{activeSupplier.nguoiLienHe}</strong></p>
                    </div>
                  </div>

                  {/* Direct Action */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Cửa hàng nợ họ</span>
                    <div className="text-right">
                      <span className={`text-base font-extrabold font-mono ${activeSupplier.conNo > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        {formatVND(activeSupplier.conNo)}
                      </span>
                    </div>
                    {activeSupplier.conNo > 0 && (
                      <button
                        type="button"
                        id="pay-supplier-debt-trigger-btn"
                        onClick={() => handleOpenSupPayment(activeSupplier)}
                        className="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 font-bold text-[10px] text-white rounded-lg flex items-center gap-1 transition shadow-sm cursor-pointer select-none"
                      >
                        <DollarSign className="w-3 h-3" /> Chi trả trả nợ NCC
                      </button>
                    )}
                  </div>
                </div>

                {/* Financial Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-0.5">Tổng cộng tiền nhập hàng</span>
                    <strong className="text-slate-800 text-sm font-mono block">{formatVND(activeSupplier.tongNhap)}</strong>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-0.5">Mình đã thanh toán</span>
                    <strong className="text-emerald-700 text-sm font-mono block">{formatVND(activeSupplier.daTra)}</strong>
                  </div>
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 text-left">
                    <span className="text-slate-400 font-bold block pb-0.5">Dư nợ còn lại phải nợ</span>
                    <strong className="text-amber-700 text-sm font-mono block">{formatVND(activeSupplier.conNo)}</strong>
                  </div>
                </div>

                {/* Import Slip history */}
                <div className="space-y-3 font-sans">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-50">
                    <History className="w-4 h-4 text-slate-400" />
                    Các phiếu nhập hàng liên kết ({supplierImportSlips.length} phiếu)
                  </h3>

                  {supplierImportSlips.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center font-medium">Chưa có giao dịch nhập hàng nào từ nhà cung cấp này.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                      {supplierImportSlips.map((slip) => (
                        <div key={slip.maPN} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900">{slip.maPN}</span>
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                slip.trangThai === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {slip.trangThai}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded inline-block mt-1 font-mono font-medium">
                              Ngày nhận: {formatDate(slip.ngayMoi)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-slate-900 font-mono">{formatVND(slip.tongTien)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Cửa hàng nợ: <strong className="font-mono text-amber-700">{formatVND(slip.conNo)}</strong></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-100 min-h-[300px] flex items-center justify-center font-medium">
                Nhấp chuột chọn một Nhà cung cấp ở danh sách bên trái để lấy lịch sử nợ nần & phiếu nhập.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ====================================================
      // SHARED POPUP MODALS
      // ==================================================== */}

      {/* CUSTOMER DEBT COLLECTION MODAL */}
      {showPaymentModal && paymentTarget && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCollectDebtSubmit}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left font-sans animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-green-600" />
                Phiếu thu nợ khách hàng
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentTarget(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-655"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                <p>Khách hàng: <strong>{paymentTarget.tenKH}</strong></p>
                <p>SĐT khách: <strong>{paymentTarget.sdt}</strong></p>
                <p className="mt-1 text-red-700 font-bold font-mono">Dư nợ hiện hành: {formatVND(paymentTarget.conNo)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Số tiền thu thực tế (đ) *</label>
                <input
                  type="number"
                  required
                  placeholder="Nhập số tiền nhận từ khách..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center text-sm font-bold font-mono text-[#E11D48] bg-slate-50/50 outline-none focus:bg-white focus:border-[#E11D48]"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-sans font-bold">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentTarget(null);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 cursor-pointer hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
              >
                Xác nhận thu nợ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUPPLIER DEBT PAYMENT MODAL */}
      {showSupPaymentModal && supPaymentTarget && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handlePaySupDebtSubmit}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left font-sans animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Phiếu trả nợ nhà cung cấp
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowSupPaymentModal(false);
                  setSupPaymentTarget(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-655"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-700 font-medium">
                <p>Nhà cung cấp: <strong>{supPaymentTarget.tenNCC}</strong></p>
                <p>SĐT liên hệ: <strong>{supPaymentTarget.sdt}</strong></p>
                <p className="mt-1 text-red-700 font-bold font-mono">Cửa hàng đang nợ họ: {formatVND(supPaymentTarget.conNo)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Số tiền chi chi trả thực tế (đ) *</label>
                <input
                  type="number"
                  required
                  placeholder="Nhập số tiền chuyển cho NCC..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center text-sm font-bold font-mono text-emerald-700 bg-slate-50/50 outline-none focus:bg-white focus:border-amber-500"
                  value={supPayAmount}
                  onChange={(e) => setSupPayAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-sans font-bold">
              <button
                type="button"
                onClick={() => {
                  setShowSupPaymentModal(false);
                  setSupPaymentTarget(null);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 cursor-pointer hover:bg-slate-50 transition"
              >
                Đóng lại
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
              >
                Xác nhận chi trả
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUICK ADD NEW CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateCustomer}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left font-sans animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Đăng ký mới Khách hàng</h3>
              <button 
                type="button" 
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chị Lan - Hà Đông"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0988777666"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Địa chỉ cụ thể</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xa La, Hà Đông, Hà Nội"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={newCustAddr}
                  onChange={(e) => setNewCustAddr(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-sans font-bold">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="px-3 py-1.5 border border-slate-250 rounded-xl text-slate-600 cursor-pointer hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUICK ADD NEW SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateSupplier}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left font-sans animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Thêm mới Nhà cung cấp</h3>
              <button 
                type="button" 
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Tên Doanh nghiệp / Tổng kho *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty Sunhouse Việt Nam"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Số điện thoại liên lạc</label>
                <input
                  type="text"
                  placeholder="SĐT kinh doanh / tổng đài"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Địa chỉ trụ sở / kho bãi</label>
                <input
                  type="text"
                  placeholder="KCN Từ Liêm, Hà Nội..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Người đại diện / liên hệ trực tiếp</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chị Hòa - Phòng bán sỉ"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#E11D48]"
                  value={supContactPerson}
                  onChange={(e) => setSupContactPerson(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-sans font-bold">
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="px-3 py-1.5 border border-slate-250 rounded-xl text-slate-600 cursor-pointer hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold cursor-pointer"
              >
                Đăng ký Nhà cung cấp
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
