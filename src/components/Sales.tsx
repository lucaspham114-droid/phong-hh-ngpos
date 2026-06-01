import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  Trash2, 
  Plus, 
  Minus, 
  Save, 
  Printer, 
  X, 
  ArrowLeft,
  UserPlus,
  MoreVertical,
  Tag,
  Barcode,
  Grid,
  Check,
  RotateCcw,
  RefreshCw,
  Coins,
  Settings,
  HelpCircle,
  FileSpreadsheet
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

interface CartItem {
  product: Product;
  quantity: number;
  unitPriceOverride?: number; // custom unit price
  discountValue?: number;     // custom discount
  discountType?: 'VND' | '%'; // custom discount type
}

interface InvoiceTab {
  id: string;
  name: string;
  cart: CartItem[];
  selectedCustomerId: string;
  customerSearch: '';
  customerPaid: string;
  discount: number;
  note: string;
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
  
  // Multiple tabs support to match KiotViet
  const [tabs, setTabs] = useState<InvoiceTab[]>([
    {
      id: 'tab_1',
      name: 'Hóa đơn 1',
      cart: [],
      selectedCustomerId: 'KH000004', // Default to Walk-in customer ("Khách vãng lai")
      customerSearch: '',
      customerPaid: '',
      discount: 0,
      note: ''
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  // Active tab state extraction
  const activeTab = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  const cart = activeTab.cart;
  const selectedCustomerId = activeTab.selectedCustomerId;
  const customerPaid = activeTab.customerPaid;
  const discount = activeTab.discount;
  const note = activeTab.note;

  // Update a field inside the active tab
  const updateActiveTabState = (updater: Partial<InvoiceTab> | ((t: InvoiceTab) => InvoiceTab)) => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        if (typeof updater === 'function') {
          return updater(t);
        }
        return { ...t, ...updater };
      }
      return t;
    }));
  };

  // State for active popup over Price Input per item
  const [activePricePopupIndex, setActivePricePopupIndex] = useState<number | null>(null);

  // States for search inputs
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Kcash' | 'Ktransfer' | 'Kcard'>('Kcash');

  // Trigger add/create client popup
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');
  const [justAddedCustomer, setJustAddedCustomer] = useState<Customer | null>(null);

  // Focus ref for inputs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live Clock display
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${dd}/${mm}/${yyyy} ${hh}:${min}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Merge with quick created customers
  const allCustomers = useMemo(() => {
    if (justAddedCustomer) {
      return [...customers, justAddedCustomer];
    }
    return customers;
  }, [customers, justAddedCustomer]);

  // Selected client
  const currentCustomer = useMemo(() => {
    return allCustomers.find(c => c.maKH === selectedCustomerId) || allCustomers.find(c => c.maKH === 'KH000004') || allCustomers[0];
  }, [allCustomers, selectedCustomerId]);

  // Filter client search matches
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return allCustomers.filter(c => 
      smartMatch(c.tenKH, customerSearch) || 
      smartMatch(c.sdt, customerSearch) ||
      smartMatch(c.diaChi, customerSearch)
    );
  }, [allCustomers, customerSearch]);

  // Match products from search box in the Header
  const matchedProdList = useMemo(() => {
    if (!productSearch) return [];
    const activeProds = products.filter(p => p.trangThai === 'Bán');
    return activeProds.filter(p => 
      smartMatch(p.tenSP, productSearch, p.tuKhoa) || 
      smartMatch(p.maSP, productSearch) || 
      smartMatch(p.maVach, productSearch) ||
      smartMatch(p.nhomHang, productSearch)
    );
  }, [products, productSearch]);

  const getStock = (maSP: string) => {
    const inv = inventory.find(i => i.maSP === maSP);
    return inv ? inv.tonHienTai : 0;
  };

  // Add tab function
  const handleAddNewTab = () => {
    const nextTabId = `tab_${Date.now()}`;
    const nextTabName = `Hóa đơn ${tabs.length + 1}`;
    const newTab: InvoiceTab = {
      id: nextTabId,
      name: nextTabName,
      cart: [],
      selectedCustomerId: 'KH000004',
      customerSearch: '',
      customerPaid: '',
      discount: 0,
      note: ''
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(nextTabId);
  };

  // Remove tab function
  const handleRemoveTab = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one
    
    const activeIndex = tabs.findIndex(t => t.id === activeTabId);
    const updatedTabs = tabs.filter(t => t.id !== targetId);
    setTabs(updatedTabs);

    if (activeTabId === targetId) {
      // Shift focus
      const fallbackIndex = Math.max(0, activeIndex - 1);
      setActiveTabId(updatedTabs[fallbackIndex].id);
    }
  };

  // Add Item to active tab cart
  const handleAddItemToCart = (p: Product) => {
    const stock = getStock(p.maSP);
    
    updateActiveTabState(tab => {
      const existingIndex = tab.cart.findIndex(item => item.product.maSP === p.maSP);
      let updatedCart = [...tab.cart];

      if (existingIndex > -1) {
        const existingItem = updatedCart[existingIndex];
        if (existingItem.quantity >= stock) {
          alert(`Cảnh báo: Mặt hàng "${p.tenSP}" chỉ còn tồn ${stock} cái trong kho.`);
        }
        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1
        };
      } else {
        if (stock <= 0) {
          alert(`Cảnh báo: Mặt hàng "${p.tenSP}" đã hết hàng trong kho. Vẫn tiếp tục bán âm?`);
        }
        updatedCart.push({
          product: p,
          quantity: 1,
          discountValue: 0,
          discountType: 'VND',
          unitPriceOverride: p.giaBan
        });
      }

      return {
        ...tab,
        cart: updatedCart
      };
    });

    setProductSearch('');
    // Auto-focus back to product search
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Modify quantity inside active cart
  const handleUpdateCartItemQty = (maSP: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(maSP);
      return;
    }

    const stock = getStock(maSP);
    if (qty > stock) {
      alert(`Số lượng yêu cầu vượt quá số lượng tồn ${stock} trong kho.`);
    }

    updateActiveTabState(tab => {
      return {
        ...tab,
        cart: tab.cart.map(item => 
          item.product.maSP === maSP ? { ...item, quantity: qty } : item
        )
      };
    });
  };

  // Remove individual item from cart
  const handleRemoveCartItem = (maSP: string) => {
    updateActiveTabState(tab => {
      return {
        ...tab,
        cart: tab.cart.filter(item => item.product.maSP !== maSP)
      };
    });
  };

  // Calculate pricing breakdown per item in cart
  const getSellingPrice = (item: CartItem) => {
    const originalPrice = item.product.giaBan;
    if (item.unitPriceOverride !== undefined) {
      return item.unitPriceOverride;
    }
    return originalPrice;
  };

  const getSubtotalForItem = (item: CartItem) => {
    return getSellingPrice(item) * item.quantity;
  };

  // Total invoice calculated sum
  const subtotalSum = useMemo(() => {
    return cart.reduce((sum, item) => sum + getSubtotalForItem(item), 0);
  }, [cart]);

  const totalToPay = useMemo(() => {
    const total = subtotalSum - discount;
    return total < 0 ? 0 : total;
  }, [subtotalSum, discount]);

  // Payment defaults and change computed values
  const paidSecAmount = useMemo(() => {
    if (customerPaid === '') return totalToPay;
    const parsed = parseFloat(customerPaid);
    return isNaN(parsed) ? 0 : parsed;
  }, [customerPaid, totalToPay]);

  const remainingChange = useMemo(() => {
    const extra = paidSecAmount - totalToPay;
    return extra < 0 ? 0 : extra;
  }, [totalToPay, paidSecAmount]);

  const currentDebtAmount = useMemo(() => {
    const debt = totalToPay - paidSecAmount;
    return debt < 0 ? 0 : debt;
  }, [totalToPay, paidSecAmount]);

  // Generate suggested quick cash payments
  const suggestedCashTotals = useMemo(() => {
    const t = totalToPay;
    if (t === 0) return [0];
    
    // Round factors: exact, next 1k, next 5k, next 10k, next 20k, etc.
    const exact = t;
    const next5k = Math.ceil(t / 5000) * 5000;
    const next10k = Math.ceil(t / 10000) * 10000;
    const next20k = Math.ceil(t / 20000) * 20000;
    const next50k = Math.ceil(t / 50000) * 50000;
    const next100k = Math.ceil(t / 100000) * 100000;
    const next500k = Math.ceil(t / 500000) * 500000;

    const uniqueOptions = Array.from(new Set([exact, next5k, next10k, next20k, next50k, next100k, next500k]))
      .filter(x => x >= t)
      .slice(0, 6);

    return uniqueOptions;
  }, [totalToPay]);

  // Cancel sales reset active cart
  const handleCancelSales = () => {
    if (cart.length > 0) {
      if (confirm('Bạn có chắc chắn muốn hủy bỏ hóa đơn bán lẻ này?')) {
        updateActiveTabState({
          cart: [],
          discount: 0,
          customerPaid: '',
          note: '',
          selectedCustomerId: 'KH000004'
        });
      }
    } else {
      onNavigate('dashboard');
    }
  };

  // Submit and fire onSaveInvoice
  const handleCheckoutInvoice = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống! Vui lòng chọn sản phẩm trước khi thanh toán.');
      return;
    }

    const mhdPlaceholder = 'HD-TEMP';
    const invoiceDetails: InvoiceDetail[] = cart.map(item => ({
      maHD: mhdPlaceholder,
      maSP: item.product.maSP,
      tenSP: item.product.tenSP,
      soLuong: item.quantity,
      donGia: getSellingPrice(item),
      thanhTien: getSubtotalForItem(item)
    }));

    const finalInvoice: Invoice = {
      maHD: mhdPlaceholder,
      ngay: new Date().toISOString(),
      maKH: currentCustomer.maKH,
      tenKH: currentCustomer.tenKH,
      sdtKH: currentCustomer.sdt,
      tongTien: totalToPay,
      giamGia: discount,
      daTra: paidSecAmount,
      conNo: currentDebtAmount,
      nhanVien: currentStaffName,
      trangThai: 'Hoàn thành',
      details: invoiceDetails
    };

    onSaveInvoice(finalInvoice);

    // Reset this tab
    updateActiveTabState({
      cart: [],
      discount: 0,
      customerPaid: '',
      note: '',
      selectedCustomerId: 'KH000004'
    });
  };

  const handlePrintTemporary = () => {
    if (cart.length === 0) return;
    const mhdPlaceholder = 'HD-TAMTINH';
    const invoiceDetails: InvoiceDetail[] = cart.map(item => ({
      maHD: mhdPlaceholder,
      maSP: item.product.maSP,
      tenSP: item.product.tenSP,
      soLuong: item.quantity,
      donGia: getSellingPrice(item),
      thanhTien: getSubtotalForItem(item)
    }));

    const draftInvoice: Invoice = {
      maHD: mhdPlaceholder,
      ngay: new Date().toISOString(),
      maKH: currentCustomer.maKH,
      tenKH: currentCustomer.tenKH,
      sdtKH: currentCustomer.sdt,
      tongTien: totalToPay,
      giamGia: discount,
      daTra: paidSecAmount,
      conNo: currentDebtAmount,
      nhanVien: currentStaffName,
      trangThai: 'Hoàn thành',
      details: invoiceDetails
    };

    if (onPrintDraft) {
      onPrintDraft(draftInvoice);
    }
  };

  // Add quick client list builder
  const handleAddQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newId = `KH${String(allCustomers.length + 1).padStart(6, '0')}`;
    const newCust: Customer = {
      maKH: newId,
      tenKH: newCustName.trim(),
      sdt: newCustPhone.trim() || '0901234567',
      diaChi: newCustAddr.trim() || 'Khách vãng lai tại quầy',
      tongTien: 0,
      daTra: 0,
      conNo: 0
    };

    setJustAddedCustomer(newCust);
    updateActiveTabState({ selectedCustomerId: newId });
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddr('');
    setShowAddCustomer(false);
  };

  // Popover calculator logic to change price overrides per product row in CART
  const handlePricePopoverChange = (index: number, key: 'base' | 'discount' | 'sell', val: number, type?: 'VND' | '%') => {
    const freshCart = [...cart];
    const item = { ...freshCart[index] };
    const base = item.product.giaBan;

    if (key === 'base') {
      // Just keep it or treat as base
    } else if (key === 'discount') {
      const mode = type || item.discountType || 'VND';
      const discountVal = val;
      const finalPrice = mode === 'VND' ? base - discountVal : base * (1 - discountVal / 100);

      item.discountValue = discountVal;
      item.discountType = mode;
      item.unitPriceOverride = Math.max(0, finalPrice);
    } else if (key === 'sell') {
      const sellPrice = val;
      const discountVal = base - sellPrice;
      const discountPct = base > 0 ? (discountVal / base) * 100 : 0;

      item.unitPriceOverride = Math.max(0, sellPrice);
      item.discountType = item.discountType || 'VND';
      if (item.discountType === 'VND') {
        item.discountValue = discountVal;
      } else {
        item.discountValue = Math.max(0, Math.min(100, discountPct));
      }
    }

    freshCart[index] = item;
    updateActiveTabState({ cart: freshCart });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[550px] bg-slate-100/50 rounded-xl overflow-hidden shadow-inner font-sans border border-slate-200" id="pos-cashier-root">
      
      {/* 1. TOP HEADER - BLUE KIOTVIET SYSTEM STYLE BAR */}
      <div className="h-14 bg-[#1E3A8A] flex items-center justify-between px-4 text-white select-none shrink-0" id="pos-kiot-header">
        
        {/* Left side: Magnifying Search and barcode */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md relative z-40">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-300">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              ref={searchInputRef}
              className="w-full bg-blue-900/60 pl-8 pr-8 py-1.5 rounded-md text-xs placeholder-slate-300 border border-blue-800 text-white focus:outline-none focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-blue-400 font-sans"
              placeholder="Tìm hàng hóa [Tên / Mã vạch / SKU]..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <button 
                type="button"
                onClick={() => setProductSearch('')}
                className="absolute inset-y-0 right-2 flex items-center text-slate-300 hover:text-white text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Barcode Simulator Button */}
          <button
            type="button"
            title="Thử quét mã vạch sản phẩm ngẫu nhiên"
            onClick={() => {
              // Select direct random active item to scan
              const target = products.filter(p => p.trangThai === 'Bán');
              if (target.length > 0) {
                const randProd = target[Math.floor(Math.random() * target.length)];
                handleAddItemToCart(randProd);
              }
            }}
            className="p-1.5 bg-blue-900/80 hover:bg-blue-800 rounded border border-blue-800 text-slate-200 hover:text-white transition cursor-pointer shrink-0"
          >
            <Barcode className="w-4 h-4" />
          </button>

          {/* Floated Dropdown matching product entries */}
          {productSearch && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 text-slate-800 z-50">
              {matchedProdList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy sản phẩm phù hợp.</div>
              ) : (
                matchedProdList.map((p) => {
                  const stock = getStock(p.maSP);
                  return (
                    <div 
                      key={p.maSP}
                      onClick={() => handleAddItemToCart(p)}
                      className="p-2 hover:bg-blue-50/50 cursor-pointer flex gap-3 items-center text-xs transition duration-150"
                    >
                      <div className="w-8 h-8 rounded bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                        {p.image ? (
                          <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Grid className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{p.tenSP}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {p.maSP} | {p.maVach ? `MV: ${p.maVach}` : p.nhomHang}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black font-mono text-emerald-700">{formatVND(p.giaBan)}</p>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
                        }`}>Tồn: {stock}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Center Section: Tabs manager */}
        <div className="flex items-end gap-1 h-full pl-6 overflow-x-auto self-end max-w-md scrollbar-none">
          {tabs.map((t, idx) => {
            const isActive = t.id === activeTabId;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setActiveTabId(t.id);
                  setActivePricePopupIndex(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md text-xs font-bold leading-none select-none cursor-pointer border-t border-x transition-all ${
                  isActive 
                    ? 'bg-slate-100/50 hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm relative z-10 font-black' 
                    : 'bg-blue-950/60 border-transparent hover:bg-blue-900 text-slate-350 hover:text-white'
                }`}
              >
                <span>{t.name}</span>
                {tabs.length > 1 && (
                  <button 
                    type="button" 
                    onClick={(e) => handleRemoveTab(e, t.id)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white text-xs opacity-60 hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          
          <button
            type="button"
            onClick={handleAddNewTab}
            className="p-1 px-2.5 mb-1.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-sm rounded cursor-pointer self-center"
            title="Mở thêm hóa đơn mới (vận hành đa phiên)"
          >
            +
          </button>
        </div>

        {/* Right side: Utilities icons and name */}
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] font-mono leading-none hidden xl:block">
            <span className="font-bold text-slate-200 block">Thu ngân: <strong className="text-white font-sans">{currentStaffName}</strong></span>
            <span className="text-[9.5px] mt-0.5 block text-slate-400">{currentTimeStr || 'PH POS'}</span>
          </div>
          
          {/* Refresh Action */}
          <button 
            type="button" 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('sync-firebase'));
              alert("Đang đồng bộ dữ liệu Hệ thống với máy chủ Firestore Cloud...");
            }}
            className="p-1.5 rounded bg-blue-900 hover:bg-blue-800 text-slate-200 hover:text-white transition cursor-pointer"
            title="Đồng bộ thủ công"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button 
            type="button" 
            onClick={() => onNavigate('dashboard')}
            className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md font-bold tracking-wide transition flex items-center gap-1 select-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> TRỞ VỀ
          </button>
        </div>
      </div>

      {/* 2. MAIN CASHIER BODY SECTION */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden" id="pos-cashier-split">
        
        {/* LEFT CANVAS: ADDED ITEMS LIST (75% screen scope) */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-50/70" id="pos-items-table-area">
          
          <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            
            {/* Table headers line */}
            <div className="grid grid-cols-12 bg-slate-100 p-2.5 border-b border-slate-200 text-[10.5px] font-black text-slate-600 uppercase font-sans shrink-0 items-center select-none">
              <div className="col-span-1 text-center font-mono">STT</div>
              <div className="col-span-1 text-center">Ảnh</div>
              <div className="col-span-4 pl-2">Mã vạch / Tên hàng hóa</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right pr-4">Đơn giá bán</div>
              <div className="col-span-2 text-right pr-2">Thành tiền</div>
            </div>

            {/* Scrollable list cart mapping */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-2.5">
                    <Barcode className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">Chưa có sản phẩm nào được chọn!</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Sử dụng thanh tìm kiếm phía trên đầu trang để quét hoặc chọn hàng nhanh vào hóa đơn hiện hành.</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const numIndex = cart.length - idx; // Display index like the picture (3, 2, 1)
                  const originalPrice = item.product.giaBan;
                  const sellPrice = getSellingPrice(item);
                  const lineTotal = getSubtotalForItem(item);
                  const isPopupOpen = activePricePopupIndex === idx;

                  // Compute discounts for showing in popovers
                  const currentDiscVal = item.discountValue !== undefined ? item.discountValue : 0;
                  const currentDiscType = item.discountType || 'VND';

                  return (
                    <div 
                      key={item.product.maSP} 
                      className={`grid grid-cols-12 p-3 font-sans items-center group transition duration-150 border-l-[3px] ${
                        isPopupOpen ? 'border-blue-500 bg-blue-50/10' : 'border-transparent hover:bg-slate-50/50'
                      }`}
                    >
                      
                      {/* Index & Delete Button */}
                      <div className="col-span-1 flex flex-col items-center justify-center select-none relative">
                        <span className="font-mono font-bold text-xs text-slate-450 group-hover:hidden">{numIndex}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item.product.maSP)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer hidden group-hover:inline-block transition"
                          title="Xóa dòng mặt hàng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* circular image thumbnail */}
                      <div className="col-span-1 flex justify-center items-center select-none">
                        <div className="w-9 h-9 rounded-full bg-slate-100/80 shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
                          {item.product.image ? (
                            <img src={item.product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Grid className="w-4.5 h-4.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Barcode SKU & Title column and popup positioning context */}
                      <div className="col-span-4 pl-2 relative">
                        <span className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase select-all">
                          {item.product.maVach || item.product.maSP}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 tracking-tight mt-1 group-hover:text-blue-700 transition-colors" title={item.product.tenSP}>
                          {item.product.tenSP}
                        </h4>
                      </div>

                      {/* Quantity display/underlined input */}
                      <div className="col-span-2 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartItemQty(item.product.maSP, item.quantity - 1)}
                          className="w-5 h-5 rounded-md hover:bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          -
                        </button>
                        
                        <input
                          type="number"
                          className="w-11 border-b-2 border-t-0 border-x-0 border-slate-300 focus:border-blue-600 bg-transparent py-0 px-0.5 text-center text-xs font-bold text-slate-900 focus:ring-0 font-mono"
                          value={item.quantity}
                          onChange={(e) => handleUpdateCartItemQty(item.product.maSP, parseInt(e.target.value) || 1)}
                        />

                        <button
                          type="button"
                          onClick={() => handleUpdateCartItemQty(item.product.maSP, item.quantity + 1)}
                          className="w-5 h-5 rounded-md hover:bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Clickable Unit Price to pull up custom discount list popover */}
                      <div className="col-span-2 text-right pr-4 relative">
                        <span 
                          onClick={() => setActivePricePopupIndex(isPopupOpen ? null : idx)}
                          className="font-mono font-bold text-xs text-slate-900 border-b border-dashed border-slate-400 hover:border-blue-600 hover:text-blue-600 cursor-pointer transition py-0.5 inline-block"
                          title="Hành động tinh chỉnh giá bán thực tế"
                        >
                          {formatVND(sellPrice)}
                        </span>

                        {isPopupOpen && (
                          <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl p-4 w-60 text-left z-50 text-slate-800 font-sans animate-in fade-in slide-in-from-top-1">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn giá bán chi tiết</span>
                              <button 
                                type="button" 
                                onClick={() => setActivePricePopupIndex(null)}
                                className="text-slate-400 hover:text-slate-700 font-black text-xs"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="space-y-3 text-xs">
                              {/* 1. Base price of reference item */}
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">Đơn giá gốc:</span>
                                <span className="font-mono font-bold text-slate-800">{formatVND(originalPrice)}</span>
                              </div>

                              {/* 2. Interactive Discount input & Switch selectors */}
                              <div className="space-y-1">
                                <span className="text-slate-500 block mb-1">Giảm giá:</span>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number"
                                    className="w-24 px-2 py-1 border border-slate-300 rounded text-xs font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={currentDiscVal}
                                    onChange={(e) => handlePricePopoverChange(idx, 'discount', Math.max(0, parseFloat(e.target.value) || 0))}
                                  />
                                  <div className="flex border border-slate-200 rounded overflow-hidden divide-x divide-slate-200 font-bold h-7 shrink-0">
                                    <button 
                                      type="button"
                                      onClick={() => handlePricePopoverChange(idx, 'discount', currentDiscVal, 'VND')}
                                      className={`px-2 text-[10px] transition cursor-pointer select-none ${
                                        currentDiscType === 'VND' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                      }`}
                                    >
                                      đ
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handlePricePopoverChange(idx, 'discount', currentDiscVal, '%')}
                                      className={`px-2 text-[10px] transition cursor-pointer select-none ${
                                        currentDiscType === '%' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                      }`}
                                    >
                                      %
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Overridden Target Selling Price */}
                              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                <span className="text-slate-500 block">Giá bán thực tế:</span>
                                <div className="relative">
                                  <input 
                                    type="number"
                                    className="w-full pl-2 pr-7 py-1 border-b-2 border-slate-300 focus:border-blue-600 font-mono font-extrabold text-blue-700 text-sm focus:outline-none text-right bg-blue-50/20"
                                    value={sellPrice}
                                    onChange={(e) => handlePricePopoverChange(idx, 'sell', Math.max(0, parseInt(e.target.value) || 0))}
                                  />
                                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                                  </div>
                                </div>
                              </div>

                              {/* Submit button inside popover */}
                              <button
                                type="button"
                                onClick={() => setActivePricePopupIndex(null)}
                                className="w-full mt-2 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-md text-[10.5px] uppercase tracking-wide cursor-pointer transition shadow-sm text-center"
                              >
                                Xác nhận áp dụng
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Subtotal line text */}
                      <div className="col-span-2 text-right pr-2">
                        <span className="font-mono font-black text-xs text-slate-900">
                          {formatVND(lineTotal)}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom notes line helper */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3 shrink-0 select-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                📝 Ghi chú đơn:
              </span>
              <input
                type="text"
                className="flex-1 bg-transparent border-0 border-b border-transparent focus:border-slate-300 py-0.5 px-0 focus:outline-none focus:ring-0 text-xs text-slate-700 placeholder:text-slate-300 font-sans"
                placeholder="Nhập ghi chú hóa đơn này nếu cần (mã giao dịch riêng, giao hàng, v.v.)..."
                value={note}
                onChange={(e) => updateActiveTabState({ note: e.target.value })}
              />
            </div>

          </div>

        </div>

        {/* RIGHT PANEL: PAYMENT SUMMARY SIDEBAR (25% screen scope) */}
        <div className="w-full lg:w-[360px] bg-white overflow-y-auto p-4 flex flex-col justify-between shrink-0" id="pos-billing-sidebar">
          
          {/* Top section: Customer metadata & Info */}
          <div className="space-y-3.5">
            
            {/* 1. DateTime Clock and NV Indicator card */}
            <div className="flex justify-between items-center text-[10.5px] text-slate-400 font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-100 select-none">
              <div className="flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-slate-800 uppercase">Phong Hung - {activeTab.name}</span>
              </div>
              <span className="font-mono text-slate-500 font-semibold">{currentTimeStr}</span>
            </div>

            {/* 2. Customer billing receiver selector box */}
            <div className="space-y-2 relative z-30">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none">
                  <User className="w-3.5 h-3.5" /> Khách hàng
                </span>
                
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="text-[10px] text-blue-700 hover:text-blue-900 font-extrabold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <UserPlus className="w-3 h-3" /> THÊM KH
                </button>
              </div>

              {/* Autocomplete Input */}
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-sans focus:ring-1 focus:ring-blue-500 bg-slate-50/40"
                  placeholder="🔍 Tìm khách [Tên / SĐT]..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                
                {customerSearch && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-250 rounded-lg shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 z-50 text-[11px]">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-3 text-center text-slate-400">Không tìm thấy khách hàng phù hợp.</p>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.maKH}
                          onClick={() => {
                            updateActiveTabState({ selectedCustomerId: c.maKH });
                            setCustomerSearch('');
                          }}
                          className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition"
                        >
                          <div>
                            <strong className="text-slate-800">{c.tenKH}</strong>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.sdt} - {c.diaChi}</p>
                          </div>
                          {c.conNo > 0 && (
                            <span className="bg-red-50 text-red-600 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
                              Nợ cũ: {formatVND(c.conNo)}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Card Display */}
              <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 text-xs leading-normal">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-xs">{currentCustomer.tenKH}</span>
                  <span className="font-mono text-[10px] text-slate-400">{currentCustomer.sdt}</span>
                </div>
                {currentCustomer.conNo > 0 && (
                  <div className="mt-1.5 pt-1 border-t border-slate-200/50 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-medium">⚠️ Công nợ cũ của khách:</span>
                    <strong className="font-mono text-red-600 text-xs">{formatVND(currentCustomer.conNo)}</strong>
                  </div>
                )}
              </div>

            </div>

            {/* 3. Detailed calculation checklist */}
            <div className="space-y-3 pt-2.5 border-t border-slate-150 text-xs">
              
              {/* Line 1: Sum product total lines */}
              <div className="flex justify-between items-center text-slate-600 select-none">
                <span>Tổng tiền hàng ({cart.length} nhóm):</span>
                <span className="font-mono font-bold text-slate-850">{formatVND(subtotalSum)}</span>
              </div>

              {/* Line 2: General Order Discount input */}
              <div className="space-y-1 pb-1.5 border-b border-slate-100 select-none">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Giảm giá hóa đơn (đ):</span>
                  <span className="font-mono font-bold text-red-700">-{formatVND(discount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={Math.min(subtotalSum, 1000000)}
                    step="5000"
                    className="w-full accent-[#1E3A8A]"
                    value={discount}
                    onChange={(e) => updateActiveTabState({ discount: parseInt(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    step="1000"
                    className="w-20 px-1 py-0.5 border border-slate-300 rounded text-right font-mono text-[11px] font-bold"
                    value={discount}
                    onChange={(e) => {
                      const val = Math.min(subtotalSum, Math.max(0, parseInt(e.target.value) || 0));
                      updateActiveTabState({ discount: val });
                    }}
                  />
                </div>
              </div>

              {/* Line 3: Final aggregate customer paid required sum */}
              <div className="flex justify-between items-center pt-1 select-none">
                <span className="font-extrabold text-slate-800 uppercase">Khách cần thanh toán:</span>
                <span className="font-mono font-black text-red-600 text-sm">{formatVND(totalToPay)}</span>
              </div>

              {/* Line 4: Payment action mechanism choice trigger buttons */}
              <div className="space-y-1.5">
                <span className="text-slate-500 block leading-none text-[10.5px] uppercase tracking-wider select-none font-bold">Hình thức thanh toán</span>
                <div className="grid grid-cols-3 border border-slate-200 rounded overflow-hidden divide-x divide-slate-200 text-center text-[10px] font-bold h-8 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Kcash')}
                    className={`flex items-center justify-center gap-1 transition cursor-pointer select-none ${
                      paymentMode === 'Kcash' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Ktransfer')}
                    className={`flex items-center justify-center gap-1 transition cursor-pointer select-none ${
                      paymentMode === 'Ktransfer' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Chuyển khoản
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Kcard')}
                    className={`flex items-center justify-center gap-1 transition cursor-pointer select-none ${
                      paymentMode === 'Kcard' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Thẻ POS
                  </button>
                </div>
              </div>

              {/* Line 5: Exact customer payment input with quick action options */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Khách thanh toán đưa (đ):</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateActiveTabState({ customerPaid: totalToPay.toString() })}
                      className="px-1.5 py-0.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-250 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Đủ
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActiveTabState({ customerPaid: '0' })}
                      className="px-1.5 py-0.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-250 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Ghi nợ
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  className="w-full px-3 py-2 border-2 border-slate-300 focus:border-emerald-600 rounded-lg text-center text-sm font-black font-mono text-emerald-800"
                  placeholder={`Bấm ĐỦ để điền nhanh: ${totalToPay.toLocaleString('vi-VN')} đ`}
                  value={customerPaid}
                  onChange={(e) => {
                    const str = e.target.value;
                    if (str === '' || parseFloat(str) >= 0) {
                      updateActiveTabState({ customerPaid: str });
                    }
                  }}
                />

                {/* Line 6: Dynamic grid list of rapid suggested coin/cash elements */}
                {suggestedCashTotals.length > 0 && totalToPay > 0 && (
                  <div className="grid grid-cols-3 gap-1 pt-1.5 select-none">
                    {suggestedCashTotals.map((denom) => {
                      const isSelected = paidSecAmount === denom;
                      return (
                        <button
                          key={denom}
                          type="button"
                          onClick={() => updateActiveTabState({ customerPaid: denom.toString() })}
                          className={`py-1 text-[10px] font-bold border rounded-md transition cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {denom.toLocaleString('vi-VN')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Line 7: Calculating return change and result debts */}
              <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5 select-none">
                {remainingChange > 0 ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Tiền thừa trả khách:</span>
                    <strong className="font-mono text-emerald-600 text-sm">{formatVND(remainingChange)}</strong>
                  </div>
                ) : null}

                {currentDebtAmount > 0 && currentCustomer.maKH !== 'KH000004' ? (
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500">Mức nợ mới lưu sổ KH:</span>
                    <strong className="font-mono text-red-600 text-xs font-black">{formatVND(currentDebtAmount)}</strong>
                  </div>
                ) : currentDebtAmount > 0 ? (
                  <p className="text-[9.5px] text-amber-600 font-bold italic leading-tight">
                    * Lưu ý: Khách vãng lai không thể ghi công nợ! Vui lòng chọn hoặc thêm khách hàng cụ thể để hoàn tất ghi nợ.
                  </p>
                ) : null}
              </div>

            </div>

          </div>

          {/* Bottom section: checkout triggers */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            
            {/* Draft Print actions row */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handlePrintTemporary}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white active:scale-95 text-[10.5px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> In phiếu tạm tính
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCancelSales}
                className="col-span-1 p-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-[10.5px] font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-1 transition"
                title="Hủy bỏ giỏ hàng"
              >
                ✕ Hủy
              </button>
              
              <button
                type="button"
                onClick={handleCheckoutInvoice}
                disabled={cart.length === 0 || (currentDebtAmount > 0 && currentCustomer.maKH === 'KH000004')}
                className={`col-span-2 py-2.5 rounded-xl font-bold uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-2 select-none transition ${
                  cart.length === 0 || (currentDebtAmount > 0 && currentCustomer.maKH === 'KH000004')
                    ? 'bg-slate-300 opacity-60 cursor-not-allowed text-slate-400' 
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                <Save className="w-4.5 h-4.5" /> THANH TOÁN
              </button>
            </div>

            {/* Template selector choice */}
            <div className="text-[10px] text-slate-400 pt-1 text-center select-none">
              Mẫu in hiện tại: <strong className="text-slate-600">{selectedTemplate.toUpperCase()}</strong>
            </div>
          </div>

        </div>

      </div>

      {/* 3. QUICK ADD CUSTOMER MODAL COMPONENT */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddQuickCustomerSubmit}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-left"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Thêm khách hàng nhanh tác nghiệp</h3>
              <button 
                type="button" 
                onClick={() => setShowAddCustomer(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-550 block">Họ & tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh Hoàng - Hà Đông"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-550 block">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0988xxxxxx"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-550 block">Địa chỉ giao dịch</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Đông, Hà Nội"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  value={newCustAddr}
                  onChange={(e) => setNewCustAddr(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
              >
                Tạo đối tác
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
