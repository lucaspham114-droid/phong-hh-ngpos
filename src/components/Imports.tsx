import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
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

const mapHeaderValue = (h: string) => {
  const clean = h.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  if (clean === 'mahang' || clean === 'ma sp' || clean === 'masp' || clean === 'ma hang' || clean === 'ma') return 'maSP';
  if (clean === 'tenhang' || clean === 'ten sp' || clean === 'tensp' || clean === 'ten hang' || clean === 'ten') return 'tenSP';
  if (clean === 'nhomhang' || clean === 'nhom hang' || clean === 'nhom') return 'nhomHang';
  if (clean === 'donvitinh' || clean === 'dvt' || clean === 'don vi' || clean === 'donvitinh') return 'dvt';
  if (clean === 'mavach' || clean === 'ma vach' || clean === 'barcode') return 'maVach';
  if (clean === 'giavon' || clean === 'gia von' || clean === 'costprice' || clean === 'gia von nhap' || clean === 'gianhap') return 'costPrice';
  if (clean === 'giaban' || clean === 'gia ban' || clean === 'retailprice' || clean === 'gia niem yet ban le') return 'salePrice';
  if (clean === 'tondau' || clean === 'ton dau' || clean === 'ton' || clean === 'tonkho') return 'tonDau';
  if (clean === 'tontoithieu' || clean === 'ton toi thieu') return 'tonToiThieu';
  if (clean === 'tukhoa' || clean === 'tu khoa' || clean === 'keywords') return 'tuKhoa';
  if (clean === 'soluong' || clean === 'so luong' || clean === 'soluongnhap' || clean === 'so luong nhap') return 'quantity';
  if (clean === 'gianhap' || clean === 'gia nhap') return 'costPrice';
  if (clean === 'giabanmoi' || clean === 'gia ban moi' || clean === 'giabanmoi' || clean === 'gia ban moi') return 'salePriceNew';
  if (clean === 'ghichu' || clean === 'ghi chu') return 'note';
  return null;
};

interface ImportsProps {
  products: Product[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  settings: SystemSettings;
  currentStaffName: string;
  onSaveImportSlip: (newSlip: ImportSlip) => void;
  onAddNewProduct: (newProduct: Product, initialQty: number) => void;
  onEditProduct: (updatedProduct: Product) => void;
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
  onEditProduct,
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

  // Brand new interactive Excel/CSV state attributes
  const [excelImportType, setExcelImportType] = useState<'products' | 'purchase'>('products');
  const [excelInputText, setExcelInputText] = useState('');
  const [excelFileName, setExcelFileName] = useState('');
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [excelShowPreview, setExcelShowPreview] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');

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

  // Interactive Excel / CSV Import & Validation engine
  const triggerExcelFileSelect = (type: 'products' | 'purchase') => {
    setExcelImportType(type);
    setExcelInputText('');
    setExcelFileName('');
    setExcelRows([]);
    setExcelShowPreview(false);
    setShowExcelWizard(true);
  };

  // Downloads structured template format for client
  const handleDownloadTemplate = (type: 'products' | 'purchase') => {
    let csvContent = "";
    if (type === 'products') {
      csvContent = "Mã hàng,Tên hàng,Nhóm hàng,Đơn vị tính,Giá vốn,Giá bán,Tồn đầu,Tồn tối thiểu,Từ khóa tìm kiếm\n" +
                   "SP0001,Nồi inox 24cm,Nồi,Cái,90000,150000,20,5,noi inox\n" +
                   "SP0002,Chảo chống dính 28cm,Chảo,Cái,70000,120000,15,4,chao chong dinh\n" +
                   "SP0003,Ấm siêu tốc 1.8L,Điện gia dụng,Cái,110000,180000,10,3,am sieu toc\n";
    } else {
      csvContent = "Mã hàng,Tên hàng,Đơn vị tính,Số lượng nhập,Giá nhập,Giá bán mới,Ghi chú\n" +
                   "SP0001,Nồi inox 24cm,Cái,10,90000,150000,Nhập hàng đợt 1\n" +
                   "SP0002,Chảo chống dính 28cm,Cái,20,70000,,Nhập bổ sung\n" +
                   "SP0003,Ấm siêu tốc 1.8L,Cái,5,110000,180000,Khách đặt trước\n";
    }
    
    // Add BOM for UTF-8 in Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", type === 'products' ? "mau_danh_muc_san_pham.csv" : "mau_phieu_nhap_hang.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'products' | 'purchase') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setExcelFileName(file.name);
    
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm') || file.name.endsWith('.xls');

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          if (rawRows.length === 0) {
            alert("File Excel này không chứa dữ liệu!");
            return;
          }
          
          const firstLine: any[] = rawRows[0] || [];
          const headersMapped = firstLine.map(h => mapHeaderValue(String(h || '')));

          const parsedRows = rawRows.slice(1).map((rowArr: any[]) => {
            const item: any = {};
            headersMapped.forEach((mappedHeader, i) => {
              if (mappedHeader) {
                const val = rowArr[i];
                item[mappedHeader] = val !== undefined && val !== null ? String(val).trim() : '';
              }
            });
            return item;
          }).filter((item: any) => Object.values(item).some(val => String(val).trim().length > 0));

          setExcelInputText(`Đã nạp thành công từ tệp Excel: ${file.name}`);
          processParsedContent(parsedRows, type);
        } catch (err) {
          console.error("Lỗi đọc file Excel:", err);
          alert("Có lỗi xảy ra khi giải mã file Excel. Hãy chắc chắn đó là file hợp lệ!");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setExcelInputText(text);
          processParsedContent(text, type);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemoData = (type: 'products' | 'purchase') => {
    let demoText = "";
    if (type === 'products') {
      demoText = "Mã hàng,Tên hàng,Nhóm hàng,Đơn vị tính,Giá vốn,Giá bán,Tồn đầu,Tồn tối thiểu,Từ khóa tìm kiếm\n" +
                 "SP0001,Nồi inox 24cm,Nồi,Cái,90000,150000,20,5,noi inox\n" +
                 "SP0002,Chảo chống dính 28cm,Chảo,Cái,70000,120000,15,4,chao chong dinh\n" +
                 "SP0003,Ấm siêu tốc 1.8L,Điện gia dụng,Cái,110000,180000,10,3,am sieu toc\n" +
                 ",Sản phẩm thiếu mã,Khác,Hộp,12000,20000,,,thieu ma sp\n" + 
                 "SP0002,Chảo inox 28cm cao cấp,Chảo,Cái,80000,130000,15,4,bi trung ma nhung khac ten\n" + 
                 "SP0010,,Thiết bị,Cái,50000,90000,10,3,thieu ten sp\n"; 
    } else {
      demoText = "Mã hàng,Tên hàng,Đơn vị tính,Số lượng nhập,Giá nhập,Giá bán mới,Ghi chú\n" +
                 "SP0001,Nồi inox 24cm,Cái,10,90000,150000,Nhập đợt 1\n" +
                 "SP0002,Chảo chống dính 28cm,Cái,20,70000,120000,Giao nhanh\n" +
                 "SP0100,Sản phẩm chưa đăng ký,Cái,5,100000,140000,Sẽ tự động khai sinh\n" + 
                 "SP0001,Nồi inox 24cm,Cái,-5,90000,,Sai số lượng\n" + 
                 "SP0002,Chảo chống dính 28cm,Cái,15,-70000,120000,Sai giá nhập\n"; 
    }
    setExcelInputText(demoText);
    processParsedContent(demoText, type);
  };

  const parseContentText = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';

    const rawHeaders = firstLine.split(delimiter).map(h => h.trim().toLowerCase());

    function splitCSVLine(txt: string, delim: string): string[] {
      if (delim === '\t' || delim === ';') {
        return txt.split(delim);
      }
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < txt.length; i++) {
        const c = txt[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === delim && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur);
      return result;
    }

    const headersMapped = rawHeaders.map(h => mapHeaderValue(h));

    const rows = lines.slice(1).map((line) => {
      const rawValues = splitCSVLine(line, delimiter);
      const item: any = {};
      headersMapped.forEach((mappedHeader, i) => {
        if (mappedHeader) {
          item[mappedHeader] = rawValues[i] ? rawValues[i].trim() : '';
        }
      });
      return item;
    });

    return { headers: headersMapped, rows };
  };

  const processParsedContent = (input: string | any[], type: 'products' | 'purchase') => {
    let parsedRaw: any[] = [];
    if (typeof input === 'string') {
      if (!input.trim()) {
        setExcelRows([]);
        return;
      }
      parsedRaw = parseContentText(input).rows;
    } else if (Array.isArray(input)) {
      parsedRaw = input;
    }
    
    // Validate rows
    const validated = parsedRaw.map((r, idx) => {
      const lineNum = idx + 2;
      const maSP = (r.maSP || "").trim();
      const tenSP = (r.tenSP || "").trim();
      const dvt = (r.dvt || "Cái").trim();
      const nhomHang = (r.nhomHang || "Điện gia dụng").trim();
      
      const quantity = Math.max(-999999, parseInt(r.quantity) || 0);
      const costPrice = Math.max(-999999, parseFloat(r.costPrice) || 0);
      const salePrice = Math.max(0, parseFloat(r.salePrice) || 0);
      const salePriceNew = r.salePriceNew ? Math.max(0, parseFloat(r.salePriceNew)) : undefined;
      const note = (r.note || "").trim();
      const tuKhoa = (r.tuKhoa || "").trim();
      const tonDau = Math.max(0, parseInt(r.tonDau) || 0);
      const tonToiThieu = Math.max(0, parseInt(r.tonToiThieu) || 5);

      const existingProd = products.find(p => p.maSP === maSP);

      let status: 'valid' | 'invalid' = 'valid';
      let detail = 'Hợp lệ';
      let actionType: 'create' | 'update' | 'skip' | 'error' = 'create';

      if (type === 'products') {
        if (!tenSP) {
          status = 'invalid';
          detail = 'Thiếu tên sản phẩm (Tên hàng hóa là bắt buộc)';
          actionType = 'error';
        } else if (existingProd) {
          // Conflict checking
          if (existingProd.tenSP !== tenSP && excelConflictResult === 'error') {
            status = 'invalid';
            detail = `Trùng mã hàng nhưng khác tên gốc: "${existingProd.tenSP}"`;
            actionType = 'error';
          } else {
            detail = `Trùng mã - Sẽ cập nhật sản phẩm cũ`;
            actionType = 'update';
          }
        } else {
          detail = `Mã mới - Sẽ tạo mới danh mục sản phẩm`;
          actionType = 'create';
        }
      } else {
        // Purchase slip validation
        if (!maSP) {
          status = 'invalid';
          detail = 'Chưa có mã hàng (Thiếu MaHang)';
          actionType = 'error';
        } else if (!existingProd) {
          if (excelUpdateStock) {
            detail = `Chưa có mã - Sẽ tự khai sinh sản phẩm mới: "${tenSP || 'Hàng mới tự tạo'}"`;
            actionType = 'create';
          } else {
            status = 'invalid';
            detail = `Mã hàng không tồn tại trong hệ thống (Hãy bật "Tự tạo sản phẩm")`;
            actionType = 'error';
          }
        } else {
          // Match
          if (existingProd.tenSP !== tenSP && excelConflictResult === 'error') {
            status = 'invalid';
            detail = `Mã trùng nhưng khác tên trên app: "${existingProd.tenSP}"`;
            actionType = 'error';
          } else {
            detail = `Hợp lệ - Khớp hàng hóa sẵn có`;
            actionType = 'update';
          }
        }

        // Check quantity or price validation
        if (status === 'valid') {
          if (quantity <= 0) {
            status = 'invalid';
            detail = `Số lượng nhập phải lớn hơn 0 (Đang ghi nhận: ${quantity})`;
            actionType = 'error';
          } else if (costPrice < 0) {
            status = 'invalid';
            detail = 'Giá nhập không được nhỏ hơn 0';
            actionType = 'error';
          }
        }
      }

      return {
        _lineNum: lineNum,
        maSP: maSP || (type === 'products' ? `SP_AUTO_${Date.now().toString().slice(-4)}_${idx}` : ''),
        tenSP: tenSP || (existingProd ? existingProd.tenSP : ''),
        dvt,
        nhomHang,
        quantity,
        costPrice: costPrice > 0 ? costPrice : (existingProd ? existingProd.giaNhap || 0 : 0),
        salePrice: salePrice > 0 ? salePrice : (existingProd ? existingProd.giaBan || 0 : 0),
        salePriceNew,
        note,
        tuKhoa,
        tonDau,
        tonToiThieu,
        status,
        detail,
        actionType
      };
    });

    setExcelRows(validated);
  };

  const handleDownloadErrorsCSV = () => {
    const errorRows = excelRows.filter(r => r.status === 'invalid');
    if (errorRows.length === 0) {
      alert("Tuyệt vời! Không có dòng lỗi nào trong bảng kiểm tra của bạn.");
      return;
    }

    let csvContent = "Dong,MaHang,TenHang,LoiChiTiet\n";
    errorRows.forEach(r => {
      csvContent += `${r._lineNum},${r.maSP},${r.tenSP},"${r.detail.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `loi_import_${excelImportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = () => {
    const validRows = excelRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      alert("Không tìm thấy dòng hợp lệ để thực thi! Vui lòng kiểm tra lại cấu trúc file nạp.");
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    if (excelImportType === 'products') {
      // Create/Update general catalog items
      validRows.forEach(r => {
        const existing = products.find(p => p.maSP === r.maSP || p.maSP === r.maSP.toUpperCase());
        if (existing) {
          const updatedProduct: Product = {
            ...existing,
            tenSP: excelConflictResult === 'replace' ? r.tenSP : existing.tenSP,
            giaNhap: excelUpdateCostPrice ? r.costPrice : existing.giaNhap,
            giaBan: r.salePrice || existing.giaBan,
            dvt: r.dvt || existing.dvt,
            nhomHang: r.nhomHang || existing.nhomHang
          };
          onEditProduct(updatedProduct);
          updatedCount++;
        } else {
          const searchKeywords = `${r.tenSP.toLowerCase()} ${r.nhomHang.toLowerCase()} ${r.maSP.toLowerCase()}`;
          const newProduct: Product = {
            maSP: r.maSP,
            tenSP: r.tenSP,
            nhomHang: r.nhomHang,
            dvt: r.dvt,
            maVach: r.maSP,
            tuKhoa: searchKeywords,
            giaNhap: r.costPrice,
            giaBan: r.salePrice,
            trangThai: 'Bán'
          };
          onAddNewProduct(newProduct, r.tonDau);
          createdCount++;
        }
      });

      alert(`Đã hoàn tất import danh mục hàng hóa!\n- Khởi tạo mới: ${createdCount} sản phẩm\n- Cập nhật ghi đè: ${updatedCount} sản phẩm`);
    } else {
      // Slip purchase items
      const cartItemsToAppend: any[] = [];

      validRows.forEach(r => {
        let matchedProd = products.find(p => p.maSP === r.maSP);
        
        if (!matchedProd) {
          // Auto create product on-the-fly
          const searchKeywords = `${r.tenSP.toLowerCase()} ${r.maSP.toLowerCase()}`;
          matchedProd = {
            maSP: r.maSP,
            tenSP: r.tenSP || 'Hàng tự tạo',
            nhomHang: 'Điện gia dụng',
            dvt: r.dvt || 'Cái',
            maVach: r.maSP,
            tuKhoa: searchKeywords,
            giaNhap: r.costPrice,
            giaBan: r.salePriceNew || r.costPrice * 1.45,
            trangThai: 'Bán'
          };
          onAddNewProduct(matchedProd, 0);
          createdCount++;
        } else if (excelUpdateCostPrice || r.salePriceNew) {
          const updatedProduct: Product = {
            ...matchedProd,
            giaNhap: excelUpdateCostPrice ? r.costPrice : matchedProd.giaNhap,
            giaBan: r.salePriceNew || matchedProd.giaBan
          };
          onEditProduct(updatedProduct);
          matchedProd = updatedProduct;
          updatedCount++;
        }

        cartItemsToAppend.push({
          product: matchedProd,
          quantity: r.quantity,
          costPrice: r.costPrice,
          discount: 0,
          note: r.note || '',
          isEditingNote: false
        });
      });

      // Pushes items into the active cart list
      setImportCart(prev => {
        const updatedCart = [...prev];
        cartItemsToAppend.forEach(appendItem => {
          const idx = updatedCart.findIndex(item => item.product.maSP === appendItem.product.maSP);
          if (idx !== -1) {
            updatedCart[idx] = {
              ...updatedCart[idx],
              quantity: updatedCart[idx].quantity + appendItem.quantity,
              costPrice: appendItem.costPrice,
              note: appendItem.note || updatedCart[idx].note
            };
          } else {
            updatedCart.push(appendItem);
          }
        });
        return updatedCart;
      });

      alert(`Khởi tạo phiếu thành công! Thêm ${cartItemsToAppend.length} sản phẩm từ file Excel vào giỏ hàng phiếu nhập.`);
    }

    setShowExcelWizard(false);
    setExcelShowPreview(false);
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
          <button 
            type="button" 
            onClick={() => triggerExcelFileSelect('products')}
            className="p-1 px-2.5 hover:bg-emerald-800 dark:hover:bg-slate-700 rounded-md transition text-emerald-100 hover:text-white cursor-pointer font-bold text-[10.5px] flex items-center gap-1" 
            title="Import danh mục sản phẩm Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-250" />
            <span className="hidden xl:inline">Nhập từ mẫu SP</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => triggerExcelFileSelect('purchase')}
            className="p-1 px-2.5 hover:bg-emerald-800 dark:hover:bg-slate-700 rounded-md transition text-blue-100 hover:text-white cursor-pointer font-bold text-[10.5px] flex items-center gap-1 border-l border-emerald-500/35" 
            title="Import phiếu nhập hàng Excel"
          >
            <Upload className="w-4 h-4 text-blue-200" />
            <span className="hidden xl:inline">Nhập phiếu hàng</span>
          </button>

          <span className="w-[1px] h-4 bg-emerald-550/40 dark:bg-slate-700 mx-1"></span>

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
                  <div className="pt-2 text-xs flex justify-center gap-4">
                    <span className="text-slate-500">Tải dữ liệu mẫu:</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('products')}
                      className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
                    >
                      📁 Mẫu Danh mục SP
                    </button>
                    <span className="text-slate-350">|</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('purchase')}
                      className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
                    >
                      🧾 Mẫu Phiếu Nhập
                    </button>
                  </div>
                </div>

                {/* Split control action buttons mirroring KiotViet custom wizard */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => triggerExcelFileSelect('products')}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all transform hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-700 uppercase"
                  >
                    <Upload className="w-4 h-4 text-white" />
                    Import danh mục SP
                  </button>

                  <button
                    type="button"
                    id="excel-select-trigger-btn"
                    onClick={() => triggerExcelFileSelect('purchase')}
                    className="flex-1 px-4 py-3 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all transform hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-blue-600 uppercase"
                  >
                    <Upload className="w-4 h-4 text-white" />
                    Import phiếu nhập hàng
                  </button>
                </div>

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
      {/* SCREENSHOT 9 & USER DEFINED EXCEL IMPORT CONTROL PANEL CONTAINER */}
      {/* ========================================================= */}
      {showExcelWizard && (
        <div className="fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200 text-left">
          
          <div className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800">
            
            {/* Header segment of excel wizard */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 flex items-center justify-between select-none">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  HỆ THỐNG NHẬP DỮ LIỆU EXCEL / CSV CHUYÊN NGHIỆP
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tải file mẫu, điền hóa đơn vật tư và thực hiện kiểm tra kiểm thái lỗi trực diện.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExcelWizard(false);
                  setExcelShowPreview(false);
                }}
                className="p-1 px-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-extrabold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Segment: Main Steps */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
              
              {/* Type Selector (Import Mode) & Sample Download block shortened */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/70 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Chế độ nhập:</span>
                  {excelImportType === 'products' ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-black uppercase border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1.5">
                        📁 Danh mục sản phẩm
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setExcelImportType('purchase');
                          setExcelInputText('');
                          setExcelRows([]);
                          setExcelShowPreview(false);
                        }}
                        className="text-[11px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition"
                      >
                        (Đổi sang Phiếu nhập)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-lg text-xs font-black uppercase border border-blue-200 dark:border-blue-900/60 flex items-center gap-1.5">
                        🧾 Phiếu nhập hàng
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setExcelImportType('products');
                          setExcelInputText('');
                          setExcelRows([]);
                          setExcelShowPreview(false);
                        }}
                        className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer transition"
                      >
                        (Đổi sang Danh mục SP)
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadTemplate(excelImportType)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition flex items-center gap-1 border border-slate-300 dark:border-slate-700 font-sans cursor-pointer"
                >
                  📥 Tải file mẫu ({excelImportType === 'products' ? 'Danh mục' : 'Hóa đơn'})
                </button>
              </div>

              {!excelShowPreview ? (
                /* Step INPUT: Upload & Settings Segment */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                  
                  {/* Left: Raw file uploading interface */}
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <span className="font-extrabold text-[#1F2937] dark:text-slate-150 text-xs uppercase block tracking-wider">
                        Nạp tệp Excel (.xlsx, .xlsm, .xls) hoặc file CSV (Google Trang Tính,...)
                      </span>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-850 p-8 rounded-xl text-center bg-slate-50/50 dark:bg-slate-905/30 hover:bg-slate-50 cursor-pointer transition relative">
                        <Upload className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                          {excelFileName ? `Đã chọn: ${excelFileName}` : "Kéo thả hoặc nhấp vào đây để tải file lên"}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Định dạng hỗ trợ: .xlsx, .xlsm, .xls, .csv từ Google Sheets & Microsoft Excel
                        </span>
                        <input
                          type="file"
                          accept=".xlsx,.xlsm,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                          onChange={(e) => handleFileUpload(e, excelImportType)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Validation parameters (Screenshot 9) */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl p-4 md:p-5 space-y-4">
                    <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white pb-2 border-b border-slate-205 dark:border-slate-800 flex items-center gap-1.5">
                      ⚡ THIẾT LẬP THAM SỐ KIỂM TRA SÁNG LỌC
                    </h4>

                    {/* Param 1: Trùng mã hàng/mã vạch khác tên */}
                    <div className="space-y-1.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase block">
                        Xử lý trùng mã hàng, khác tên hàng hóa:
                      </span>
                      <div className="flex gap-4 text-xs font-bold pl-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="conflict-mami"
                            className="w-4 h-4 text-blue-600"
                            checked={excelConflictResult === 'error'}
                            onChange={() => {
                              setExcelConflictResult('error');
                              setTimeout(() => processParsedContent(excelInputText, excelImportType), 50);
                            }}
                          />
                          <span>Báo lỗi dừng import</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-emerald-600">
                          <input
                            type="radio"
                            name="conflict-mami"
                            className="w-4 h-4 text-blue-600"
                            checked={excelConflictResult === 'replace'}
                            onChange={() => {
                              setExcelConflictResult('replace');
                              setTimeout(() => processParsedContent(excelInputText, excelImportType), 50);
                            }}
                          />
                          <span>Ghi đè bằng tên hàng có trong file</span>
                        </label>
                      </div>
                    </div>

                    {/* Param 2: Trùng mã vạch */}
                    <div className="space-y-1.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase block">
                        Xử lý trùng mã vạch định danh:
                      </span>
                      <div className="flex gap-4 text-xs font-bold pl-1">
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
                        <label className="flex items-center gap-2 cursor-pointer select-none text-blue-600">
                          <input
                            type="radio"
                            name="conflict-barcode"
                            className="w-4 h-4 text-blue-600"
                            checked={excelConflictBarcode === 'replace'}
                            onChange={() => setExcelConflictBarcode('replace')}
                          />
                          <span>Bỏ qua mã cũ, áp mã mới</span>
                        </label>
                      </div>
                    </div>

                    {/* Param 3: Cập nhật tồn kho hoặc tự tạo khi chưa tồn tại */}
                    <div className="space-y-1.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase block">
                        Nếu mã hàng chưa tồn tại trên hệ thống:
                      </span>
                      <div className="flex gap-4 text-xs font-bold pl-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="opt-upstock"
                            className="w-4 h-4 text-blue-600"
                            checked={!excelUpdateStock}
                            onChange={() => {
                              setExcelUpdateStock(false);
                              setTimeout(() => processParsedContent(excelInputText, excelImportType), 50);
                            }}
                          />
                          <span>Báo lỗi không cho phép</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-emerald-600">
                          <input
                            type="radio"
                            name="opt-upstock"
                            className="w-4 h-4 text-blue-600"
                            checked={excelUpdateStock}
                            onChange={() => {
                              setExcelUpdateStock(true);
                              setTimeout(() => processParsedContent(excelInputText, excelImportType), 50);
                            }}
                          />
                          <span>Tự tạo sản phẩm mới</span>
                        </label>
                      </div>
                    </div>

                    {/* Param 4: Cập nhật giá vốn */}
                    <div className="space-y-1.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase block">
                        Có cập nhật giá vốn gốc hàng hóa?
                      </span>
                      <div className="flex gap-4 text-xs font-bold pl-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="opt-upcost"
                            className="w-4 h-4 text-blue-600"
                            checked={!excelUpdateCostPrice}
                            onChange={() => setExcelUpdateCostPrice(false)}
                          />
                          <span>Không thay đổi</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-blue-600">
                          <input
                            type="radio"
                            name="opt-upcost"
                            className="w-4 h-4 text-blue-600"
                            checked={excelUpdateCostPrice}
                            onChange={() => setExcelUpdateCostPrice(true)}
                          />
                          <span>Có cập nhật</span>
                        </label>
                      </div>
                    </div>

                    {/* Param 5: Khai thông tin */}
                    <div className="flex items-center justify-between gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 text-[10px] text-emerald-700 dark:text-emerald-400">
                      <div>
                        💡 <strong>Lưu ý quan trọng:</strong> Hệ thống sử dụng thuật toán thông minh chuẩn Đức để loại bỏ dấu, lọc khoảng trắng thừa, và so trùng mã nhằm hạn chế tối đa trùng lặp tồn kho.
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Step PREVIEW: Validation Results Listing */
                <div className="space-y-5 animate-in fade-in zoom-in duration-150">
                  
                  {/* Cards Dashboard summarizing validation outcome */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-stone-700">
                    
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tổng số dòng nạp</span>
                        <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{excelRows.length} dòng</div>
                      </div>
                      <FileSpreadsheet className="w-10 h-10 text-slate-400 opacity-60" />
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Hợp lệ (Sẵn sàng nhập)</span>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {excelRows.filter(r => r.status === 'valid').length} dòng
                        </div>
                      </div>
                      <Check className="w-10 h-10 text-emerald-500 opacity-60" />
                    </div>

                    <div className={`p-4 rounded-xl flex items-center justify-between border ${
                      excelRows.some(r => r.status === 'invalid')
                        ? 'bg-red-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200'
                    }`}>
                      <div className="space-y-0.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          excelRows.some(r => r.status === 'invalid') ? 'text-red-500' : 'text-slate-400'
                        }`}>Dòng bị lỗi loại bỏ</span>
                        <div className={`text-2xl font-black font-mono ${
                          excelRows.some(r => r.status === 'invalid') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                        }`}>
                          {excelRows.filter(r => r.status === 'invalid').length} dòng
                        </div>
                      </div>
                      <AlertCircle className={`w-10 h-10 opacity-60 ${
                        excelRows.some(r => r.status === 'invalid') ? 'text-red-500' : 'text-slate-400'
                      }`} />
                    </div>

                  </div>

                  {/* Filter Status controls & Download Error option */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 select-none w-full sm:w-auto">
                      <span className="font-bold text-slate-550 mr-1 text-[11px] uppercase tracking-wider">Bộ lọc hiển thị:</span>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 font-bold rounded ${
                          filterStatus === 'all'
                            ? 'bg-slate-700 text-white'
                            : 'bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Tất cả dòng ({excelRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('valid')}
                        className={`px-3 py-1.5 font-bold rounded ${
                          filterStatus === 'valid'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Chỉ dòng Hợp lệ ({excelRows.filter(r => r.status === 'valid').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('invalid')}
                        className={`px-3 py-1.5 font-bold rounded ${
                          filterStatus === 'invalid'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Dòng có lỗi ({excelRows.filter(r => r.status === 'invalid').length})
                      </button>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto flex justify-end">
                      {excelRows.some(r => r.status === 'invalid') && (
                        <button
                          type="button"
                          onClick={handleDownloadErrorsCSV}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-[11px] font-black rounded-lg transition flex items-center gap-1.5"
                        >
                          📥 Xuất danh sách dòng lỗi (.csv)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Datatable showing parsed and checked items */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-xs bg-white dark:bg-slate-905 select-none">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest sticky top-0">
                        <tr>
                          <th className="p-3 font-extrabold w-12 text-center">Dòng</th>
                          <th className="p-3 font-extrabold w-36">Mã hàng</th>
                          <th className="p-3 font-extrabold">Tên hàng hóa</th>
                          {excelImportType === 'purchase' && (
                            <>
                              <th className="p-3 font-extrabold w-20 text-center">S.Lượng</th>
                              <th className="p-3 font-extrabold w-28 text-right">Giá gốc nạp</th>
                            </>
                          )}
                          {excelImportType === 'products' && (
                            <>
                              <th className="p-3 font-extrabold w-28 text-right">Giá vốn</th>
                              <th className="p-3 font-extrabold w-28 text-right">Giá niêm yết</th>
                            </>
                          )}
                          <th className="p-3 font-extrabold w-24">Vị thế</th>
                          <th className="p-3 font-extrabold">Kết quả lọc lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                        {excelRows
                          .filter(r => {
                            if (filterStatus === 'valid') return r.status === 'valid';
                            if (filterStatus === 'invalid') return r.status === 'invalid';
                            return true;
                          })
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition duration-150 ${
                                row.status === 'invalid' ? 'bg-rose-50/20' : ''
                              }`}
                            >
                              <td className="p-3 font-mono font-bold text-slate-400 text-center">{row._lineNum}</td>
                              <td className="p-3 font-mono font-black text-slate-700 dark:text-slate-350">{row.maSP}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={row.tenSP}>
                                {row.tenSP || "— Lack and Missing —"}
                              </td>
                              {excelImportType === 'purchase' && (
                                <>
                                  <td className="p-3 font-mono font-extrabold text-blue-600 text-center">{row.quantity}</td>
                                  <td className="p-3 font-mono text-center text-slate-600 dark:text-slate-400 text-right">{formatVND(row.costPrice)}</td>
                                </>
                              )}
                              {excelImportType === 'products' && (
                                <>
                                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400 text-right">{formatVND(row.costPrice)}</td>
                                  <td className="p-3 font-mono text-blue-600 text-right font-bold">{formatVND(row.salePrice)}</td>
                                </>
                              )}
                              <td className="p-3">
                                {row.actionType === 'create' ? (
                                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Mới tinh</span>
                                ) : row.actionType === 'update' ? (
                                  <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Cập nhật</span>
                                ) : (
                                  <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Lỗi loại bỏ</span>
                                )}
                              </td>
                              <td className="p-3 text-[11px]">
                                {row.status === 'valid' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    ✓ {row.detail}
                                  </span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1 bg-rose-50/80 dark:bg-rose-950/30 px-2 py-1 rounded">
                                    ⚠ {row.detail}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        
                        {excelRows.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-slate-400 font-bold">
                              Dữ liệu rỗng. Hãy copy paste từ file mẫu hoặc tệp của bạn để khởi tạo!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Submit bar representing blue action block in Screenshot 9 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 text-xs px-6">
              
              <div className="text-slate-400 font-bold text-[11px]">
                {excelShowPreview ? (
                  <span>
                    Tổng dòng hợp lệ được nạp: <strong className="text-emerald-600 font-mono text-xs">{excelRows.filter(r => r.status === 'valid').length}</strong> dòng
                  </span>
                ) : (
                  <span>Chọn 1 trong 2 cách nạp để hệ thống kiểm toán lỗi trực diện.</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExcelWizard(false);
                    setExcelShowPreview(false);
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-350 dark:border-slate-700 rounded font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 cursor-pointer text-[12px]"
                >
                  Hủy bỏ
                </button>

                {excelShowPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setExcelShowPreview(false)}
                      className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 bg-white dark:bg-slate-800 font-extrabold rounded-lg text-[12px] transition"
                    >
                      Quay lại sửa thiết lập
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={excelRows.filter(r => r.status === 'valid').length === 0}
                      className="px-6 py-2 bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold rounded-lg text-[12px] shadow-[0_4px_12px_rgba(0,102,255,0.25)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-white" />
                      Import {excelRows.filter(r => r.status === 'valid').length} dòng hợp lệ vào app
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!excelInputText.trim()) {
                        alert("Vui lòng tải file hoặc dán dữ liệu thô từ Excel/CSV trước khi tiến hành lọc dữ liệu!");
                        return;
                      }
                      setExcelShowPreview(true);
                      setFilterStatus('all');
                    }}
                    className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded font-extrabold cursor-pointer border border-blue-700 flex items-center gap-1.5 shadow-[0_4px_10px_rgba(0,102,255,0.2)]"
                  >
                    Tiến hành kiểm tra & Xem trước lỗi 🔎
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
