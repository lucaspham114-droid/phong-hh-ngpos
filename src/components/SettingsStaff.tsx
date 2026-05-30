import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Palette, 
  FolderKey, 
  HelpCircle, 
  Briefcase, 
  Check, 
  Clock, 
  ShieldAlert,
  Plus,
  Search,
  Lock,
  Unlock,
  KeyRound,
  UserPlus,
  Edit2,
  History,
  Shield,
  Activity,
  X,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { SystemSettings, Staff, SecurityLog } from '../types';
import { formatVND } from '../utils';

interface SettingsStaffProps {
  settings: SystemSettings;
  staffs: Staff[];
  activeStaffId: string;
  securityLogs?: SecurityLog[];
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onUpdateStaffs?: (newStaffs: Staff[]) => void;
  onAddSecurityLog?: (action: SecurityLog['action'], description: string, targetUserId?: string) => void;
  onSwitchStaff: (newStaffId: string) => void;
}

export default function SettingsStaff({
  settings,
  staffs,
  activeStaffId,
  securityLogs = [],
  onUpdateSettings,
  onUpdateStaffs,
  onAddSecurityLog,
  onSwitchStaff
}: SettingsStaffProps) {
  // Navigation tabs: 'store' | 'staff' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'staff' | 'logs'>('store');

  // STORE SETTINGS FORM STATE
  const [logoName, setLogoName] = useState(settings.logoName);
  const [softName, setSoftName] = useState(settings.softName);
  const [themeColor, setThemeColor] = useState<SystemSettings['themeColor']>(settings.themeColor);
  const [prefixHD, setPrefixHD] = useState(settings.prefixHD);
  const [prefixPN, setPrefixPN] = useState(settings.prefixPN);
  const [prefixSP, setPrefixSP] = useState(settings.prefixSP);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [logoInitials, setLogoInitials] = useState(settings.logoInitials || 'PH');
  const [systemTitle, setSystemTitle] = useState(settings.systemTitle || 'Hệ Thống Quản Lý Hộ Kinh Doanh');
  const [logoImage, setLogoImage] = useState(settings.logoImage || '');
  const [themeMode, setThemeMode] = useState<SystemSettings['themeMode']>(settings.themeMode || 'light');
  const [useLogoTheme, setUseLogoTheme] = useState<boolean>(settings.useLogoTheme || false);

  // Synchronize local states when settings props change
  useEffect(() => {
    setLogoName(settings.logoName);
    setSoftName(settings.softName);
    setThemeColor(settings.themeColor);
    setPrefixHD(settings.prefixHD);
    setPrefixPN(settings.prefixPN);
    setPrefixSP(settings.prefixSP);
    setShopAddress(settings.shopAddress);
    setShopPhone(settings.shopPhone);
    setLogoInitials(settings.logoInitials || 'PH');
    setSystemTitle(settings.systemTitle || 'Hệ Thống Quản Lý Hộ Kinh Doanh');
    setLogoImage(settings.logoImage || '');
    setThemeMode(settings.themeMode || 'light');
    setUseLogoTheme(settings.useLogoTheme || false);
  }, [settings]);

  const activeStaff = staffs.find(s => s.id === activeStaffId) || staffs[0];
  const isAdmin = activeStaff.vaiTro === 'Admin';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Vui lòng chỉ tải lên các tệp định dạng hình ảnh!");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Vui lòng chỉ tải lên tài liệu hình ảnh!");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      logoName,
      softName,
      themeColor,
      prefixHD,
      prefixPN,
      prefixSP,
      shopAddress,
      shopPhone,
      logoInitials,
      systemTitle,
      logoImage,
      themeMode,
      useLogoTheme
    });
    if (onAddSecurityLog) {
      onAddSecurityLog('UPDATE_SETTINGS', 'Cấu hình lại chế độ giao diện, phối màu sắc và thông số hệ thống');
    }
    alert("Đã lưu các sửa đổi cấu hình hóa đơn & hệ thống thành công!");
  };

  const colors: { id: SystemSettings['themeColor']; bg: string; text: string; code: string }[] = [
    { id: 'red', bg: 'bg-red-600', text: 'Mặc định Phong Hưng (Đỏ)', code: '#dc2626' },
    { id: 'indigo', bg: 'bg-indigo-600', text: 'Kiot Việt nguyên bản (Xanh)', code: '#4f46e5' },
    { id: 'amber', bg: 'bg-amber-500', text: 'Màu Vàng ấm áp', code: '#f59e0b' },
    { id: 'emerald', bg: 'bg-emerald-600', text: 'Màu Xanh lục cát tường', code: '#059669' }
  ];

  // STAFF MANAGEMENT STATE
  const [staffSearch, setStaffSearch] = useState('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // Form states for adding staff
  const [newTenNV, setNewTenNV] = useState('');
  const [newSdt, setNewSdt] = useState('');
  const [newVaiTro, setNewVaiTro] = useState<'Admin' | 'Quản lý' | 'Nhân viên kho' | 'Nhân viên bán hàng'>('Nhân viên bán hàng');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newMustChangePassword, setNewMustChangePassword] = useState(true);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'LOCKED' | 'LEFT'>('ACTIVE');

  // State for selected staff to edit/reset password
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editTenNV, setEditTenNV] = useState('');
  const [editSdt, setEditSdt] = useState('');
  const [editVaiTro, setEditVaiTro] = useState<'Admin' | 'Quản lý' | 'Nhân viên kho' | 'Nhân viên bán hàng'>('Nhân viên bán hàng');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'LOCKED' | 'LEFT'>('ACTIVE');

  // State for resetting password
  const [resetPassVal, setResetPassVal] = useState('');
  const [resetPassConfirmVal, setResetPassConfirmVal] = useState('');
  const [resetMustChange, setResetMustChange] = useState(true);

  // Password visibility
  const [showPass, setShowPass] = useState(false);

  // Filtered staffs based on search
  const filteredStaffs = staffs.filter(s => {
    const q = staffSearch.toLowerCase();
    return s.tenNV.toLowerCase().includes(q) || 
           s.sdt.includes(q) || 
           (s.username || '').toLowerCase().includes(q) ||
           s.id.toLowerCase().includes(q);
  });

  const handleOpenAddStaff = () => {
    if (!isAdmin) {
      alert("Chỉ tài khoản Admin mới được tạo tài khoản nhân viên mới!");
      return;
    }
    setNewTenNV('');
    setNewSdt('');
    setNewVaiTro('Nhân viên bán hàng');
    // Generate intelligent username from full name
    setNewUsername('');
    setNewPassword('123456'); // default easy password
    setNewConfirmPassword('123456');
    setNewMustChangePassword(true);
    setNewStatus('ACTIVE');
    setIsAddStaffOpen(true);
  };

  const submitAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenNV || !newUsername || !newPassword) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
    if (newPassword !== newConfirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Mật khẩu phải có độ dài ít nhất 6 ký tự!");
      return;
    }

    // Check duplicate username
    const usernameExists = staffs.some(s => (s.username || '').toLowerCase() === newUsername.trim().toLowerCase());
    if (usernameExists) {
      alert(`Tên đăng nhập "${newUsername}" đã tồn tại trên hệ thống. Vui lòng chọn tên đăng nhập khác.`);
      return;
    }

    // Auto generate staff ID
    const nextNum = staffs.length + 1;
    const newId = `NV${String(nextNum).padStart(3, '0')}`;

    const newStaff: Staff = {
      id: newId,
      tenNV: newTenNV.trim(),
      sdt: newSdt.trim(),
      vaiTro: newVaiTro,
      active: newStatus === 'ACTIVE',
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      status: newStatus,
      mustChangePassword: newMustChangePassword,
      createdAt: new Date().toISOString(),
      createdBy: activeStaff.id
    };

    if (onUpdateStaffs) {
      onUpdateStaffs([...staffs, newStaff]);
    }
    if (onAddSecurityLog) {
      onAddSecurityLog('CREATE_USER', `Tạo tài khoản nhân viên ${newTenNV} [${newId}] với tên đăng nhập ${newUsername}`, newId);
    }

    alert(`Tạo thành công nhân viên ${newTenNV} với mã số ${newId}!`);
    setIsAddStaffOpen(false);
  };

  const handleOpenEditStaff = (st: Staff) => {
    if (!isAdmin) {
      alert("Chỉ tài khoản Admin mới được sửa đổi thông tin nhân viên!");
      return;
    }
    setSelectedStaff(st);
    setEditTenNV(st.tenNV);
    setEditSdt(st.sdt);
    setEditVaiTro(st.vaiTro);
    setEditStatus(st.status || (st.active ? 'ACTIVE' : 'LOCKED'));
    setIsEditStaffOpen(true);
  };

  const submitEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !editTenNV) return;

    const updatedStaffs = staffs.map(s => {
      if (s.id === selectedStaff.id) {
        return {
          ...s,
          tenNV: editTenNV.trim(),
          sdt: editSdt.trim(),
          vaiTro: editVaiTro,
          active: editStatus === 'ACTIVE',
          status: editStatus
        };
      }
      return s;
    });

    if (onUpdateStaffs) {
      onUpdateStaffs(updatedStaffs);
    }
    if (onAddSecurityLog) {
      onAddSecurityLog(
        editStatus !== selectedStaff.status ? (editStatus === 'LOCKED' ? 'LOCK_USER' : 'UNLOCK_USER') : 'CHANGE_PASSWORD',
        `Cập nhật thông tin nhân viên ${editTenNV} [ID: ${selectedStaff.id}]: Trạng thái ${editStatus}, Vai trò ${editVaiTro}`,
        selectedStaff.id
      );
    }

    alert(`Đã lưu cập nhật nhân viên ${editTenNV} thành công!`);
    setIsEditStaffOpen(false);
  };

  const handleOpenResetPassword = (st: Staff) => {
    if (!isAdmin) {
      alert("Chỉ tài khoản Admin mới có quyền gán/đặt lại mật khẩu nhân viên!");
      return;
    }
    setSelectedStaff(st);
    setResetPassVal('123456'); // Default easy reset
    setResetPassConfirmVal('123456');
    setResetMustChange(true);
    setIsResetPasswordOpen(true);
  };

  const submitResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !resetPassVal) return;

    if (resetPassVal !== resetPassConfirmVal) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    if (resetPassVal.length < 6) {
      alert("Mật khẩu phải có độ dài từ 6 ký tự!");
      return;
    }

    const updatedStaffs = staffs.map(s => {
      if (s.id === selectedStaff.id) {
        return {
          ...s,
          password: resetPassVal,
          mustChangePassword: resetMustChange
        };
      }
      return s;
    });

    if (onUpdateStaffs) {
      onUpdateStaffs(updatedStaffs);
    }
    if (onAddSecurityLog) {
      onAddSecurityLog(
        'RESET_PASSWORD', 
        `Đặt lại mật khẩu cho tài khoản ${selectedStaff.tenNV} (Yêu cầu đổi mật khẩu sau đăng nhập: ${resetMustChange ? 'Bật' : 'Tắt'})`, 
        selectedStaff.id
      );
    }

    alert(`Đặt lại mật khẩu cho nhân viên "${selectedStaff.tenNV}" thành công!`);
    setIsResetPasswordOpen(false);
  };

  const toggleStaffStatusQuick = (st: Staff) => {
    if (!isAdmin) {
      alert("Chỉ tài khoản Admin mới được thay đổi trạng thái hoạt động!");
      return;
    }
    const currentSt = st.status || (st.active ? 'ACTIVE' : 'LOCKED');
    const targetStatus: 'ACTIVE' | 'LOCKED' = currentSt === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

    const updatedStaffs = staffs.map(s => {
      if (s.id === st.id) {
        return {
          ...s,
          active: targetStatus === 'ACTIVE',
          status: targetStatus
        };
      }
      return s;
    });

    if (onUpdateStaffs) {
      onUpdateStaffs(updatedStaffs);
    }
    if (onAddSecurityLog) {
      onAddSecurityLog(
        targetStatus === 'LOCKED' ? 'LOCK_USER' : 'UNLOCK_USER',
        `${targetStatus === 'LOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản nhân viên ${st.tenNV} [ID: ${st.id}]`,
        st.id
      );
    }
  };

  const roleLabels = {
    'Admin': { label: 'Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    'Quản lý': { label: 'Quản lý', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'Nhân viên kho': { label: 'Nhân viên kho', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Nhân viên bán hàng': { label: 'Bán hàng sỉ lẻ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };

  const statusLabels = {
    'ACTIVE': { label: 'Đang làm việc', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    'LOCKED': { label: 'Đang khóa', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    'LEFT': { label: 'Đã nghỉ việc', color: 'text-slate-500 bg-slate-50 border-slate-200' }
  };

  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('vi-VN')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER SECTION WITH MODERN CARD NAVIGATION TABS */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            Thiết lập & Nhân sự Phong Hưng
          </h1>
          <p className="text-[11px] text-slate-500">Cấu hình in ấn, phân hệ vai trò, bảo mật tài khoản.</p>
        </div>

        {/* Tab selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-0.5">
          <button
            onClick={() => setActiveSubTab('store')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition ${
              activeSubTab === 'store' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 inline mr-1" />
            Cài đặt chung
          </button>
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition ${
              activeSubTab === 'staff' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Danh sách nhân viên
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition ${
              activeSubTab === 'logs' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 inline mr-1" />
            Nhật ký bảo mật
          </button>
        </div>
      </div>

      {/* RENDER DYNAMIC SUB-TABS CONTENT */}
      {activeSubTab === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: CONFIG FORM */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSaveSettingsSubmit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Settings className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin Hộ kinh doanh</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Tên thương hiệu doanh nghiệp</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    value={logoName}
                    onChange={(e) => setLogoName(e.target.value)}
                  />
                  <p className="text-[9px] text-slate-400">Hiển thị đầu phiếu in (Ví dụ: PHONG HƯNG)</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Tên hiển thị phần mềm</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    value={softName}
                    onChange={(e) => setSoftName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Số điện thoại hóa đơn</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Địa chỉ hộ kinh doanh</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Kí tự Viết tắt Emblem Logo</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    value={logoInitials}
                    onChange={(e) => setLogoInitials(e.target.value.toUpperCase())}
                  />
                  <p className="text-[9px] text-slate-400">Từ viết tắt hình tròn Header khi không có ảnh (ví dụ: PH)</p>
                </div>

                <div className="col-span-1 sm:col-span-2 border border-dashed border-slate-200 hover:border-slate-350 rounded-xl p-4 bg-slate-50/50 transition">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Ảnh đại diện thương hiệu (Logo thêm từ thiết bị)</span>
                  
                  {logoImage ? (
                    <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                      <img 
                        src={logoImage} 
                        alt="Store Logo" 
                        className="w-14 h-14 object-contain rounded-lg border border-slate-100 bg-slate-50 p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold font-mono">Đã tải lên</span>
                        <p className="text-[9px] text-slate-400">Hình ảnh này sẽ thay thế chữ viết tắt trên Header và màn đăng nhập.</p>
                        <button
                          type="button"
                          onClick={() => setLogoImage('')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-[#E11D48] text-[9px] font-bold rounded-lg transition cursor-pointer select-none"
                        >
                          Xóa ảnh logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 hover:border-rose-500 rounded-xl cursor-default bg-white relative transition hover:bg-rose-50/5"
                    >
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <p className="text-[10px] font-bold text-slate-600">Kéo thả ảnh logo của bạn vào đây</p>
                      <p className="text-[8px] text-slate-400 mb-1.5">Hỗ trợ JPG, PNG dưới 1.5MB</p>
                      <label className="px-3 py-1 bg-[#E11D48] hover:bg-[#BE123C] text-white text-[9px] font-extrabold rounded-lg cursor-pointer shadow transition select-none">
                        Chọn ảnh từ thiết bị
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Dòng tiêu đề phụ hệ thống</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    value={systemTitle}
                    onChange={(e) => setSystemTitle(e.target.value)}
                  />
                </div>

                {/* Automation code prefix customization */}
                <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-4 mt-2 space-y-3">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderKey className="w-3.5 h-3.5" /> Thiết kế mã số tự động
                  </h4>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500">Tiền tố Hóa Đơn</span>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center text-xs focus:border-rose-500 outline-none"
                        value={prefixHD}
                        onChange={(e) => setPrefixHD(e.target.value.toUpperCase())}
                      />
                      <p className="text-[8px] text-slate-400 text-center font-mono">{prefixHD}000001</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500">Tiền tố Phiếu Nhập</span>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center text-xs focus:border-rose-500 outline-none"
                        value={prefixPN}
                        onChange={(e) => setPrefixPN(e.target.value.toUpperCase())}
                      />
                      <p className="text-[8px] text-slate-400 text-center font-mono">{prefixPN}000001</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500">Tiền tố Sản Phẩm</span>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center text-xs focus:border-rose-500 outline-none"
                        value={prefixSP}
                        onChange={(e) => setPrefixSP(e.target.value.toUpperCase())}
                      />
                      <p className="text-[8px] text-slate-400 text-center font-mono">{prefixSP}000001</p>
                    </div>
                  </div>
                </div>

                {/* Color accents / Theme Mode settings */}
                <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-4 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Chế độ giao diện (Sáng / Tối)
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Light Mode */}
                      <div
                        onClick={() => setThemeMode('light')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center select-none ${
                          themeMode === 'light' 
                            ? 'border-rose-600 bg-rose-50/20 text-[#E11D48] font-bold shadow-sm' 
                            : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Sun className={`w-5 h-5 ${themeMode === 'light' ? 'text-[#E11D48]' : 'text-amber-500'}`} />
                        <span className="text-[10px] tracking-wide leading-tight font-semibold">Ban ngày (Sáng)</span>
                      </div>

                      {/* Dark Mode */}
                      <div
                        onClick={() => setThemeMode('dark')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center select-none ${
                          themeMode === 'dark' 
                            ? 'border-rose-600 bg-rose-50/20 text-[#E11D48] font-bold shadow-sm' 
                            : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Moon className={`w-5 h-5 ${themeMode === 'dark' ? 'text-[#E11D48]' : 'text-indigo-400'}`} />
                        <span className="text-[10px] tracking-wide leading-tight font-semibold">Ban đêm (Tối)</span>
                      </div>

                      {/* System Mode */}
                      <div
                        onClick={() => setThemeMode('system')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center select-none ${
                          themeMode === 'system' 
                            ? 'border-rose-600 bg-rose-50/20 text-[#E11D48] font-bold shadow-sm' 
                            : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Monitor className={`w-5 h-5 ${themeMode === 'system' ? 'text-[#E11D48]' : 'text-slate-400'}`} />
                        <span className="text-[10px] tracking-wide leading-tight font-semibold">Theo hệ thống</span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Color coordination */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Phối màu sắc (Tông màu chủ đạo)
                    </h4>

                    {/* Auto color coordinates from logo checkbox */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-white block">
                          Tự động phối màu sắc theo Logo
                        </span>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                          Hệ thống sẽ tự động phân tích Logo đã tải lên ở trên để tự nhận diện gam màu đặc trưng nhất và đồng màu cho toàn bộ giao diện.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={useLogoTheme}
                          onChange={(e) => setUseLogoTheme(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                      </label>
                    </div>

                    {/* Standard presets color pickers if auto logo scheme is disabled */}
                    {!useLogoTheme && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block text-left">Nêu không phối theo Logo, hãy chọn màu sắc có sẵn:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {colors.map((c) => {
                            const active = themeColor === c.id;
                            return (
                              <div
                                key={c.id}
                                onClick={() => setThemeColor(c.id)}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition select-none ${
                                  active 
                                    ? 'border-rose-600 bg-rose-50/20 text-[#E11D48] font-bold' 
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0 shadow-sm border border-black/10`}></span>
                                <span className="text-[10px] truncate">{c.text}</span>
                                {active && <Check className="w-3.5 h-3.5 ml-auto text-rose-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition shadow-sm"
                >
                  Cập nhật thay đổi cấu hình
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT 1 COLUMN: ACTING ROLES SIMULATOR BACKWARD COMPATIBILITY */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mô phỏng Phân quyền</h3>
              </div>

              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wide">Tài khoản đăng nhập hiện tại</span>
                <p className="text-xs font-extrabold text-slate-800">{activeStaff.tenNV}</p>
                <span className="px-2 py-0.5 mt-1 rounded bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-bold font-mono inline-block">
                  Vai Trò: {activeStaff.vaiTro}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Đóng nhanh vai nhân viên để kiểm thử:</p>
                <div className="space-y-1.5">
                  {staffs.map((st) => {
                    const active = st.id === activeStaffId;
                    const stStatus = st.status || 'ACTIVE';
                    const isLocked = stStatus === 'LOCKED';
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          if (isLocked) {
                            alert("Tài khoản này đang bị khóa, hãy kích hoạt hoạt động trước khi đăng nhập!");
                            return;
                          }
                          onSwitchStaff(st.id);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          active 
                            ? 'border-indigo-600 bg-indigo-50/30 font-bold' 
                            : 'border-slate-100 hover:bg-slate-50'
                        } ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                      >
                        <div className="truncate pr-1">
                          <p className="text-slate-800 font-bold truncate text-[11px]">{st.tenNV}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                            {st.username || 'không có'} | {st.vaiTro}
                          </p>
                        </div>
                        {isLocked ? (
                          <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">Khóa</span>
                        ) : active ? (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* STAFF DIRECTORY & ADMINISTRATION TAB */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* List controls */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600 block">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Quản lý tài khoản nhân viên</h3>
                <p className="text-[9px] text-slate-400">Danh sách cấp phát thông tin tài khoản sỉ lẻ sỉ kho.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên..."
                  className="pl-8 pr-3 py-1.5 w-full sm:w-56 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>

              {/* Add Staff Button */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Thêm nhân viên
                </button>
              )}
            </div>
          </div>

          {/* List Staff Table */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3 pl-4">Mã NV</th>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Tên đăng nhập</th>
                  <th className="p-3">Số diện thoại</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-right pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStaffs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-400 font-medium bg-white">
                      Không tìm thấy nhân viên phù hợp với từ khóa!
                    </td>
                  </tr>
                ) : (
                  filteredStaffs.map((st) => {
                    const stStatus = st.status || (st.active ? 'ACTIVE' : 'LOCKED');
                    const badge = roleLabels[st.vaiTro as keyof typeof roleLabels] || { label: st.vaiTro, color: 'bg-slate-50 text-slate-700 border-slate-100' };
                    const statBadge = statusLabels[stStatus as keyof typeof statusLabels] || { label: stStatus, color: 'text-slate-500' };
                    
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-400">{st.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{st.tenNV}</td>
                        <td className="p-3 font-mono text-slate-600 font-bold">{st.username || '—'}</td>
                        <td className="p-3 font-mono text-slate-500">{st.sdt || '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold inline-block ${statBadge.color}`}>
                            {statBadge.label}
                          </span>
                        </td>
                        <td className="p-3 text-right pr-4 space-x-1.5 whitespace-nowrap">
                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(st)}
                                className="p-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                                title="Sửa thông tin"
                              >
                                <Edit2 className="w-2.5 h-2.5" /> Sửa
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenResetPassword(st)}
                                className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                                title="Gán / Đặt lại mật khẩu"
                              >
                                <KeyRound className="w-2.5 h-2.5" /> Mật khẩu
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleStaffStatusQuick(st)}
                                className={`p-1 px-2 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition ${
                                  stStatus === 'ACTIVE'
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150'
                                }`}
                                title={stStatus === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                              >
                                {stStatus === 'ACTIVE' ? (
                                  <>
                                    <Lock className="w-2.5 h-2.5" /> Khóa
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-2.5 h-2.5" /> Mở
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">Không có quyền</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Banner note if not admin */}
          {!isAdmin && (
            <div className="m-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[10px] flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Chỉ tài khoản thuộc quyền <strong>Admin</strong> mới được thay đổi mật khẩu nhân viên, khóa tài khoản hoặc tạo nhân sự mới ở doanh nghiệp.</span>
            </div>
          )}

        </div>
      )}

      {/* SECURITY LOGS TAB */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <History className="w-4 h-4 text-rose-600" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Nhật ký tác vụ bảo mật (Security Logs)</h3>
              <p className="text-[10px] text-slate-400">Ghi nhận lịch sử quản lý nhân viên, đổi mật khẩu và thay đổi cấu hình.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {securityLogs.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-xs font-semibold">
                Chưa ghi nhận tác vụ bảo mật nào trên phiên làm việc này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs max-h-[450px] overflow-y-auto pr-1">
                {securityLogs.map((log) => {
                  const logActions = {
                    'LOGIN': 'Đăng nhập',
                    'LOGOUT': 'Đăng xuất',
                    'CREATE_USER': 'Tạo tài khoản',
                    'CHANGE_PASSWORD': 'Đổi mật khẩu',
                    'RESET_PASSWORD': 'Đặt lại mật khẩu',
                    'LOCK_USER': 'Khóa tài khoản',
                    'UNLOCK_USER': 'Kích hoạt tài khoản',
                    'UPDATE_SETTINGS': 'Cấu hình hệ thống'
                  };

                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (log.action === 'LOGIN') badgeColor = 'bg-emerald-50 text-emerald-800';
                  if (log.action === 'CREATE_USER') badgeColor = 'bg-blue-50 text-blue-800';
                  if (log.action === 'CHANGE_PASSWORD' || log.action === 'RESET_PASSWORD') badgeColor = 'bg-indigo-50 text-indigo-800';
                  if (log.action === 'LOCK_USER') badgeColor = 'bg-rose-50 text-rose-800';

                  return (
                    <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider uppercase ${badgeColor}`}>
                            {logActions[log.action] || log.action}
                          </span>
                          <span className="font-extrabold text-slate-800">{log.userName}</span>
                          <span className="text-slate-400 text-[10px]">({log.userId})</span>
                        </div>
                        <p className="text-slate-600 font-medium text-[11px]">{log.description}</p>
                      </div>
                      <div className="text-right sm:shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1 font-bold">
                          <Clock className="w-3 h-3 text-slate-300" />
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD STAFF DIALOG --- */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-left font-sans modal-animation">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-rose-600" />
                Thêm tài khoản nhân viên mới
              </h3>
              <button 
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-450 hover:text-slate-650 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitAddStaff} className="p-4 space-y-3 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Họ và Tên Nhân Viên <strong className="text-rose-500">*</strong></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Thị Hoa"
                  className="w-full px-3 py-1.5 border border-slate-100 rounded-lg bg-slate-50/50 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  value={newTenNV}
                  onChange={(e) => {
                    setNewTenNV(e.target.value);
                    // Smart generate username
                    if (!newUsername) {
                      const words = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ');
                      if (words.length > 0) {
                        const lastWord = words[words.length - 1];
                        const initials = words.slice(0, words.length - 1).map(w => w.charAt(0)).join('');
                        setNewUsername(lastWord + initials);
                      }
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0988xxxxxx"
                    className="w-full px-3 py-1.5 border border-slate-100 rounded-lg bg-slate-50/50 focus:bg-white focus:border-rose-500 outline-none"
                    value={newSdt}
                    onChange={(e) => setNewSdt(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Vai Trò Hệ Thống</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-100 rounded-lg bg-slate-50/50 focus:bg-white focus:border-rose-500 outline-none font-bold"
                    value={newVaiTro}
                    onChange={(e: any) => setNewVaiTro(e.target.value)}
                  >
                    <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
                    <option value="Nhân viên kho">Nhân viên kho</option>
                    <option value="Quản lý">Quản lý</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* SECURITY / CREDENTIALS SUB-BOX */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Thông tin phiên đăng nhập
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Tên Đăng Nhập <strong className="text-rose-500">*</strong></label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: hoant"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono font-bold lowercase focus:border-rose-500 outline-none"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/\s+/g, ''))}
                  />
                  <p className="text-[9px] text-slate-400">Viết liền không dấu, dùng để đăng nhập Phong Hưng POS</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 relative">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Mật khẩu ban đầu <strong className="text-rose-500">*</strong></label>
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono focus:border-rose-500 outline-none pr-8"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 bottom-2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Nhập lại mật khẩu <strong className="text-rose-500">*</strong></label>
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono focus:border-rose-500 outline-none"
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mustChangeOnNext"
                    className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    checked={newMustChangePassword}
                    onChange={(e) => setNewMustChangePassword(e.target.checked)}
                  />
                  <label htmlFor="mustChangeOnNext" className="text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                    Yêu cầu thay đổi mật khẩu khi đăng nhập lần đầu
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer shadow-sm"
                >
                  Tạo tài khoản
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STAFF DIALOG --- */}
      {isEditStaffOpen && selectedStaff && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-left font-sans modal-animation">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-rose-600" />
                Sửa thông tin nhân sự
              </h3>
              <button 
                onClick={() => setIsEditStaffOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitEditStaff} className="p-4 space-y-3 text-xs">
              
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wide">Đang sửa tài khoản</span>
                <p className="font-mono font-bold text-slate-700">{selectedStaff.id} / Tên: {selectedStaff.username}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Họ và Tên Nhân Viên</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-500 outline-none font-semibold text-slate-800"
                  value={editTenNV}
                  onChange={(e) => setEditTenNV(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Số Điện Thoại</label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-500 outline-none"
                  value={editSdt}
                  onChange={(e) => setEditSdt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Vai Trò Hệ Thống</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-500 outline-none font-bold"
                    value={editVaiTro}
                    onChange={(e: any) => setEditVaiTro(e.target.value)}
                  >
                    <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
                    <option value="Nhân viên kho">Nhân viên kho</option>
                    <option value="Quản lý">Quản lý</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Trạng Thái Làm Việc</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-500 outline-none font-bold"
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE (Đang làm)</option>
                    <option value="LOCKED">LOCKED (Đang khóa)</option>
                    <option value="LEFT">LEFT (Đã nghỉ việc)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setIsEditStaffOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- RESET STAFF PASSWORD DIALOG --- */}
      {isResetPasswordOpen && selectedStaff && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-left font-sans modal-animation">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                Đặt lại mật khẩu nhân viên
              </h3>
              <button 
                onClick={() => setIsResetPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitResetPassword} className="p-4 space-y-3 text-xs">
              
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wide">Nhân viên được gán lại</span>
                <p className="font-semibold text-slate-800">{selectedStaff.tenNV} ({selectedStaff.id})</p>
                <p className="font-mono text-slate-500 font-bold text-[10px]">Tên đăng nhập: {selectedStaff.username}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Mật khẩu mới</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 123456"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none font-mono font-bold"
                  value={resetPassVal}
                  onChange={(e) => setResetPassVal(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Nhập lại mật khẩu mới</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 123456"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none font-mono font-bold"
                  value={resetPassConfirmVal}
                  onChange={(e) => setResetPassConfirmVal(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="resetForceChange"
                  className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  checked={resetMustChange}
                  onChange={(e) => setResetMustChange(e.target.checked)}
                />
                <label htmlFor="resetForceChange" className="text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                  Bắt buộc nhân viên đổi mật khẩu ở lần đăng nhập tiếp theo
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer shadow-sm"
                >
                  Cập nhật mật khẩu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
