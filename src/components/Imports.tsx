import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  Trash2, 
  Plus, 
  Minus, 
  Save, 
  Printer, 
  X, 
  PlusCircle, 
  ArrowLeft,
  Barcode,
  Eye,
  AlertCircle,
  HelpCircle,
  Upload,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  Package,
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Supplier, ImportSlip, ImportSlipDetail, InventoryItem, SystemSettings } from '../types';
import { formatVND, smartMatch, generateId } from '../utils';

interface ImportsProps {
  products: Product[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  settings: SystemSettings;
  currentStaffName: string;
  onSaveImportSlip: (newSlip: ImportSlip) => void;
  onAddNewProduct: (newProduct: Product, initialQty: number) => void;
  onNavigate: (tab: string) => void;
}

export default function Imports({
  products,
  suppliers,
  inventory,
  settings,
  currentStaffName,
  onSaveImportSlip,
  onAddNewProduct,
  onNavigate
}: ImportsProps) {
  // Search state for product
  const [productSearch, setProductSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Right pane state
  const [selectedStaff, setSelectedStaff] = useState(currentStaffName || 'NV1');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('NCC00001');
  
  // Custom Invoice/Slip input matching image
  const [importSlipId, setImportSlipId] = useState(''); // Empty means "Mã phiếu tự động"
  const [importOrderId, setImportOrderId] = useState('');
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [supplierPaid, setSupplierPaid] = useState<string>('');

  // Cart: contains row items with optional discounts per-row (Giảm giá) and individual notes!
  const [importCart, setImportCart] = useState<{ 
    product: Product; 
    quantity: number; 
    costPrice: number; 
    discount: number; // Giảm giá
    note: string;
    isEditingNote: boolean;
  }[]>([]);

  // Accordion Toggles inside Tao Thong Tin Hang Hoa Form
  const [accordionGiaBan, setAccordionGiaBan] = useState(true);
  const [accordionTonKho, setAccordionTonKho] = useState(true);
  const [accordionViTri, setAccordionViTri] = useState(true);
  const [accordionDonViTinh, setAccordionDonViTinh] = useState(false);

  // New product dialog state matching Screenshot 2
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdGroup, setNewProdGroup] = useState('Điện gia dụng');
  const [newProdBrand, setNewProdBrand] = useState('Duy Tân');
  const [newProdCostPrice, setNewProdCostPrice] = useState<number>(0);
  const [newProdSellPrice, setNewProdSellPrice] = useState<number>(0);
  const [newProdMinStock, setNewProdMinStock] = useState<number>(0);
  const [newProdMaxStock, setNewProdMaxStock] = useState<number>(999999999);
  const [newProdLocation, setNewProdLocation] = useState('');
  const [newProdWeight, setNewProdWeight] = useState<number>(0);
  const [newProdUnit, setNewProdUnit] = useState('Cái');
  const [newProdDirectSell, setNewProdDirectSell] = useState(true);
  const [newProdActiveTab, setNewProdActiveTab] = useState<'info' | 'desc'>('info');
  const [newProdDescText, setNewProdDescText] = useState('');

  // Excel Upload state matching Screenshots 5, 8 & 9
  const [showExcelWizard, setShowExcelWizard] = useState(false);
  const [excelConflictResult, setExcelConflictResult] = useState<'error' | 'replace'>('error');
  const [excelConflictBarcode, setExcelConflictBarcode] = useState<'error' | 'replace'>('error');
  const [excelUpdateStock, setExcelUpdateStock] = useState<boolean>(false);
  const [excelUpdateCostPrice, setExcelUpdateCostPrice] = useState<boolean>(true);
  const [excelUpdateDesc, setExcelUpdateDesc] = useState<boolean>(false);

  // Hotkey register
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.getElementById('kiot-import-f3-search');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to open-add-product-modal from external triggering
  useEffect(() => {
    const handleOpenModal = () => {
      setShowAddProductModal(true);
    };
    window.addEventListener('open-add-product-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-product-modal', handleOpenModal);
  }, []);

  // Soft match current active supplier
  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.maNCC === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  // Autocomplete suggestions for suppliers
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return [];
    return suppliers.filter(s => 
      smartMatch(s.tenNCC, supplierSearch) || 
      smartMatch(s.sdt, supplierSearch) ||
      smartMatch(s.maNCC, supplierSearch)
    );
  }, [suppliers, supplierSearch]);

  // Autocomplete products
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => 
      smartMatch(p.tenSP, productSearch, p.tuKhoa) || 
      smartMatch(p.maSP, productSearch) || 
      smartMatch(p.maVach, productSearch)
    );
  }, [products, productSearch]);

  // Add search matches to import cart
  const addToImportCart = (product: Product) => {
    setImportCart(prev => {
      const existing = prev.find(item => item.product.maSP === product.maSP);
      if (existing) {
        return prev.map(item => 
          item.product.maSP === product.maSP 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { 
          product, 
          quantity: 1, 
          costPrice: product.giaNhap || 0,
          discount: 0,
          note: '',
          isEditingNote: false
        }];
      }
    });
    setProductSearch('');
    setIsSearchFocused(false);
  };

  // Update item details
  const updateQuantity = (maSP: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(maSP);
      return;
    }
    setImportCart(prev => 
      prev.map(item => 
        item.product.maSP === maSP ? { ...item, quantity: qty } : item
      )
    );
  };

  const updateCostPrice = (maSP: string, price: number) => {
    setImportCart(prev => 
      prev.map(item => 
        item.product.maSP === maSP ? { ...item, costPrice: Math.max(0, price) } : item
      )
    );
  };

  const updateRowDiscount = (maSP: string, rowDiscount: number) => {
    setImportCart(prev => 
      prev.map(item => 
        item.product.maSP === maSP ? { ...item, discount: Math.max(0, rowDiscount) } : item
      )
    );
  };

  const updateRowNote = (maSP: string, text: string) => {
    setImportCart(prev => 
      prev.map(item => 
        item.product.maSP === maSP ? { ...item, note: text } : item
      )
    );
  };

  const toggleEditNote = (maSP: string) => {
    setImportCart(prev => 
      prev.map(item => 
        item.product.maSP === maSP ? { ...item, isEditingNote: !item.isEditingNote } : item
      )
    );
  };

  const removeFromCart = (maSP: string) => {
    setImportCart(prev => prev.filter(item => item.product.maSP !== maSP));
  };

  // Totals calculations
  const subTotalAmount = useMemo(() => {
    return importCart.reduce((sum, item) => sum + ((item.costPrice - item.discount) * item.quantity), 0);
  }, [importCart]);

  const parsedGeneralDiscount = useMemo(() => {
    const parsed = parseFloat(generalDiscount);
    return isNaN(parsed) ? 0 : parsed;
  }, [generalDiscount]);

  const finalTotalAmount = useMemo(() => {
    const amount = subTotalAmount - parsedGeneralDiscount;
    return amount < 0 ? 0 : amount;
  }, [subTotalAmount, parsedGeneralDiscount]);

  const paidAmount = useMemo(() => {
    if (supplierPaid === '') return finalTotalAmount; // Defaults to fully paying standard KiotViet
    const parsed = parseFloat(supplierPaid);
    return isNaN(parsed) ? 0 : parsed;
  }, [supplierPaid, finalTotalAmount]);

  const remainingDebt = useMemo(() => {
    const debt = finalTotalAmount - paidAmount;
    return debt < 0 ? 0 : debt;
  }, [finalTotalAmount, paidAmount]);

  // Submit beautiful KiotViet Add Product modal (Screenshot 2)
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert("Tên hàng là bắt buộc!");
      return;
    }

    const generatedMaSP = newProdCode.trim() || generateId(settings.prefixSP, products);
    const resolvedBarcode = newProdBarcode.trim() || `893000${Date.now().toString().slice(-7)}`;
    const searchKeywords = `${newProdName.toLowerCase()} ${newProdGroup.toLowerCase()} ${newProdBrand.toLowerCase()} ${resolvedBarcode}`;

    const newProduct: Product = {
      maSP: generatedMaSP,
      tenSP: newProdName.trim(),
      nhomHang: newProdGroup,
      dvt: newProdUnit,
      maVach: resolvedBarcode,
      tuKhoa: searchKeywords,
      giaNhap: newProdCostPrice,
      giaBan: newProdSellPrice,
      trangThai: 'Bán'
    };

    onAddNewProduct(newProduct, 0);

    // Auto add to import cart
    setImportCart(prev => [
      ...prev,
      {
        product: newProduct,
        quantity: 1,
        costPrice: newProdCostPrice,
        discount: 0,
        note: '',
        isEditingNote: false
      }
    ]);

    // Reset values & close modal
    setNewProdCode('');
    setNewProdBarcode('');
    setNewProdName('');
    setNewProdCostPrice(0);
    setNewProdSellPrice(0);
    setNewProdMinStock(0);
    setNewProdMaxStock(999999999);
    setNewProdLocation('');
    setNewProdWeight(0);
    setNewProdUnit('Cái');
    setNewProdDescText('');
    setShowAddProductModal(false);
  };

  // Launch mock Excel File process (Screenshot 5, 8 & 9)
  const triggerExcelFileSelect = () => {
    setShowExcelWizard(true);
  };

  const handleFinishExcelImport = () => {
    // Inject mock KiotViet system goods as shown in screenshots
    const sampleItems = [
      {
        maSP: '1021022915952',
        tenSP: 'Sữa đặc có đường Ông Thọ trắng nhãn vàng lon 380g',
        nhomHang: 'Sữa học đường',
        dvt: 'Lon',
        maVach: '1021022915952',
        giaNhap: 22000,
        giaBan: 28000,
        tuKhoa: 'sua ong tho dac sua'
      },
      {
        maSP: '10131420895',
        tenSP: 'Vít dầu bằng răng thưa, thân ốm M4, màu đen-VG420B23T',
        nhomHang: 'Ốc vít kim khí',
        dvt: 'Hộp',
        maVach: '10131420895',
        giaNhap: 15000,
        giaBan: 20000,
        tuKhoa: 'vit dau oc kim khi'
      },
      {
        maSP: '10135603877',
        tenSP: 'P/S kem đánh răng trà xanh 180g/36 ống',
        nhomHang: 'Hóa mỹ phẩm',
        dvt: 'Ống',
        maVach: '10135603877',
        giaNhap: 35000,
        giaBan: 46000,
        tuKhoa: 'ps kem danh rang tra xanh'
      }
    ];

    // Bulk register products to memory database
    sampleItems.forEach(item => {
      const match = products.find(p => p.maSP === item.maSP);
      if (!match) {
        onAddNewProduct({
          maSP: item.maSP,
          tenSP: item.tenSP,
          nhomHang: item.nhomHang,
          dvt: item.dvt,
          maVach: item.maVach,
          giaNhap: item.giaNhap,
          giaBan: item.giaBan,
          tuKhoa: item.tuKhoa,
          trangThai: 'Bán'
        }, 0);
      }
    });

    // Populate the Cart with mock transaction elements mimicking Screenshot 4
    setImportCart([
      {
        product: {
          maSP: sampleItems[0].maSP,
          tenSP: sampleItems[0].tenSP,
          nhomHang: sampleItems[0].nhomHang,
          dvt: sampleItems[0].dvt,
          maVach: sampleItems[0].maVach,
          giaNhap: sampleItems[0].giaNhap,
          giaBan: sampleItems[0].giaBan,
          tuKhoa: sampleItems[0].tuKhoa,
          trangThai: 'Bán'
        },
        quantity: 24,
        costPrice: 22000,
        discount: 0,
        note: '',
        isEditingNote: false
      },
      {
        product: {
          maSP: sampleItems[1].maSP,
          tenSP: sampleItems[1].tenSP,
          nhomHang: sampleItems[1].nhomHang,
          dvt: sampleItems[1].dvt,
          maVach: sampleItems[1].maVach,
          giaNhap: sampleItems[1].giaNhap,
          giaBan: sampleItems[1].giaBan,
          tuKhoa: sampleItems[1].tuKhoa,
          trangThai: 'Bán'
        },
        quantity: 100,
        costPrice: 15000,
        discount: 0,
        note: '',
        isEditingNote: false
      },
      {
        product: {
          maSP: sampleItems[2].maSP,
          tenSP: sampleItems[2].tenSP,
          nhomHang: sampleItems[2].nhomHang,
          dvt: sampleItems[2].dvt,
          maVach: sampleItems[2].maVach,
          giaNhap: sampleItems[2].giaNhap,
          giaBan: sampleItems[2].giaBan,
          tuKhoa: sampleItems[2].tuKhoa,
          trangThai: 'Bán'
        },
        quantity: 36,
        costPrice: 35000,
        discount: 0,
        note: '',
        isEditingNote: false
      }
    ]);

    setShowExcelWizard(false);
  };

  // Process checkout slip
  const handleSaveImportAndBill = (status: 'Hoàn thành' | 'Phiếu tạm') => {
    if (importCart.length === 0) {
      alert("Giỏ nhập hàng đang trống. Vui lòng nạp sản phẩm vật tư!");
      return;
    }

    const maPN = importSlipId.trim() || generateId(settings.prefixPN, []);

    const slipDetails: ImportSlipDetail[] = importCart.map(item => ({
      maPN,
      maSP: item.product.maSP,
      tenSP: item.product.tenSP,
      soLuong: item.quantity,
      donGiaNhap: item.costPrice,
      thanhTien: (item.costPrice - item.discount) * item.quantity
    }));

    const slip: ImportSlip = {
      maPN,
      ngayMoi: new Date().toISOString(),
      maNCC: currentSupplier.maNCC,
      tenNCC: currentSupplier.tenNCC,
      sdtNCC: currentSupplier.sdt,
      tongTien: finalTotalAmount,
      daTra: paidAmount,
      conNo: remainingDebt,
      nhanVien: selectedStaff,
      trangThai: status,
      details: slipDetails
    };

    onSaveImportSlip(slip);

    // Completely clear
    setImportCart([]);
    setSupplierPaid('');
    setProductSearch('');
    setSupplierSearch('');
    setImportSlipId('');
    setImportOrderId('');
    setOriginalInvoiceNo('');
    setGeneralDiscount('0');
    setNotes('');

    alert(status === 'Hoàn thành' ? `Nhập hàng thành công! Mã phiếu: ${maPN}` : `Đã lưu tạm phiếu nhập hàng: ${maPN}`);
  };

  return (
    <div className="flex flex-col gap-0 -mx-4 md:-mx-6 -mt-6 min-h-[calc(100vh-230px)] bg-slate-50 font-sans text-slate-800">
      
      {/* SOLID DENSE TOP APP BAR (Screenshot 1 & 4 KiotViet Standard) */}
      <div className="bg-emerald-600 dark:bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between border-b border-emerald-700 dark:border-slate-800 p-2.5 px-4 gap-3 select-none">
        
        {/* Left header segment with Back icon and screen brand */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-start">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="p-1 px-2.5 hover:bg-emerald-700 dark:hover:bg-slate-800 rounded-lg transition text-white/95 flex items-center gap-1 cursor-pointer font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Trở về</span>
          </button>
          
          <h1 className="text-sm font-extrabold tracking-wide font-sans md:ml-1 flex items-center gap-1">
            <Package className="w-4 h-4 text-emerald-200 fill-emerald-200/20" />
            NHẬP HÀNG
          </h1>
          
          <span className="text-[10px] bg-emerald-700/80 dark:bg-slate-850 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
            Bản chuẩn Kiot
          </span>
        </div>

        {/* Middle exact search input bar "Tìm hàng hóa theo mã hoặc tên (F3)" */}
        <div className="relative w-full max-w-xl flex items-center gap-1.5 bg-white rounded-lg p-1 px-2 text-slate-800 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            id="kiot-import-f3-search"
            className="w-full bg-transparent border-0 outline-none ring-0 text-xs py-0.5 placeholder:text-slate-400"
            placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
          />

          {/* Sizing grid and add icon [::] and [+] button matching picture */}
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 pr-1 select-none">
            <button 
              type="button" 
              title="Danh sách bộ cục"
              className="p-1 hover:text-[#0066FF] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <span className="text-[14px] font-bold block select-none">⁝⁝</span>
            </button>
            <span className="w-[1px] h-3 bg-slate-300"></span>
            <button
              type="button"
              id="top-add-goods-plus-btn"
              title="Thêm hàng hóa mới"
              onClick={() => setShowAddProductModal(true)}
              className="p-1 text-[#0066FF] hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition font-black text-sm pr-1.5 flex items-center justify-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Autocomplete suggestions overlay box matching exact Screenshot 3 */}
          {isSearchFocused && productSearch && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl overflow-hidden z-50 text-left max-h-80 overflow-y-auto">
              <div className="bg-slate-50 dark:bg-slate-950 p-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                Sản phẩm gia dụng hợp lệ ({filteredProducts.length})
              </div>
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-400">Không tìm thấy sản phẩm nào.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProdName(productSearch);
                      setShowAddProductModal(true);
                      setIsSearchFocused(false);
                    }}
                    className="mt-2 text-xs text-[#0066FF] font-bold underline cursor-pointer"
                  >
                    Khai sinh sản phẩm "{productSearch}" mới ngay →
                  </button>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isAlreadyInCart = importCart.some(item => item.product.maSP === p.maSP);
                  return (
                    <div
                      key={p.maSP}
                      onClick={() => addToImportCart(p)}
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer flex items-center gap-3 border-b border-slate-100"
                    >
                      {/* Image Thumbnail placeholder matching photo 3 */}
                      <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 border flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                        {p.dvt === 'Lon' ? (
                          <div className="text-[9px] bg-amber-500 text-white p-1 rounded font-black text-center leading-none">LON</div>
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-350" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={p.tenSP}>
                          {p.tenSP}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span> Mã: <strong className="text-blue-600 font-bold">{p.maSP}</strong></span>
                          <span>|</span>
                          <span>Giá nhập: <strong className="text-amber-700 font-bold">{formatVND(p.giaNhap)}</strong></span>
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5">
                          Tồn kho hầm: <strong className="text-slate-700 dark:text-slate-200">188</strong> | Khách đặt phòng: 0
                        </div>
                      </div>

                      {isAlreadyInCart && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-sans">
                          Đã thêm
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
          {isSearchFocused && !productSearch && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-2 z-50 text-left">
              <div className="text-[9.5px] text-slate-400 font-bold uppercase mb-1.5">Gợi ý tìm kiếm nhanh:</div>
              <div className="flex flex-wrap gap-1">
                {products.slice(0, 5).map(p => (
                  <button
                    key={p.maSP}
                    type="button"
                    onClick={() => addToImportCart(p)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] p-1 px-2.5 rounded text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                  >
                    {p.tenSP}
                  </button>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => setIsSearchFocused(false)} 
                className="w-full text-center text-[10px] text-slate-400 mt-2 hover:text-[#0066FF] cursor-pointer"
              >
                Đóng phản hồi gợi ý ↑
              </button>
            </div>
          )}
        </div>

        {/* Right buttons control standard layout representation */}
        <div className="flex items-center gap-1 bg-emerald-700 dark:bg-slate-800 p-0.5 rounded-lg shrink-0 w-full md:w-auto justify-center">
          <button type="button" className="p-1 px-3 hover:bg-emerald-800 dark:hover:bg-slate-700 rounded-md transition text-slate-200 hover:text-white cursor-pointer" title="Cấu hình quét">
            <Barcode className="w-5 h-5 text-white" />
          </button>
          <button type="button" className="p-1 px-3 hover:bg-emerald-800 dark:hover:bg-slate-700 rounded-md transition text-slate-200 hover:text-white cursor-pointer" title="In trực tiếp">
            <Printer className="w-5 h-5 text-white" />
          </button>
          <button type="button" className="p-1 px-3 hover:bg-emerald-800 dark:hover:bg-slate-700 rounded-md transition text-slate-200 hover:text-white cursor-pointer" title="Xem trước chứng từ">
            <Eye className="w-5 h-5 text-white" />
          </button>
          <button type="button" className="p-1 px-3 hover:bg-emerald-800 dark:hover:bg-slate-700 rounded-md transition text-slate-200 hover:text-white cursor-pointer" title="Hỗ trợ kỹ thuật">
            <AlertCircle className="w-5 h-5 text-white animate-bounce" />
          </button>
        </div>

      </div>

      {/* DETECTED OVERLAY OUTLINE BOX IF POPUPS ARE FOCUSED */}
      {isSearchFocused && (
        <div 
          className="fixed inset-0 bg-transparent z-40" 
          onClick={() => setIsSearchFocused(false)}
        />
      )}
      {isSupplierFocused && (
        <div 
          className="fixed inset-0 bg-transparent z-40" 
          onClick={() => setIsSupplierFocused(false)}
        />
      )}

      {/* CORE WORKSPACE SECTION (Screenshot 1 & 4 KiotViet Standard) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        
        {/* LEFT COMPARTMENT: TRANSACTION TABLE OR MOCK FILE UPLOAD VIEW */}
        <div className="flex-1 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col p-4">
          
          {importCart.length === 0 ? (
            /* EMPTY VIEW: Excel Upload Prompt exact Look and Feel as Screenshot 1 & 5 */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
              
              <div className="max-w-md w-full border-2 border-dashed border-slate-350 dark:border-slate-800 rounded-2xl p-10 py-14 text-center space-y-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                
                {/* Excel Cloud Vector Representation */}
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                    Thêm sản phẩm từ file excel
                  </h3>
                  <p className="text-xs text-slate-400">
                    Nạp hàng loạt mã hàng, số lượng và giá vốn nhập chỉ trong một cú click chuột.
                  </p>
                  
                  {/* Underlined file template text as Screenshot 1 */}
                  <div className="pt-2 text-xs">
                    <span className="text-slate-500">Tải về dữ liệu mẫu: </span>
                    <a
                      href="#download-sample-excel"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Bản mẫu Excel 'PhongHung_KiotImports_Template.xlsx' đang tải về hệ thống...");
                      }}
                      className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
                    >
                      Excel file
                    </a>
                  </div>
                </div>

                {/* Big Blue Button representing "Chọn file dữ liệu" in Screen 1 */}
                <button
                  type="button"
                  id="excel-select-trigger-btn"
                  onClick={triggerExcelFileSelect}
                  className="mx-auto px-6 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.03] active:scale-95 duration-150 flex items-center justify-center gap-2 cursor-pointer border border-blue-600"
                >
                  <Upload className="w-4 h-4 text-white" />
                  CHỌN FILE DỮ LIỆU
                </button>

              </div>

            </div>
          ) : (
            /* DETAILED TRANSACTION TABLE: Exact Look and Feel of Screenshot 4 */
            <div className="flex-1 flex flex-col font-sans">
              
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left text-slate-800 dark:text-slate-200">
                  <thead className="bg-[#E5E7EB] text-slate-700 uppercase font-black tracking-wide text-[10px] select-none">
                    <tr>
                      <th scope="col" className="p-2.5 w-10 text-center">STT</th>
                      <th scope="col" className="p-2.5 w-36">Mã hàng</th>
                      <th scope="col" className="p-2.5">Tên hàng</th>
                      <th scope="col" className="p-2.5 w-18 text-center">ĐVT</th>
                      <th scope="col" className="p-2.5 w-24 text-center">Số lượng</th>
                      <th scope="col" className="p-2.5 w-28 text-right">Đơn giá</th>
                      <th scope="col" className="p-2.5 w-24 text-right">Giảm giá</th>
                      <th scope="col" className="p-2.5 w-28 text-right">Thành tiền</th>
                      <th scope="col" className="p-2.5 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-200 bg-white font-sans">
                    {importCart.map((item, index) => {
                      const rowTotal = (item.costPrice - item.discount) * item.quantity;
                      return (
                        <tr key={item.product.maSP} className="hover:bg-slate-50/80 transition duration-100">
                          
                          {/* STT Column */}
                          <td className="p-2 text-center text-slate-400 font-bold font-mono">
                            {index + 1}
                          </td>
                          
                          {/* Mã hàng Column in Blue */}
                          <td className="p-2 font-mono text-blue-600 font-extrabold text-[11px]">
                            {item.product.maSP}
                          </td>
                          
                          {/* Tên hàng Column with Pencil Notes option */}
                          <td className="p-2">
                            <div className="font-bold text-slate-800 text-[11px] block">
                              {item.product.tenSP}
                            </div>
                            
                            {/* Inline Edit Note matching the small pen icon in Screenshot 4 */}
                            <div className="mt-1 flex items-center gap-1.5 text-[9.5px]">
                              {item.isEditingNote ? (
                                <div className="flex items-center gap-1 w-full max-w-xs">
                                  <input
                                    type="text"
                                    className="border border-slate-300 rounded px-1 py-0.5 w-full text-[9.5px]"
                                    value={item.note}
                                    placeholder="Ghi chú dòng..."
                                    onChange={(e) => updateRowNote(item.product.maSP, e.target.value)}
                                    autoFocus
                                    onBlur={() => toggleEditNote(item.product.maSP)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') toggleEditNote(item.product.maSP);
                                    }}
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleEditNote(item.product.maSP)}
                                  className="text-slate-400 hover:text-blue-600 flex items-center gap-1 font-sans font-medium"
                                >
                                  <span className="italic">{item.note || 'Ghi chú...'}</span>
                                  <span className="text-[10px] text-slate-350 group-hover:text-blue-500">✏️</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* ĐVT Column */}
                          <td className="p-2 text-center text-slate-500 font-bold whitespace-nowrap">
                            {item.product.dvt || 'Cái'}
                          </td>

                          {/* Số lượng Counter Box in rounded container (Screenshot 4 style) */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center mx-auto border border-slate-300 rounded-md overflow-hidden bg-white w-20 h-7 select-none">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.maSP, item.quantity - 1)}
                                className="p-1 px-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <input
                                type="number"
                                className="w-full border-0 p-0 text-center text-xs font-bold text-slate-800 font-mono focus:ring-0 select-all"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.maSP, parseInt(e.target.value) || 1)}
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.maSP, item.quantity + 1)}
                                className="p-1 px-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>

                          {/* Đơn giá Input Text Box */}
                          <td className="p-2 text-right">
                            <div className="flex justify-end">
                              <input
                                type="number"
                                className="w-24 px-1.5 py-1 border border-slate-200 text-xs font-mono font-bold text-right rounded-md focus:border-blue-400 focus:outline-none"
                                value={item.costPrice}
                                onChange={(e) => updateCostPrice(item.product.maSP, parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </td>

                          {/* Giảm giá Input Text Box */}
                          <td className="p-2 text-right">
                            <div className="flex justify-end">
                              <input
                                type="number"
                                className="w-20 px-1.5 py-1 border border-slate-200 text-xs font-mono font-bold text-right rounded-md focus:border-blue-400 focus:outline-none text-rose-600"
                                value={item.discount}
                                onChange={(e) => updateRowDiscount(item.product.maSP, parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </td>

                          {/* Thành tiền Label */}
                          <td className="p-2 text-right font-bold text-slate-900 font-mono">
                            {formatVND(rowTotal)}
                          </td>

                          {/* Center trash bin delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.maSP)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer p-1 rounded-md hover:bg-slate-100 transition"
                              title="Xóa dòng hàng này"
                            >
                              <Trash2 className="w-4 h-4 block mx-auto" />
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer action help instructions */}
              <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center text-slate-400 gap-2 text-[10.5px] font-sans pb-4">
                <span className="italic">
                  * Nhấp vào <strong>Ghi chú...</strong> hoặc <strong>✏️</strong> dưới tên hàng để bổ sung mô tả kích cỡ hoặc lô sản xuất dòng hàng nhập.
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Xóa sạch toàn bộ sản phẩm nhập khỏi giỏ hàng?")) {
                      setImportCart([]);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> XÓA SẠCH GIỎ HÀNG
                </button>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COMPARTMENT: SUPPLIER PICKER & IMPORT CALCULATOR (Exactly matching KiotViet Screen 1 & 4) */}
        <div className="w-full lg:w-[350px] bg-slate-50 dark:bg-slate-950 p-4 border-l border-slate-250 dark:border-slate-800 flex flex-col gap-3 font-sans text-xs">
          
          {/* Section 1: Staff drop-down selector & date-time widget */}
          <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-dashed border-slate-200">
            {/* NV1 picker layout details as Screenshot 1 */}
            <div className="relative">
              <select
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-805 font-bold cursor-pointer pr-5 appearance-none focus:outline-none"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="NV1">👤 NV1</option>
                <option value="Admin">👤 Admin</option>
                <option value="Lễ Tân">👤 Lễ Tân</option>
                <option value="Kiểm kho">👤 Kiểm kho</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1.5 pointer-events-none" />
            </div>

            {/* Date time box mimicking Screen 1 */}
            <div className="text-slate-400 font-mono text-[11px] bg-slate-200/50 dark:bg-slate-900 p-1 px-2 rounded-md font-medium text-right">
              31/05/2026 03:59
            </div>
          </div>

          {/* Section 2: Supplier Finder ("Tìm nhà cung cấp") with plus button */}
          <div className="space-y-1.5 relative pt-1">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-sans shadow-sm"
                  placeholder="Tìm nhà cung cấp"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setIsSupplierFocused(true);
                  }}
                  onFocus={() => setIsSupplierFocused(true)}
                />
                
                {/* Autocomplete list for Supplier Search */}
                {isSupplierFocused && supplierSearch && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    {filteredSuppliers.length === 0 ? (
                      <p className="p-3 text-center text-slate-400 text-[11px]">Không tìm thấy đối tác phù hợp.</p>
                    ) : (
                      filteredSuppliers.map((sup) => (
                        <div
                          key={sup.maNCC}
                          onClick={() => {
                            setSelectedSupplierId(sup.maNCC);
                            setSupplierSearch('');
                            setIsSupplierFocused(false);
                          }}
                          className="p-2 hover:bg-slate-100 text-[11px] cursor-pointer text-left"
                        >
                          <div className="font-bold text-slate-800">{sup.tenNCC}</div>
                          <div className="text-[9.5px] text-slate-400">SĐT: {sup.sdt} | Mã: {sup.maNCC}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Plus button next to Supplier Input */}
              <button
                type="button"
                onClick={() => {
                  const newName = prompt("Nhập tên Nhà cung cấp mới:");
                  if (newName && newName.trim()) {
                    alert(`Đã liên kết đăng ký thành công Nhà cung cấp: ${newName}`);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 font-bold text-base rounded cursor-pointer transition"
                title="Đăng ký nhanh nhà cung cấp mới"
              >
                +
              </button>
            </div>

            {/* Current Supplier Status display box */}
            {currentSupplier && (
              <div className="p-2 border border-emerald-100 bg-emerald-50/40 rounded-lg text-slate-700 text-[10px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900">{currentSupplier.tenNCC}</span>
                  <span className="text-slate-450 text-[9px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                    {currentSupplier.maNCC}
                  </span>
                </div>
                <div className="text-slate-500 font-medium leading-relaxed">
                  ĐC: {currentSupplier.diaChi} | Đã vay nợ: <strong className="text-rose-700 font-mono font-bold">{formatVND(currentSupplier.conNo || 0)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Form details input exactly matching Screen 1 & 4 */}
          <div className="space-y-2.5 pt-2">
            
            {/* Mã phiếu nhập */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-bold whitespace-nowrap">Mã phiếu nhập</label>
              <input
                type="text"
                className="w-48 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
                placeholder="Mã phiếu tự động"
                value={importSlipId}
                onChange={(e) => setImportSlipId(e.target.value)}
              />
            </div>

            {/* Mã đặt hàng nhập */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-bold whitespace-nowrap">Mã đặt hàng nhập</label>
              <input
                type="text"
                className="w-48 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
                placeholder="Đặt hàng (nếu có)"
                value={importOrderId}
                onChange={(e) => setImportOrderId(e.target.value)}
              />
            </div>

            {/* Trạng thái */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="text-slate-600 font-bold">Trạng thái</label>
              <span className="font-bold text-slate-800 text-right pr-2">Phiếu tạm</span>
            </div>

            {/* Số hóa đơn đầu vào */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-bold whitespace-nowrap">Số hóa đơn đầu vào</label>
              <input
                type="text"
                className="w-48 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none placeholder:text-[10px]"
                placeholder="Nhập số hóa đơn đầu ..."
                value={originalInvoiceNo}
                onChange={(e) => setOriginalInvoiceNo(e.target.value)}
              />
            </div>

            {/* Divider line */}
            <div className="border-t border-slate-200 my-2 shadow-inner"></div>

            {/* Tổng tiền hàng with help icon */}
            <div className="flex items-center justify-between gap-2 pt-0.5 select-none">
              <div className="flex items-center gap-1">
                <span className="text-slate-600 font-extrabold text-[12px] uppercase">Tổng tiền hàng</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Tổng thành tiền của toàn bộ sản phẩm nhập chưa trừ chiết khấu chung" />
              </div>
              <span className="text-sm font-extrabold text-slate-900 font-mono">
                {formatVND(subTotalAmount)}
              </span>
            </div>

            {/* Giảm giá */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-600 font-bold">Giảm giá</label>
              <input
                type="number"
                className="w-32 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono font-bold text-rose-600"
                value={generalDiscount}
                onChange={(e) => setGeneralDiscount(e.target.value)}
              />
            </div>

            {/* Cần trả nhà cung cấp (Highlight element) */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-slate-900 font-extrabold text-[12px] uppercase">Cần trả nhà cung cấp</span>
              
              {/* Highlight blue text exactly matching picture 1 */}
              <span className="text-base font-black text-blue-600 font-mono">
                {formatVND(finalTotalAmount)}
              </span>
            </div>

            {/* Đã trả nhà cung cấp input and shortcut button */}
            <div className="space-y-1 bg-white/50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-255">
              <div className="flex justify-between items-center">
                <label className="text-slate-500 font-bold">Tiền trả NCC (đ):</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSupplierPaid(finalTotalAmount.toString())}
                    className="p-0.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-black text-[9px] tracking-wide"
                  >
                    Trả hết
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierPaid('0')}
                    className="p-0.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded font-black text-[9px] tracking-wide"
                  >
                    Ghi nợ NCC
                  </button>
                </div>
              </div>
              <input
                type="number"
                className="w-full text-center bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-emerald-700 font-bold font-mono"
                placeholder={`Đã trả (mặc định đủ: ${finalTotalAmount.toLocaleString('vi-VN')} đ)`}
                value={supplierPaid}
                onChange={(e) => setSupplierPaid(e.target.value)}
              />
            </div>

            {/* Dư nợ NCC sau giao dịch */}
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans pt-0.5 px-1">
              <span>Còn nợ NCC sau lập phiếu:</span>
              <span id="import-remaining-debt-lbl" className={`font-mono font-bold ${remainingDebt > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                {formatVND(remainingDebt)}
              </span>
            </div>

            {/* Ghi chú Textarea */}
            <div className="space-y-1">
              <label className="text-slate-550 font-bold block">Ghi chú phiếu nhập</label>
              <textarea
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-[11.5px] placeholder:text-slate-400 focus:outline-none"
                rows={2}
                placeholder="Ghi chú (Ví dụ: Nhập bổ sung số lượng khẩn cấp...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

          </div>

          {/* ACTION BUTTON FOOTER BAR EXACTLY AS SCREENSHOT 1 & 4 */}
          <div className="flex items-center gap-2 pt-3 mt-auto font-sans">
            
            {/* Outlined button "Lưu tạm" */}
            <button
              type="button"
              id="kiot-draft-slip-btn"
              onClick={() => handleSaveImportAndBill('Phiếu tạm')}
              className="flex-1 py-3 text-center border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-900 bg-white dark:bg-slate-950 rounded-lg font-black text-xs transition active:scale-95 duration-100 cursor-pointer shadow-sm uppercase tracking-wider"
            >
              Lưu tạm
            </button>

            {/* Direct Solid Button "Hoàn thành" */}
            <button
              type="button"
              id="kiot-submit-slip-btn"
              onClick={() => handleSaveImportAndBill('Hoàn thành')}
              className="flex-1 py-3 text-center bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg font-black text-xs transition active:scale-95 duration-100 cursor-pointer shadow-[0_4px_12px_rgba(0,102,255,0.25)] border border-blue-700 uppercase tracking-wider"
            >
              Hoàn thành
            </button>

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* SCREENSHOT 2: KIOTVIET TRUE MOCK "TẠO HÀNG HÓA" MODAL */}
      {/* ========================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          
          <form
            onSubmit={handleCreateProductSubmit}
            className="bg-white dark:bg-slate-950 rounded-xl leading-relaxed text-[11.5px] text-slate-800 dark:text-white w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header segment of Tạo Hàng hóa Modal */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between select-none shrink-0">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500/15" />
                Tạo hàng hóa
              </h2>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition duration-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner dynamic content scrollable container */}
            <div className="overflow-y-auto p-4 md:p-6 space-y-4 flex-1">
              
              {/* Tab options "Thông tin" and "Mô tả" as Screenshot 2 */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 select-none pb-0.5">
                <button
                  type="button"
                  onClick={() => setNewProdActiveTab('info')}
                  className={`px-4 py-2 font-extrabold text-xs tracking-wide transition border-b-2 -mb-[1.5px] ${
                    newProdActiveTab === 'info'
                      ? 'border-blue-600 text-blue-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-750'
                  }`}
                >
                  Thông tin
                </button>
                <button
                  type="button"
                  onClick={() => setNewProdActiveTab('desc')}
                  className={`px-4 py-2 font-extrabold text-xs tracking-wide transition border-b-2 -mb-[1.5px] ${
                    newProdActiveTab === 'desc'
                      ? 'border-blue-600 text-blue-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-750'
                  }`}
                >
                  Mô tả
                </button>
              </div>

              {newProdActiveTab === 'desc' ? (
                /* Tab 2: Mô tả details text input */
                <div className="space-y-2 py-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 block">Mô tả sản phẩm chi tiết</label>
                  <textarea
                    rows={8}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-850 p-3 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none"
                    placeholder="Mô tả kỹ thuật, hướng dẫn lắp ráp hoặc lưu ý quy cách bảo quản..."
                    value={newProdDescText}
                    onChange={(e) => setNewProdDescText(e.target.value)}
                  />
                  <div className="text-[10px] text-slate-400">
                    * Thông tin mô tả được tự động đính kèm và lưu trữ đồng bộ dưới đám mây.
                  </div>
                </div>
              ) : (
                /* Tab 1: "Thông tin" matching exact screenshot 2 inputs layout */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-slate-800 dark:text-slate-150">
                  
                  {/* LEFT COMPARTMENT (3 GRID COLS FOR TEXT/DROPDOWN INPUTS) */}
                  <div className="md:col-span-3 space-y-3.5 text-left">
                    
                    {/* Row 1: Mã hàng and Mã vạch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-widest block">Mã hàng</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-800 rounded bg-white text-xs text-slate-800 dark:bg-slate-900 focus:border-blue-500 focus:outline-none placeholder:text-slate-350"
                          placeholder="Mã ngẫu nhiên tự tạo"
                          value={newProdCode}
                          onChange={(e) => setNewProdCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-widest block">Mã vạch</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-800 rounded bg-white text-xs text-slate-800 dark:bg-slate-900 focus:border-blue-500 focus:outline-none"
                          placeholder="Nhập mã vạch UPC/EAN..."
                          value={newProdBarcode}
                          onChange={(e) => setNewProdBarcode(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 2: Tên hàng (required) */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-widest block">Tên hàng <span className="text-red-500 font-sans">*</span></label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-850 rounded bg-white text-xs text-slate-805 font-bold focus:border-blue-500 focus:outline-none"
                        placeholder="Nhập tên hàng (bắt buộc)"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                      />
                    </div>

                    {/* Row 3: Nhóm hàng and Thương hiệu with "+ Tạo mới" quicklinks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-extrabold text-slate-500 tracking-wider">
                          <label className="uppercase">Nhóm hàng</label>
                          <button
                            type="button"
                            onClick={() => {
                              const extra = prompt("Nhập tên nhóm hàng mới:");
                              if (extra && extra.trim()) setNewProdGroup(extra.trim());
                            }}
                            className="text-[#0066FF] hover:underline cursor-pointer"
                          >
                            Tạo mới
                          </button>
                        </div>
                        <select
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-800 rounded bg-white text-xs focus:outline-none text-slate-800 dark:bg-slate-900"
                          value={newProdGroup}
                          onChange={(e) => setNewProdGroup(e.target.value)}
                        >
                          <option value="Điện gia dụng">Điện gia dụng</option>
                          <option value="Đồ nhựa">Đồ nhựa Duy Tân</option>
                          <option value="Sành sứ & Nhà bếp">Sành sứ & Nhà bếp</option>
                          <option value="Sữa học đường">Sữa học đường</option>
                          <option value="Hóa mỹ phẩm">Hóa mỹ phẩm</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-extrabold text-slate-500 tracking-wider">
                          <label className="uppercase">Thương hiệu</label>
                          <button
                            type="button"
                            onClick={() => {
                              const brand = prompt("Nhập tên Thương hiệu mới:");
                              if (brand && brand.trim()) setNewProdBrand(brand.trim());
                            }}
                            className="text-[#0066FF] hover:underline cursor-pointer"
                          >
                            Tạo mới
                          </button>
                        </div>
                        <select
                          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-800 rounded bg-white text-xs focus:outline-none text-slate-800 dark:bg-slate-900"
                          value={newProdBrand}
                          onChange={(e) => setNewProdBrand(e.target.value)}
                        >
                          <option value="Sunhouse">Sunhouse</option>
                          <option value="Duy Tân">Duy Tân</option>
                          <option value="Samsung">Samsung</option>
                          <option value="Ông Thọ">Ông Thọ</option>
                          <option value="Colgate">Colgate</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>

                    {/* Accordion 1: Giá bán (Screenshot 2 exact look) */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white/50 dark:bg-transparent">
                      <button
                        type="button"
                        onClick={() => setAccordionGiaBan(!accordionGiaBan)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-905 flex justify-between items-center font-extrabold text-slate-750 dark:text-white uppercase select-none border-b border-slate-200"
                      >
                        <span className="tracking-wide">Giá bán & Giá nhập</span>
                        {accordionGiaBan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {accordionGiaBan && (
                        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs animate-in slide-in-from-top-1 duration-100">
                          <div className="space-y-1">
                            <label className="text-slate-500 font-bold block">Giá vốn mua nhập (đ)</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-slate-200 rounded font-mono font-bold"
                              value={newProdCostPrice}
                              onChange={(e) => setNewProdCostPrice(parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500 font-bold block">Giá niêm yết bán lẻ (đ)</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-slate-200 rounded font-mono font-bold text-blue-600"
                              value={newProdSellPrice}
                              onChange={(e) => setNewProdSellPrice(parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accordion 2: Tồn kho (Định mức tồn thấp nhất / Định mức tồn cao nhất) */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white/50 dark:bg-transparent">
                      <button
                        type="button"
                        onClick={() => setAccordionTonKho(!accordionTonKho)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-905 flex justify-between items-center font-extrabold text-slate-750 dark:text-white uppercase select-none border-b border-slate-200"
                      >
                        <span className="tracking-wide font-bold">Quản lý tồn kho</span>
                        {accordionTonKho ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {accordionTonKho && (
                        <div className="p-3.5 text-xs animate-in slide-in-from-top-1 duration-100 space-y-2">
                          <p className="text-[10px] text-slate-450 leading-relaxed">
                            Quản lý số lượng tồn kho và định mức tồn. Khi tồn kho chạm đến định mức, bạn sẽ nhận được cảnh báo tự động từ Phong Hùng POS.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                            <div className="space-y-1">
                              <label className="text-slate-500 font-medium">Định mức tồn thấp nhất (Nhận báo động hết hàng)</label>
                              <input
                                type="number"
                                className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                                value={newProdMinStock}
                                onChange={(e) => setNewProdMinStock(parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-medium">Định mức tồn tối đa</label>
                              <input
                                type="number"
                                className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                                value={newProdMaxStock}
                                onChange={(e) => setNewProdMaxStock(parseInt(e.target.value) || 999999999)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accordion 3: Vị trí, trọng lượng */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white/50 dark:bg-transparent">
                      <button
                        type="button"
                        onClick={() => setAccordionViTri(!accordionViTri)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-905 flex justify-between items-center font-extrabold text-slate-750 dark:text-white uppercase select-none border-b border-slate-200"
                      >
                        <span className="tracking-wide font-bold">Vị trí, trọng lượng</span>
                        {accordionViTri ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {accordionViTri && (
                        <div className="p-3.5 text-xs animate-in slide-in-from-top-1 duration-100 space-y-2">
                          <p className="text-[10px] text-slate-450 leading-relaxed">
                            Quản lý việc sắp xếp vị trí lấy đồ và nạp các khối lượng hàng nặng nhẹ vận chuyển.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-slate-500 font-medium">Chọn vị trí tủ kệ</label>
                                <button type="button" className="text-blue-600 text-[10px] uppercase font-bold">Tạo mới</button>
                              </div>
                              <input
                                type="text"
                                className="w-full px-3 py-1.5 border border-slate-200 rounded placeholder:text-slate-350"
                                placeholder="Chọn vị trí ngăn kệ (Ví dụ: Kệ A1-Ngăn 2)"
                                value={newProdLocation}
                                onChange={(e) => setNewProdLocation(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-medium">Trọng lượng nạp (g)</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                                  value={newProdWeight}
                                  onChange={(e) => setNewProdWeight(parseInt(e.target.value) || 0)}
                                />
                                <span className="bg-slate-100 p-2 border border-slate-200 rounded text-slate-600 text-[11px] font-bold">g</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkbox "Bán trực tiếp (i)" */}
                    <div className="flex items-center gap-2 select-none pt-1">
                      <input
                        type="checkbox"
                        id="newprod-directsell-chk"
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        checked={newProdDirectSell}
                        onChange={(e) => setNewProdDirectSell(e.target.checked)}
                      />
                      <label htmlFor="newprod-directsell-chk" className="text-slate-705 font-extrabold flex items-center gap-1 cursor-pointer">
                        Bán trực tiếp
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Bật lên để cho phép nhân viên quét mã bán trực tiếp trên màn thu ngân" />
                      </label>
                    </div>

                  </div>

                  {/* RIGHT COMPARTMENT (1 GRID COL FOR PICTURE THUMBNAILS - Screenshot 2 Style) */}
                  <div className="space-y-4">
                    <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-widest block text-left">Hình ảnh chuẩn</label>
                    
                    {/* Big picture uploading drop box */}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-2 bg-slate-50/50 flex flex-col items-center justify-center select-none cursor-pointer hover:bg-slate-100">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => alert("Chọn file ảnh gốc từ máy chuyên dụng...")}
                        className="text-[#0066FF] font-extrabold text-[11px]"
                      >
                        Thêm ảnh
                      </button>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Mỗi kích cỡ ảnh gốc không quá 2 MB
                      </p>
                    </div>

                    {/* Small vertical thumb containers matching exactly Screenshot 2 */}
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="aspect-square rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-slate-100 cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-slate-350" />
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-105 text-left text-[10px] text-blue-700 leading-relaxed">
                      💡 <strong>Gợi ý:</strong> Chọn ảnh rõ ràng, có nền trắng sáng bóng để Phong Hùng POS hỗ trợ in nhãn dán đẹp mắt chuẩn Đức.
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Row of buttons of modal creation (Screenshot 2 style "Bỏ qua" & "Lưu") */}
            <div className="bg-slate-55 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 flex justify-end gap-2 text-xs font-sans">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-5 py-2 hover:bg-slate-150 border border-slate-300 dark:border-slate-800 rounded font-bold text-slate-700 bg-white dark:bg-slate-900 cursor-pointer text-[12px]"
              >
                Bỏ qua
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0066FF] hover:bg-blue-700 rounded font-extrabold text-white cursor-pointer shadow-md text-[12px]"
              >
                Lưu mặt hàng
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================= */}
      {/* SCREENSHOT 9: DYNAMIC EXCEL FILE IMPORT CONTROL PANEL */}
      {/* ========================================================= */}
      {showExcelWizard && (
        <div className="fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200 text-left">
          
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
            
            {/* Header segment of excel wizard */}
            <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex items-center justify-between select-none">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                Nhập hàng hóa từ file dữ liệu 
                <span className="text-slate-400 font-normal lowercase">
                  (Tải về file mẫu: <span className="text-blue-600 underline font-bold cursor-pointer">Excel file</span>)
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExcelWizard(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-750 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body matching Screenshot 9 options */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              
              {/* Question 1: Trùng mã hàng/mã vạch, khác tên */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <span className="font-extrabold text-[#1F2937] text-xs uppercase block tracking-wider">
                  Xử lý <strong className="italic text-rose-600">trùng</strong> mã hàng/mã vạch, <strong className="italic text-rose-600">khác</strong> tên hàng hóa?
                </span>
                <div className="space-y-1.5 pl-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="conflict-mami"
                      className="w-4 h-4 text-blue-600"
                      checked={excelConflictResult === 'error'}
                      onChange={() => setExcelConflictResult('error')}
                    />
                    <span>Báo lỗi và dừng import</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="conflict-mami"
                      className="w-4 h-4 text-blue-600"
                      checked={excelConflictResult === 'replace'}
                      onChange={() => setExcelConflictResult('replace')}
                    />
                    <span>Thay thế tên hàng cũ bằng tên hàng mới</span>
                  </label>
                </div>
              </div>

              {/* Question 2: Trùng mã vạch, khác mã hàng */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-[#1F2937] text-xs uppercase tracking-wider">
                    Xử lý trùng mã vạch, khác mã hàng?
                  </span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Lựa chọn cách thức máy xử lý nếu phát hiện cùng một mã vạch định danh tồn tại ở nhiều mã hàng gia dụng khác nhau trong tờ khai Excel." />
                </div>
                <div className="space-y-1.5 pl-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="conflict-barcode"
                      className="w-4 h-4 text-blue-600"
                      checked={excelConflictBarcode === 'error'}
                      onChange={() => setExcelConflictBarcode('error')}
                    />
                    <span>Báo lỗi và dừng import</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="conflict-barcode"
                      className="w-4 h-4 text-blue-600"
                      checked={excelConflictBarcode === 'replace'}
                      onChange={() => setExcelConflictBarcode('replace')}
                    />
                    <span>Thay thế mã hàng cũ bằng mã hàng mới</span>
                  </label>
                </div>
              </div>

              {/* Question 3: Cập nhật tồn kho? */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-extrabold text-[#1F2937] uppercase tracking-wider">Cập nhật tồn kho?</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Cho phép hệ thống ghi đè cộng dồn số tồn sẵn có và số tồn trong file excel nạp." />
                </div>
                <div className="flex gap-4 pl-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="opt-upstock"
                      className="w-4 h-4 text-blue-600"
                      checked={!excelUpdateStock}
                      onChange={() => setExcelUpdateStock(false)}
                    />
                    <span>Không</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="opt-upstock"
                      className="w-4 h-4 text-blue-600"
                      checked={excelUpdateStock}
                      onChange={() => setExcelUpdateStock(true)}
                    />
                    <span>Có</span>
                  </label>
                </div>
              </div>

              {/* Question 4: Cập nhật giá vốn? */}
              <div className="space-y-2 border-b border-slate-100 pb-3 text-xs">
                <span className="font-extrabold text-[#1F2937] uppercase tracking-wider block">Cập nhật giá vốn?</span>
                <div className="flex gap-4 pl-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="opt-upcost"
                      className="w-4 h-4 text-blue-600"
                      checked={!excelUpdateCostPrice}
                      onChange={() => setExcelUpdateCostPrice(false)}
                    />
                    <span>Không</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="opt-upcost"
                      className="w-4 h-4 text-blue-600"
                      checked={excelUpdateCostPrice}
                      onChange={() => setExcelUpdateCostPrice(true)}
                    />
                    <span>Có</span>
                  </label>
                </div>
              </div>

              {/* Question 5: Cập nhật mô tả? */}
              <div className="space-y-2 text-xs">
                <span className="font-extrabold text-[#1F2937] uppercase tracking-wider block">Cập nhật mô tả?</span>
                <div className="flex gap-4 pl-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="opt-updesc"
                      className="w-4 h-4 text-blue-600"
                      checked={!excelUpdateDesc}
                      onChange={() => setExcelUpdateDesc(false)}
                    />
                    <span>Không</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="opt-updesc"
                      className="w-4 h-4 text-blue-600"
                      checked={excelUpdateDesc}
                      onChange={() => setExcelUpdateDesc(true)}
                    />
                    <span>Có</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Bottom Submit bar representing blue action block in Screenshot 9 */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 text-xs px-6">
              <button
                type="button"
                onClick={() => setShowExcelWizard(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              
              {/* Blue solid matching "Chọn file dữ liệu" in Screenshot 9 */}
              <button
                type="button"
                onClick={handleFinishExcelImport}
                className="px-5 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded font-extrabold cursor-pointer border border-blue-700 flex items-center gap-1.5 shadow-[0_4px_10px_rgba(0,102,255,0.2)]"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
                Chọn file dữ liệu
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
