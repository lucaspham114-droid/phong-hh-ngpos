export interface Product {
  maSP: string; // SP000001 ...
  tenSP: string;
  nhomHang: string; // "Điện gia dụng", "Đồ nhựa", "Nhà bếp", "Sành sứ", "Khác"
  dvt: string; // "Cái", "Bộ", "Chiếc", "Hộp"
  maVach: string;
  tuKhoa: string; // "noi com dien", "chao chong dinh"...
  giaNhap: number;
  giaBan: number;
  trangThai: 'Bán' | 'Ngừng bán';
  image?: string;
}

export interface InventoryItem {
  maSP: string;
  tenSP: string;
  tonDau: number;
  tongNhap: number;
  tongBan: number;
  tonHienTai: number;
  tonToiThieu: number;
  trangThai: 'Đủ hàng' | 'Sắp hết' | 'Hết hàng' | 'Âm kho';
}

export interface Customer {
  maKH: string; // KH000001 ...
  tenKH: string;
  sdt: string;
  diaChi: string;
  tongTien: number; // Tổng tiền mua
  daTra: number;   // Số tiền đã trả
  conNo: number;   // Số tiền còn nợ
}

export interface Supplier {
  maNCC: string; // NCC000001 ...
  tenNCC: string;
  sdt: string;
  diaChi: string;
  nguoiLienHe: string;
  tongNhap: number; // Tổng tiền nhập
  daTra: number;    // Đã trả nhà cung cấp
  conNo: number;    // Còn nợ nhà cung cấp
}

export interface InvoiceDetail {
  maHD: string;
  maSP: string;
  tenSP: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

export interface Invoice {
  maHD: string; // HD000001 ...
  ngay: string; // ISO String or Date
  maKH: string;
  tenKH: string;
  sdtKH: string;
  tongTien: number;
  giamGia: number;
  daTra: number;
  conNo: number;
  nhanVien: string;
  trangThai: 'Hoàn thành' | 'Đã hủy';
  lyDoHuy?: string;
  nguoiHuy?: string;
  ngayHuy?: string;
  details: InvoiceDetail[];
}

export interface ImportSlipDetail {
  maPN: string;
  maSP: string;
  tenSP: string;
  soLuong: number;
  donGiaNhap: number;
  thanhTien: number;
}

export interface ImportSlip {
  maPN: string; // PN000001 ...
  ngayMoi: string; // ISO string/timestamp
  maNCC: string;
  tenNCC: string;
  sdtNCC: string;
  tongTien: number;
  daTra: number;
  conNo: number;
  nhanVien: string;
  trangThai: 'Hoàn thành' | 'Phiếu tạm' | 'Đã hủy';
  lyDoHuy?: string;
  nguoiHuy?: string;
  ngayHuy?: string;
  details: ImportSlipDetail[];
}

export interface Staff {
  id: string;
  tenNV: string;
  vaiTro: 'Admin' | 'Quản lý' | 'Nhân viên kho' | 'Nhân viên bán hàng';
  sdt: string;
  active: boolean;
  username?: string;
  password?: string;
  mustChangePassword?: boolean;
  status?: 'ACTIVE' | 'LOCKED' | 'LEFT';
  lastLoginAt?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface SystemSettings {
  logoName: string;
  softName: string;
  themeColor: 'red' | 'indigo' | 'amber' | 'emerald';
  prefixHD: string;
  prefixPN: string;
  prefixSP: string;
  shopAddress: string;
  shopPhone: string;
  logoInitials?: string;
  systemTitle?: string;
  logoImage?: string;
  themeMode?: 'light' | 'dark' | 'system';
  useLogoTheme?: boolean;
  brandLogoType?: 'default' | 'flames' | 'chef' | 'shield' | 'crown' | 'inductor' | 'image';
  brandLogoImage?: string; 
  brandLogoShape?: 'circle' | 'squircle' | 'hexagon';
  brandLogoColor?: string; 
  brandLogoGlow?: boolean; 
  brandLogoBorderWidth?: number; 
  showBrandLogo?: boolean; 
}

export interface SecurityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE_USER' | 'CHANGE_PASSWORD' | 'RESET_PASSWORD' | 'LOCK_USER' | 'UNLOCK_USER' | 'UPDATE_SETTINGS';
  targetUserId?: string;
  description: string;
  createdAt: string;
}
