import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  AlertCircle, 
  Package, 
  Tag, 
  Percent, 
  X,
  RefreshCw
} from 'lucide-react';
import { Product, InventoryItem, SystemSettings } from '../types';
import { formatVND, smartMatch, generateId } from '../utils';

interface InventoryListProps {
  products: Product[];
  inventory: InventoryItem[];
  settings: SystemSettings;
  canEditProducts: boolean; // Roles control
  onAddNewProduct: (newProduct: Product, initialQty: number) => void;
  onEditProduct: (updatedProduct: Product) => void;
}

export default function InventoryList({
  products,
  inventory,
  settings,
  canEditProducts,
  onAddNewProduct,
  onEditProduct
}: InventoryListProps) {
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowAddModal(true);
    };
    window.addEventListener('open-add-product-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-product-modal', handleOpenModal);
  }, []);

  // Form states for Add Product
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Điện gia dụng');
  const [unit, setUnit] = useState('Cái');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [barcode, setBarcode] = useState('');
  const [minStock, setMinStock] = useState<number>(5);
  const [initialQty, setInitialQty] = useState<number>(10);

  // Form states for Edit Product (scoped to editingProduct)
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('Điện gia dụng');
  const [editUnit, setEditUnit] = useState('Cái');
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editSellPrice, setEditSellPrice] = useState<number>(0);
  const [editBarcode, setEditBarcode] = useState('');
  const [editMinStock, setEditMinStock] = useState<number>(5);
  const [editStatus, setEditStatus] = useState<'Bán' | 'Ngừng bán'>('Bán');

  // Groups derived
  const productGroups = useMemo(() => {
    const groups = new Set(products.map(p => p.nhomHang));
    return ['All', ...Array.from(groups)];
  }, [products]);

  // Combine product definitions and real-time inventory counters
  const displayRows = useMemo(() => {
    return products.map(prod => {
      const inv = inventory.find(i => i.maSP === prod.maSP) || {
        tonDau: 0,
        tongNhap: 0,
        tongBan: 0,
        tonHienTai: 0,
        tonToiThieu: 5,
        trangThai: 'Hết hàng'
      };

      return {
        ...prod,
        ...inv,
        // Make sure we carry maSP and tenSP properly
        originalProduct: prod,
        originalInventory: inv
      };
    });
  }, [products, inventory]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return displayRows.filter(row => {
      const matchesSearch = smartMatch(row.tenSP, searchQuery, row.tuKhoa) || 
                            smartMatch(row.maSP, searchQuery) ||
                            smartMatch(row.maVach, searchQuery);
      
      const matchesGroup = selectedGroup === 'All' || row.nhomHang === selectedGroup;
      
      let matchesStatus = true;
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Sắp hết') matchesStatus = row.tonHienTai > 0 && row.tonHienTai <= row.tonToiThieu;
        else if (selectedStatus === 'Hết hàng') matchesStatus = row.tonHienTai === 0;
        else if (selectedStatus === 'Âm kho') matchesStatus = row.tonHienTai < 0;
        else if (selectedStatus === 'Đủ hàng') matchesStatus = row.tonHienTai > row.tonToiThieu;
        else if (selectedStatus === 'Ngừng bán') matchesStatus = row.trangThai === 'Ngừng bán';
      }

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [displayRows, searchQuery, selectedGroup, selectedStatus]);

  // Submit Add form
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedMaSP = generateId(settings.prefixSP, products);
    const keywords = `${name.toLowerCase()} ${group.toLowerCase()} ${barcode}`;

    const newProd: Product = {
      maSP: generatedMaSP,
      tenSP: name.trim(),
      nhomHang: group,
      dvt: unit,
      maVach: barcode.trim() || `893000${Date.now().toString().slice(-7)}`,
      tuKhoa: keywords,
      giaNhap: costPrice,
      giaBan: sellPrice,
      trangThai: 'Bán'
    };

    onAddNewProduct(newProd, initialQty);

    // Reset fields
    setName('');
    setCostPrice(0);
    setSellPrice(0);
    setBarcode('');
    setInitialQty(10);
    setMinStock(5);
    setShowAddModal(false);
  };

  // Open Edit Modal Form
  const tempOpenEdit = (row: any) => {
    if (!canEditProducts) {
      alert("Tài khoản nhân viên của bạn không có thẩm quyền sửa thông tin sản phẩm. Hãy liên hệ Admin.");
      return;
    }
    setEditingProduct(row.originalProduct);
    setEditName(row.tenSP);
    setEditGroup(row.nhomHang);
    setEditUnit(row.dvt);
    setEditCostPrice(row.giaNhap);
    setEditSellPrice(row.giaBan);
    setEditBarcode(row.maVach);
    setEditMinStock(row.originalInventory.tonToiThieu);
    setEditStatus(row.originalProduct.trangThai);
    setShowEditModal(true);
  };

  // Submit Edit Form
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated: Product = {
      ...editingProduct,
      tenSP: editName.trim(),
      nhomHang: editGroup,
      dvt: editUnit,
      maVach: editBarcode.trim(),
      giaNhap: editCostPrice,
      giaBan: editSellPrice,
      trangThai: editStatus
    };

    // Need to trigger updating list details
    onEditProduct(updated);

    // Update the local storage structure or triggers
    setShowEditModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-4 text-left">
      
      {/* Filtering Header panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Kho hàng Phong Hưng</h2>
            <p className="text-xs text-gray-500">Xem và sửa đổi tồn sản phẩm, trạng thái bán buôn sỉ lẻ.</p>
          </div>
          
          {canEditProducts && (
            <button
              type="button"
              id="open-add-product-btn"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Thêm sản phẩm mới
            </button>
          )}
        </div>

        {/* Inputs panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Smart query */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              id="search-inventory-input"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50/50"
              placeholder="Tìm theo Tên, Mã, Mã vạch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Group select */}
          <select
            id="group-filter"
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="All">--- Tất cả Nhóm hàng ---</option>
            {productGroups.filter(g => g !== 'All').map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Warning state select */}
          <select
            id="status-filter"
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">--- Tất cả Tình trạng kho ---</option>
            <option value="Đủ hàng">🟢 Đủ hàng dồi dào</option>
            <option value="Sắp hết">🟡 Sắp hết (dưới tối thiểu)</option>
            <option value="Hết hàng">🔴 Hết hàng trong kho</option>
            <option value="Âm kho">⚠️ Tồn kho bị âm</option>
            <option value="Ngừng bán">🛑 Hàng ngừng bán</option>
          </select>

        </div>

      </div>

      {/* Main product list details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">Mã SP</th>
                <th className="p-4">Tên sản phẩm</th>
                <th className="p-4">Nhóm hàng</th>
                <th className="p-4 text-right">Giá nhập</th>
                <th className="p-4 text-right">Giá bán</th>
                <th className="p-4 text-center">Tồn đầu</th>
                <th className="p-4 text-center">Tổng nhập</th>
                <th className="p-4 text-center">Tổng bán</th>
                <th className="p-4 text-center">Tồn hiện tại</th>
                <th className="p-4 text-center">ĐVT</th>
                <th className="p-4 text-center">Trạng thái</th>
                {canEditProducts && <th className="p-4 text-center">Sửa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-400">
                    Không tìm thấy sản phẩm nào khớp bộ lọc lựa chọn.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const toMin = row.tonHienTai;
                  const isLow = toMin <= row.tonToiThieu && row.tonHienTai > 0;
                  const isOut = row.tonHienTai === 0;
                  const isNegative = row.tonHienTai < 0;

                  return (
                    <tr 
                      key={row.maSP} 
                      className={`hover:bg-gray-50/50 ${
                        row.trangThai === 'Ngừng bán' ? 'opacity-60 bg-gray-50/20' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-gray-400">{row.maSP}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-gray-800">{row.tenSP}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Barcode: {row.maVach}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {row.nhomHang}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-500 font-mono">{formatVND(row.giaNhap)}</td>
                      <td className="p-4 text-right font-bold text-gray-900 font-mono">{formatVND(row.giaBan)}</td>
                      
                      <td className="p-4 text-center text-gray-500 font-mono">{row.tonDau}</td>
                      <td className="p-4 text-center text-green-600 font-semibold font-mono font-mono">+{row.tongNhap}</td>
                      <td className="p-4 text-center text-indigo-600 font-semibold font-mono">-{row.tongBan}</td>
                      
                      {/* Current Stock with styling */}
                      <td className="p-4 text-center font-bold">
                        <span className={`font-mono px-2 py-0.5 rounded text-xs ${
                          isNegative 
                            ? 'bg-red-200 text-red-900 border border-red-300 animate-pulse' 
                            : isOut 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : isLow 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {row.tonHienTai}
                        </span>
                      </td>

                      <td className="p-4 text-center text-gray-400 font-medium font-sans">
                        {row.dvt}
                      </td>

                      {/* Selling / Quit state */}
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.trangThai === 'Bán' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {row.trangThai}
                        </span>
                      </td>

                      {/* Edit actions */}
                      {canEditProducts && (
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => tempOpenEdit(row)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition cursor-pointer"
                            title="Chỉnh sửa chi tiết"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 1. ADD NEW PRODUCT DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddProductSubmit}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-red-600" />
                Thêm sản phẩm mới vào Kho
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Tên sản phẩm gia dụng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chảo chống dính Sunhouse 30cm"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Nhóm ngành hàng</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  <option value="Điện gia dụng">🔌 Điện gia dụng</option>
                  <option value="Đồ nhựa">🪣 Đồ nhựa Duy Tân</option>
                  <option value="Nhà bếp">🍳 Sành sứ & Nhà bếp</option>
                  <option value="Khác">🏷️ Khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Đơn vị tính (DVT)</label>
                <input
                  type="text"
                  required
                  placeholder="Cái, Bộ, Chiếc..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Giá nhập (đ)</label>
                <input
                  type="number"
                  placeholder="Gốc nhập mua"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Giá bán sỉ & lẻ (đ)</label>
                <input
                  type="number"
                  placeholder="Bán ra ngoài"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold text-red-600"
                  value={sellPrice || ''}
                  onChange={(e) => setSellPrice(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Số lượng tồn ban đầu</label>
                <input
                  type="number"
                  placeholder="Hàng có sẵn hiện nay"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  value={initialQty}
                  onChange={(e) => setInitialQty(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Mức tồn tối thiểu (cảnh báo)</label>
                <input
                  type="number"
                  placeholder="Để phát cảnh báo chuẩn"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  value={minStock}
                  onChange={(e) => setMinStock(Math.max(1, parseInt(e.target.value) || 5))}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Mã vạch Barcode sản phẩm</label>
                <input
                  type="text"
                  placeholder="Nhập mã vạch hoặc bỏ trống tự dựng"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-3 font-sans border-t border-gray-50">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Đóng lại
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Thêm sản phẩm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. EDIT EXISTING PRODUCT DETAIL DIALOG */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleEditProductSubmit}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Chỉnh sửa thông tin hàng hóa
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Mã sản phẩm (Không thể đổi)</label>
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-xs text-gray-500 font-mono"
                  value={editingProduct.maSP}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Nhóm ngành hàng</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                >
                  <option value="Điện gia dụng">Điện gia dụng</option>
                  <option value="Đồ nhựa">Đồ nhựa Duy Tân</option>
                  <option value="Nhà bếp">Sành sứ & Nhà bếp</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Đơn vị tính</label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Giá nhập mặc định (đ)</label>
                <input
                  type="number"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Giá bán đề xuất (đ)</label>
                <input
                  type="number"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono font-bold text-red-600"
                  value={editSellPrice}
                  onChange={(e) => setEditSellPrice(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Mức tối thiểu cảnh báo</label>
                <input
                  type="number"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(Math.max(0, parseInt(e.target.value) || 5))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Trạng thái bán hàng</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-800"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                >
                  <option value="Bán">Đang kinh doanh</option>
                  <option value="Ngừng bán">Ngừng kinh doanh</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Mã vạch Barcode</label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  value={editBarcode}
                  onChange={(e) => setEditBarcode(e.target.value)}
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-3 font-sans border-t border-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Lưu sửa đổi
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
