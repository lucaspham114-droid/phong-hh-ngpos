import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  User, 
  Trash2, 
  Plus, 
  Minus, 
  CornerDownLeft, 
  Save, 
  Printer, 
  X, 
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { Product, Customer, Invoice, InvoiceDetail, InventoryItem, SystemSettings } from '../types';
import { formatVND, smartMatch, generateId } from '../utils';

interface SalesProps {
  products: Product[];
  customers: Customer[];
  inventory: InventoryItem[];
  settings: SystemSettings;
  currentStaffName: string;
  onSaveInvoice: (newInvoice: Invoice) => void;
  onNavigate: (tab: string) => void;
  selectedTemplate: 'a5_01' | 'a5_02' | 'k58_01' | 'k58_02' | 'k80_01';
  onUpdateTemplate: (template: 'a5_01' | 'a5_02' | 'k58_01' | 'k58_02' | 'k80_01') => void;
  onPrintDraft?: (draftInvoice: Invoice) => void;
}

export default function Sales({
  products,
  customers,
  inventory,
  settings,
  currentStaffName,
  onSaveInvoice,
  onNavigate,
  selectedTemplate,
  onUpdateTemplate,
  onPrintDraft
}: SalesProps) {
  // POS Search states
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Active/selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('KH000004'); // default to Quick customer/Khách vãng lai
  
  // Cart items
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Financial values
  const [discount, setDiscount] = useState<number>(0);
  const [customerPaid, setCustomerPaid] = useState<string>(''); // string to ease inputs, parses to number

  useEffect(() => {
    const handleNewSale = () => {
      setCart([]);
      setDiscount(0);
      setCustomerPaid('');
      setProductSearch('');
      setCustomerSearch('');
      setSelectedCustomerId('KH000004'); // default
    };
    window.addEventListener('open-new-sale', handleNewSale);
    return () => window.removeEventListener('open-new-sale', handleNewSale);
  }, []);

  // Quick Customer Creation Popup state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');
  const [justAddedCustomer, setJustAddedCustomer] = useState<Customer | null>(null);

  // Local list of customers (merge with justAdded)
  const allCustomers = useMemo(() => {
    if (justAddedCustomer) {
      return [...customers, justAddedCustomer];
    }
    return customers;
  }, [customers, justAddedCustomer]);

  // Selected customer details
  const currentCustomer = useMemo(() => {
    return allCustomers.find(c => c.maKH === selectedCustomerId) || allCustomers[3];
  }, [allCustomers, selectedCustomerId]);

  // Filtered customers list for autocomplete search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return allCustomers.filter(c => 
      smartMatch(c.tenKH, customerSearch) || 
      smartMatch(c.sdt, customerSearch) ||
      smartMatch(c.diaChi, customerSearch)
    );
  }, [allCustomers, customerSearch]);

  // Filtered products list for POS Left side
  const filteredProducts = useMemo(() => {
    // Only active products
    const activeProds = products.filter(p => p.trangThai === 'Bán');
    if (!productSearch) {
      return activeProds.slice(0, 8); // default show 8 products
    }
    return activeProds.filter(p => 
      smartMatch(p.tenSP, productSearch, p.tuKhoa) || 
      smartMatch(p.maSP, productSearch) || 
      smartMatch(p.maVach, productSearch) ||
      smartMatch(p.nhomHang, productSearch)
    );
  }, [products, productSearch]);

  // Inventory maps
  const getStock = (maSP: string) => {
    const inv = inventory.find(i => i.maSP === maSP);
    return inv ? inv.tonHienTai : 0;
  };

  // Add Item to Cart
  const addToCart = (product: Product) => {
    const currentStock = getStock(product.maSP);
    
    setCart(prev => {
      const existing = prev.find(item => item.product.maSP === product.maSP);
      if (existing) {
        // Warning: Check stock limits
        if (existing.quantity >= currentStock) {
          alert(`Cảnh báo: Mặt hàng "${product.tenSP}" chỉ còn tồn ${currentStock} cái trong kho.`);
        }
        return prev.map(item => 
          item.product.maSP === product.maSP 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (currentStock <= 0) {
          alert(`Cảnh báo: Mặt hàng "${product.tenSP}" đã hết hàng trong kho. Vẫn tiếp tục bán âm?`);
        }
        return [...prev, { product, quantity: 1 }];
      }
    });
    setProductSearch('');
  };

  // Modify quantities from Input / Buttons
  const updateQuantity = (maSP: string, qty: number) => {
    const currentStock = getStock(maSP);
    if (qty <= 0) {
      removeFromCart(maSP);
      return;
    }
    
    if (qty > currentStock) {
      alert(`Số lượng yêu cầu vượt quá số lượng tồn ${currentStock} trong kho.`);
    }

    setCart(prev => 
      prev.map(item => 
        item.product.maSP === maSP ? { ...item, quantity: qty } : item
      )
    );
  };

  // Remove item
  const removeFromCart = (maSP: string) => {
    setCart(prev => prev.filter(item => item.product.maSP !== maSP));
  };

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.giaBan * item.quantity), 0);
  }, [cart]);

  const totalToPay = useMemo(() => {
    const total = subtotal - discount;
    return total < 0 ? 0 : total;
  }, [subtotal, discount]);

  const paidAmount = useMemo(() => {
    if (customerPaid === '') return totalToPay; // Default pays fully
    const parsed = parseFloat(customerPaid);
    return isNaN(parsed) ? 0 : parsed;
  }, [customerPaid, totalToPay]);

  const remainingDebt = useMemo(() => {
    const debt = totalToPay - paidAmount;
    return debt < 0 ? 0 : debt;
  }, [totalToPay, paidAmount]);

  // Trigger quick cash click options
  const handlePayFully = () => {
    setCustomerPaid(totalToPay.toString());
  };

  const handlePayZero = () => {
    setCustomerPaid('0');
  };

  // Print preview for draft receipt (phiếu tạm tính)
  const handlePrintTemporary = () => {
    if (cart.length === 0) {
      alert('Vui lòng thêm sản phẩm vào giỏ hàng trước khi in phiếu tạm.');
      return;
    }

    const maHD = 'HD-TAMTINH';
    const invoiceDetails: InvoiceDetail[] = cart.map(item => ({
      maHD,
      maSP: item.product.maSP,
      tenSP: item.product.tenSP,
      soLuong: item.quantity,
      donGia: item.product.giaBan,
      thanhTien: item.product.giaBan * item.quantity
    }));

    const draftInvoice: Invoice = {
      maHD,
      ngay: new Date().toISOString(),
      maKH: currentCustomer.maKH,
      tenKH: currentCustomer.tenKH,
      sdtKH: currentCustomer.sdt,
      tongTien: totalToPay,
      giamGia: discount,
      daTra: paidAmount,
      conNo: remainingDebt,
      nhanVien: currentStaffName,
      trangThai: 'Hoàn thành',
      details: invoiceDetails
    };

    if (onPrintDraft) {
      onPrintDraft(draftInvoice);
    }
  };

  // Clear state on cancel
  const handleCancelSales = () => {
    if (cart.length > 0) {
      if (confirm('Bạn có chắc chắn muốn hủy bỏ giỏ hàng bán lẻ này?')) {
        setCart([]);
        setDiscount(0);
        setCustomerPaid('');
        setProductSearch('');
        setCustomerSearch('');
      }
    } else {
      onNavigate('dashboard');
    }
  };

  // Add quick customer
  const handleAddQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newId = `KH${String(allCustomers.length + 1).padStart(6, '0')}`;
    const newCust: Customer = {
      maKH: newId,
      tenKH: newCustName.trim(),
      sdt: newCustPhone.trim() || '09xxxxxx',
      diaChi: newCustAddr.trim() || 'Tại cửa hàng',
      tongTien: 0,
      daTra: 0,
      conNo: 0
    };

    setJustAddedCustomer(newCust);
    setSelectedCustomerId(newId);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddr('');
    setShowAddCustomer(false);
  };

  // Validate and submit checkout
  const handleSaveInvoice = () => {
    if (cart.length === 0) {
      alert('Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.');
      return;
    }

    const maHD = generateId(settings.prefixHD, invoicesPlaceholder); // we will generate ID safely downstream
    
    const invoiceDetails: InvoiceDetail[] = cart.map(item => ({
      maHD,
      maSP: item.product.maSP,
      tenSP: item.product.tenSP,
      soLuong: item.quantity,
      donGia: item.product.giaBan,
      thanhTien: item.product.giaBan * item.quantity
    }));

    const invoice: Invoice = {
      maHD,
      ngay: new Date().toISOString(),
      maKH: currentCustomer.maKH,
      tenKH: currentCustomer.tenKH,
      sdtKH: currentCustomer.sdt,
      tongTien: totalToPay,
      giamGia: discount,
      daTra: paidAmount,
      conNo: remainingDebt,
      nhanVien: currentStaffName,
      trangThai: 'Hoàn thành',
      details: invoiceDetails
    };

    onSaveInvoice(invoice);
    
    // Clear cart reset state
    setCart([]);
    setDiscount(0);
    setCustomerPaid('');
    setProductSearch('');
    setCustomerSearch('');
    setSelectedCustomerId('KH000004'); // default
  };

  // Dummy list for generateId
  const invoicesPlaceholder: any[] = []; // Parent App will control true generation

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* LEFT PANEL: SMART PRODUCT SEARCH & CATALOG */}
      <div className="flex-1 space-y-4">
        
        {/* Search header bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Danh mục hàng hóa</h2>
            <span className="text-[10px] text-gray-500 font-mono">Nhân viên: <strong>{currentStaffName}</strong></span>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="product-sales-search"
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50/50 text-xs focus:ring-red-500 focus:border-red-500 font-sans"
              placeholder="Tìm sản phẩm [Tên / Mã / Viết tắt: ccd, ncd, ast / Loại...]"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <button 
                onClick={() => setProductSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 text-xs"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Catalog of Matched Products */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 mb-3 tracking-wider uppercase">Kết quả khớp tìm kiếm</h3>
          
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((p) => {
                const stock = getStock(p.maSP);
                const isInCart = cart.some(item => item.product.maSP === p.maSP);
                const isOutOfStock = stock <= 0;
                
                return (
                  <div 
                    key={p.maSP}
                    onClick={() => addToCart(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                      isInCart 
                        ? 'border-red-400 bg-red-50/20' 
                        : isOutOfStock 
                          ? 'border-gray-200 bg-gray-50/50 opacity-70' 
                          : 'border-gray-100 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono text-gray-400 font-bold uppercase">{p.maSP}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {p.nhomHang}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 mt-1 min-h-[32px] line-clamp-2">{p.tenSP}</h4>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50">
                      <div className="text-[10px] text-gray-500">
                        Giá: <strong className="text-gray-900 font-sans">{formatVND(p.giaBan)}</strong>
                      </div>
                      
                      {/* Stock indicator badge */}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                        isOutOfStock 
                          ? 'bg-red-50 text-red-600' 
                          : stock <= 5 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-green-50 text-green-700'
                      }`}>
                        Tồn: {stock} {p.dvt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick select groups */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button 
            type="button"
            onClick={() => setProductSearch('')}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer text-gray-700 transition"
          >
            Tất cả
          </button>
          <button 
            type="button"
            onClick={() => setProductSearch('Điện gia dụng')}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 cursor-pointer text-indigo-700 transition"
          >
            🔌 Điện gia dụng
          </button>
          <button 
            type="button"
            onClick={() => setProductSearch('Đồ nhựa')}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 border border-amber-100 hover:bg-amber-100 cursor-pointer text-amber-700 transition"
          >
            🪣 Đồ nhựa Duy Tân
          </button>
          <button 
            type="button"
            onClick={() => setProductSearch('Nhà bếp')}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-rose-50 border border-rose-100 hover:bg-rose-100 cursor-pointer text-rose-700 transition"
          >
            🍳 Nhà bếp / Chảo
          </button>
        </div>

      </div>

      {/* RIGHT PANEL: BILL CONTROL & CUSTOMER SELECTOR */}
      <div className="w-full lg:w-[420px] space-y-4">
        
        {/* Customer Selector Frame */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3 relative z-30">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-4 h-4 text-gray-500" />
              Khách hàng giao dịch
            </h2>
            <button
              type="button"
              id="add-quick-cust-btn"
              onClick={() => setShowAddCustomer(true)}
              className="text-[10px] text-red-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <UserPlus className="w-3 h-3" /> Thêm nhanh KH
            </button>
          </div>

          {/* Autocomplete Input */}
          <div className="relative">
            <input
              type="text"
              id="pos-customer-search-input"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-sans placeholder:text-gray-400"
              placeholder="Tìm khách hàng [Tên / SĐT / Địa chỉ]"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customerSearch && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <p className="p-3 text-center text-[11px] text-gray-400">Không có khách hàng trùng khớp.</p>
                ) : (
                  filteredCustomers.map((cust) => (
                    <div
                      key={cust.maKH}
                      onClick={() => {
                        setSelectedCustomerId(cust.maKH);
                        setCustomerSearch('');
                      }}
                      className="p-2 hover:bg-gray-50 text-[11px] cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <strong className="text-gray-800">{cust.tenKH}</strong>
                        <p className="text-[10px] text-gray-400">{cust.sdt} - {cust.diaChi}</p>
                      </div>
                      <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold">
                        Nợ cũ: {formatVND(cust.conNo)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Customer Card Display */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-slate-800">{currentCustomer.tenKH}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">SĐT: {currentCustomer.sdt}</p>
              <p className="text-[10px] text-slate-500">ĐC: {currentCustomer.diaChi}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block tracking-wider uppercase font-medium">Nợ cũ hiện tại</span>
              <span className={`font-mono font-bold mt-0.5 inline-block text-xs ${currentCustomer.conNo > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {formatVND(currentCustomer.conNo)}
              </span>
            </div>
          </div>
        </div>

        {/* The Cart list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          <div className="p-3 px-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">Giỏ hàng ({cart.length})</span>
            {cart.length > 0 && (
              <button 
                type="button" 
                onClick={() => setCart([])}
                className="text-[10px] text-rose-600 hover:underline cursor-pointer"
              >
                Xóa sạch giỏ
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Chưa có mặt hàng trong giỏ. Chọn sản phẩm bên trái để bắt đầu bán.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.maSP} className="p-3 flex items-start justify-between gap-2 text-xs">
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="font-bold text-gray-800 truncate" title={item.product.tenSP}>{item.product.tenSP}</p>
                    <p className="text-[10px] text-gray-500 font-sans">Đơn giá: {formatVND(item.product.giaBan)}</p>
                  </div>
                  
                  {/* Quantity and Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden h-7">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.maSP, item.quantity - 1)}
                        className="p-1 px-1.5 hover:bg-gray-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <input
                        type="number"
                        className="w-10 border-0 p-0 text-center text-xs font-bold text-gray-800 font-mono focus:ring-0"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.maSP, parseInt(e.target.value) || 1)}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.maSP, item.quantity + 1)}
                        className="p-1 px-1.5 hover:bg-gray-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.maSP)}
                      className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calculation Summary Panel */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
          
          {/* Print Template Configuration Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">⚙️ MẪU IN & PHIẾU TẠM</span>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.2 rounded font-sans">Mặc định</span>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Mẫu thiết kế liên quan</label>
                <select
                  id="sales-print-template-select"
                  className="w-full bg-white border border-slate-300 rounded-lg text-xs py-1.5 px-2 font-semibold text-slate-700 focus:ring-1 focus:ring-rose-500 cursor-pointer outline-none"
                  value={selectedTemplate}
                  onChange={(e) => onUpdateTemplate(e.target.value as any)}
                >
                  <option value="a5_01">Khổ A5 - Đại diện truyền thống (A5-01)</option>
                  <option value="a5_02">Khổ A5 - Chi tiết Ngân hàng & MXH (A5-02)</option>
                  <option value="k58_01">Khổ K58 - Siêu thị nhiệt Barcode (K58-01)</option>
                  <option value="k58_02">Khổ K58 - Bán lẻ liên hệ (K58-02)</option>
                  <option value="k80_01">Khổ K80 - Nhiệt chuyên nghiệp (K80-01)</option>
                </select>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  id="print-draft-receipt-action"
                  onClick={handlePrintTemporary}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> In phiếu tạm tính
                </button>
              )}
            </div>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Tiền hàng nguyên gốc:</span>
            <span className="font-semibold text-gray-950 font-mono">{formatVND(subtotal)}</span>
          </div>

          {/* Discount Block */}
          <div className="space-y-1 pb-1.5 border-b border-gray-50">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Gợi ý chiết khấu giảm giá:</span>
              <span className="font-bold text-red-600 font-mono">-{formatVND(discount)}</span>
            </div>
            
            {/* Range slider for discount */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={Math.min(subtotal, 1000000)}
                step="5000"
                className="w-full accent-red-600"
                value={discount}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                step="1000"
                id="discount-input"
                className="w-20 px-1 py-0.5 border border-gray-200 text-xs font-mono font-bold text-right rounded"
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>

          {/* NET Pay */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-bold text-gray-900 uppercase">Khách cần thanh toán:</span>
            <span className="text-lg font-extrabold text-red-600 font-mono">{formatVND(totalToPay)}</span>
          </div>

          {/* Customer paid portion */}
          <div className="space-y-1.5 border-t border-dashed border-gray-200 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-700 font-medium">Số tiền khách đã trả (đ):</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handlePayFully}
                  className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold cursor-pointer"
                >
                  Trả hết
                </button>
                <button
                  type="button"
                  onClick={handlePayZero}
                  className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold cursor-pointer"
                >
                  Ghi nợ
                </button>
              </div>
            </div>

            <input
              type="number"
              id="pos-customer-paid-input"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-center text-sm font-bold font-mono text-emerald-700"
              placeholder={`Mặc định trả đầy đủ: ${totalToPay.toLocaleString('vi-VN')} đ`}
              value={customerPaid}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) {
                  setCustomerPaid(val);
                }
              }}
            />
          </div>

          {/* Result Debt */}
          <div className="flex justify-between items-center text-xs pb-1">
            <span className="text-gray-700">Công nợ mới ghi nhận:</span>
            <span className={`font-extrabold font-mono ${remainingDebt > 0 ? 'text-red-600' : 'text-slate-500'}`}>
              {formatVND(remainingDebt)}
            </span>
          </div>

          {/* Primary Buttons panel */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              id="cancel-pos-btn"
              onClick={handleCancelSales}
              className="p-2.5 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-semibold tracking-wide text-gray-700 cursor-pointer flex items-center justify-center gap-1 transition"
            >
              <X className="w-4 h-4" /> Bỏ qua / Hủy
            </button>
            <button
              type="button"
              id="save-checkout-btn"
              onClick={handleSaveInvoice}
              disabled={cart.length === 0}
              className={`p-2.5 rounded-xl text-xs font-bold tracking-wider text-white shadow-sm flex items-center justify-center gap-1.5 transition ${
                cart.length === 0 
                  ? 'bg-red-400 opacity-60 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 cursor-pointer animate-pulse'
              }`}
            >
              <Save className="w-4 h-4" /> THANH TOÁN
            </button>
          </div>

        </div>

      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddQuickCustomer}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">Thêm khách hàng nhanh</h3>
              <button 
                type="button" 
                onClick={() => setShowAddCustomer(false)}
                className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Họ & tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chị Lan - Hà Đông"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0988777666"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Địa chỉ cụ thể</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xa La, Hà Đông, Hà Nội"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={newCustAddr}
                  onChange={(e) => setNewCustAddr(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white cursor-pointer"
              >
                Thêm khách
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
