import { Product, InventoryItem, Customer, Supplier, Invoice, ImportSlip, Staff, SystemSettings } from './types';

export const initialProducts: Product[] = [
  {
    maSP: 'SP000001',
    tenSP: 'Chảo chống dính Sunhouse 24cm',
    nhomHang: 'Nhà bếp',
    dvt: 'Cái',
    maVach: '8936001230012',
    tuKhoa: 'chao chong dinh sunhouse 24cm ccd sh24',
    giaNhap: 80000,
    giaBan: 150000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000002',
    tenSP: 'Nồi cơm điện Cuckoo 1.8L',
    nhomHang: 'Điện gia dụng',
    dvt: 'Cái',
    maVach: '8801123456789',
    tuKhoa: 'noi com dien cuckoo 1.8l ncd ck18',
    giaNhap: 850000,
    giaBan: 1250000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000003',
    tenSP: 'Ấm siêu tốc Philips 1.5L',
    nhomHang: 'Điện gia dụng',
    dvt: 'Cái',
    maVach: '8710103890223',
    tuKhoa: 'am sieu toc philips 1.5l ast pl15',
    giaNhap: 220000,
    giaBan: 390000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000004',
    tenSP: 'Bộ lau nhà thông minh Duy Tân',
    nhomHang: 'Đồ nhựa',
    dvt: 'Bộ',
    maVach: '8935002401222',
    tuKhoa: 'bo lau nha thong minh duy tan bln dt',
    giaNhap: 180000,
    giaBan: 280000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000005',
    tenSP: 'Bộ 6 bát cơm sứ Minh Long',
    nhomHang: 'Sành sứ',
    dvt: 'Hộp',
    maVach: '8936005556667',
    tuKhoa: 'bo 6 bat com su minh long bc ml',
    giaNhap: 120000,
    giaBan: 220000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000006',
    tenSP: 'Thùng rác đạp chân Duy Tân cỡ trung',
    nhomHang: 'Đồ nhựa',
    dvt: 'Cái',
    maVach: '8935002401888',
    tuKhoa: 'thung rac dap chan duy tan co trung tr dt',
    giaNhap: 70000,
    giaBan: 110000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000007',
    tenSP: 'Bếp từ hồng ngoại Sunhouse 2000W',
    nhomHang: 'Điện gia dụng',
    dvt: 'Cái',
    maVach: '8936001230055',
    tuKhoa: 'bep tu hong ngoai sunhouse bt2000',
    giaNhap: 650000,
    giaBan: 950000,
    trangThai: 'Bán'
  },
  {
    maSP: 'SP000008',
    tenSP: 'Bộ hộp nhựa đựng thức ăn Song Long (3 hộp)',
    nhomHang: 'Đồ nhựa',
    dvt: 'Bộ',
    maVach: '8935003334441',
    tuKhoa: 'bo hop nhua dung thuc an song long bhn sl',
    giaNhap: 350000,
    giaBan: 50000,
    trangThai: 'Ngừng bán'
  }
];

export const initialCustomers: Customer[] = [
  {
    maKH: 'KH000001',
    tenKH: 'Anh Hoàng - Ba Đình',
    sdt: '0912345678',
    diaChi: '12 Kim Mã, Ba Đình, Hà Nội',
    tongTien: 1640000,
    daTra: 1400000,
    conNo: 240000
  },
  {
    maKH: 'KH000002',
    tenKH: 'Chị Mai - Đống Đa',
    sdt: '0987654321',
    diaChi: '88 Chùa Bộc, Đống Đa, Hà Nội',
    tongTien: 220000,
    daTra: 220000,
    conNo: 0
  },
  {
    maKH: 'KH000003',
    tenKH: 'Bác Hùng - Cầu Giấy',
    sdt: '0904112233',
    diaChi: '215 Trần Quốc Hoàn, Cầu Giấy, Hà Nội',
    tongTien: 2500000,
    daTra: 1500000,
    conNo: 1000000
  },
  {
    maKH: 'KH000004',
    tenKH: 'Khách vãng lai',
    sdt: '0999999999',
    diaChi: 'Tại cửa hàng',
    tongTien: 670000,
    daTra: 670000,
    conNo: 0
  }
];

export const initialSuppliers: Supplier[] = [
  {
    maNCC: 'NCC000001',
    tenNCC: 'Công ty Cổ phần Sunhouse Việt Nam',
    sdt: '02437333999',
    diaChi: 'KCN Ngọc Liệp, Quốc Oai, Hà Nội',
    nguoiLienHe: 'Chị Hòa - TP Kinh doanh',
    tongNhap: 15400000,
    daTra: 13000000,
    conNo: 2400000
  },
  {
    maNCC: 'NCC000002',
    tenNCC: 'Tổng kho gia dụng Song Long - Duy Tân',
    sdt: '0945999888',
    diaChi: 'Cụm CN Thanh Oai, Thanh Oai, Hà Nội',
    nguoiLienHe: 'Anh Long',
    tongNhap: 8200000,
    daTra: 8200000,
    conNo: 0
  },
  {
    maNCC: 'NCC000003',
    tenNCC: 'Nhà phân phối sành sứ Minh Long Miền Bắc',
    sdt: '02437150150',
    diaChi: '236 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    nguoiLienHe: 'Chị Thủy',
    tongNhap: 4500000,
    daTra: 3500000,
    conNo: 1000000
  }
];

export const initialInvoices: Invoice[] = [
  {
    maHD: 'HD000001',
    ngay: '2026-05-29T10:30:00Z',
    maKH: 'KH000001',
    tenKH: 'Anh Hoàng - Ba Đình',
    sdtKH: '0912345678',
    tongTien: 1640000,
    giamGia: 0,
    daTra: 1400000,
    conNo: 240000,
    nhanVien: 'Nguyễn Văn Admin',
    trangThai: 'Hoàn thành',
    details: [
      {
        maHD: 'HD000001',
        maSP: 'SP000002',
        tenSP: 'Nồi cơm điện Cuckoo 1.8L',
        soLuong: 1,
        donGia: 1250000,
        thanhTien: 1250000
      },
      {
        maHD: 'HD000001',
        maSP: 'SP000003',
        tenSP: 'Ấm siêu tốc Philips 1.5L',
        soLuong: 1,
        donGia: 390000,
        thanhTien: 390000
      }
    ]
  },
  {
    maHD: 'HD000002',
    ngay: '2026-05-29T14:15:00Z',
    maKH: 'KH000002',
    tenKH: 'Chị Mai - Đống Đa',
    sdtKH: '0987654321',
    tongTien: 220000,
    giamGia: 0,
    daTra: 220000,
    conNo: 0,
    nhanVien: 'Trần Thị Thu Quản Lý',
    trangThai: 'Hoàn thành',
    details: [
      {
        maHD: 'HD000002',
        maSP: 'SP000005',
        tenSP: 'Bộ 6 bát cơm sứ Minh Long',
        soLuong: 1,
        donGia: 220000,
        thanhTien: 220000
      }
    ]
  },
  {
    maHD: 'HD000003',
    ngay: '2026-05-30T02:00:00Z',
    maKH: 'KH000003',
    tenKH: 'Bác Hùng - Cầu Giấy',
    sdtKH: '0904112233',
    tongTien: 2500000,
    giamGia: 0,
    daTra: 1500000,
    conNo: 1000000,
    nhanVien: 'Nguyễn Văn Admin',
    trangThai: 'Hoàn thành',
    details: [
      {
        maHD: 'HD000003',
        maSP: 'SP000002',
        tenSP: 'Nồi cơm điện Cuckoo 1.8L',
        soLuong: 2,
        donGia: 1250000,
        thanhTien: 2500000
      }
    ]
  }
];

export const initialImportSlips: ImportSlip[] = [
  {
    maPN: 'PN000001',
    ngayMoi: '2026-05-28T09:00:00Z',
    maNCC: 'NCC000001',
    tenNCC: 'Công ty Cổ phần Sunhouse Việt Nam',
    sdtNCC: '02437333999',
    tongTien: 5400000,
    daTra: 4000000,
    conNo: 1400000,
    nhanVien: 'Lê Văn Kho',
    trangThai: 'Hoàn thành',
    details: [
      {
        maPN: 'PN000001',
        maSP: 'SP000001',
        tenSP: 'Chảo chống dính Sunhouse 24cm',
        soLuong: 30,
        donGiaNhap: 80000,
        thanhTien: 2400000
      },
      {
        maPN: 'PN000001',
        maSP: 'SP000007',
        tenSP: 'Bếp từ hồng ngoại Sunhouse 2000W',
        soLuong: 5,
        donGiaNhap: 650000,
        thanhTien: 3250000
      }
    ]
  },
  {
    maPN: 'PN000002',
    ngayMoi: '2026-05-28T15:30:00Z',
    maNCC: 'NCC000002',
    tenNCC: 'Tổng kho gia dụng Song Long - Duy Tân',
    sdtNCC: '0945999888',
    tongTien: 3600000,
    daTra: 3600000,
    conNo: 0,
    nhanVien: 'Lê Văn Kho',
    trangThai: 'Hoàn thành',
    details: [
      {
        maPN: 'PN000002',
        maSP: 'SP000004',
        tenSP: 'Bộ lau nhà thông minh Duy Tân',
        soLuong: 20,
        donGiaNhap: 180000,
        thanhTien: 3600000
      }
    ]
  }
];

export const initialStaffs: Staff[] = [
  {
    id: 'NV001',
    tenNV: 'Nguyễn Văn Admin',
    vaiTro: 'Admin',
    sdt: '0988111222',
    active: true,
    username: 'admin',
    password: '123456',
    mustChangePassword: false,
    status: 'ACTIVE',
    createdAt: '2026-05-25T08:00:00Z',
    createdBy: 'Hệ thống'
  },
  {
    id: 'NV002',
    tenNV: 'Trần Thị Thu Quản Lý',
    vaiTro: 'Quản lý',
    sdt: '0977222333',
    active: true,
    username: 'quanly',
    password: '123456',
    mustChangePassword: true,
    status: 'ACTIVE',
    createdAt: '2026-05-25T09:00:00Z',
    createdBy: 'NV001'
  },
  {
    id: 'NV003',
    tenNV: 'Lê Văn Kho',
    vaiTro: 'Nhân viên kho',
    sdt: '0966333444',
    active: true,
    username: 'kho',
    password: '123456',
    mustChangePassword: true,
    status: 'ACTIVE',
    createdAt: '2026-05-25T10:00:00Z',
    createdBy: 'NV001'
  }
];

export const initialSettings: SystemSettings = {
  logoName: 'PHONG HƯNG',
  softName: 'Phong Hưng POS',
  themeColor: 'red', // 'red' , 'indigo', 'amber', 'emerald' -> Red fits the custom note style ("Thanh tiêu điểm: Đỏ, Bán nút Chính: Đỏ...")
  prefixHD: 'HD',
  prefixPN: 'PN',
  prefixSP: 'SP',
  shopAddress: 'Số 15 Cầu Diễn, Bắc Từ Liêm, Hà Nội',
  shopPhone: '0912.345.678',
  logoInitials: 'PH',
  systemTitle: 'Hệ Thống Quản Lý Hộ Kinh Doanh',
  themeMode: 'light',
  showBrandLogo: false
};

export const initialInventory: InventoryItem[] = [
  {
    maSP: 'SP000001',
    tenSP: 'Chảo chống dính Sunhouse 24cm',
    tonDau: 10,
    tongNhap: 30, // From PN000001
    tongBan: 0,
    tonHienTai: 40,
    tonToiThieu: 10,
    trangThai: 'Đủ hàng'
  },
  {
    maSP: 'SP000002',
    tenSP: 'Nồi cơm điện Cuckoo 1.8L',
    tonDau: 10,
    tongNhap: 0,
    tongBan: 3, // From HD000001 (1) & HD000003 (2)
    tonHienTai: 7,
    tonToiThieu: 5,
    trangThai: 'Đủ hàng'
  },
  {
    maSP: 'SP000003',
    tenSP: 'Ấm siêu tốc Philips 1.5L',
    tonDau: 15,
    tongNhap: 0,
    tongBan: 1, // From HD000001
    tonHienTai: 14,
    tonToiThieu: 8,
    trangThai: 'Đủ hàng'
  },
  {
    maSP: 'SP000004',
    tenSP: 'Bộ lau nhà thông minh Duy Tân',
    tonDau: 5,
    tongNhap: 20, // From PN000002
    tongBan: 0,
    tonHienTai: 25,
    tonToiThieu: 5,
    trangThai: 'Đủ hàng'
  },
  {
    maSP: 'SP000005',
    tenSP: 'Bộ 6 bát cơm sứ Minh Long',
    tonDau: 5,
    tongNhap: 0,
    tongBan: 1, // From HD000002
    tonHienTai: 4,
    tonToiThieu: 6,
    trangThai: 'Sắp hết'
  },
  {
    maSP: 'SP000006',
    tenSP: 'Thùng rác đạp chân Duy Tân cỡ trung',
    tonDau: 2,
    tongNhap: 0,
    tongBan: 0,
    tonHienTai: 2,
    tonToiThieu: 5,
    trangThai: 'Sắp hết'
  },
  {
    maSP: 'SP000007',
    tenSP: 'Bếp từ hồng ngoại Sunhouse 2000W',
    tonDau: 2,
    tongNhap: 5, // From PN000001
    tongBan: 0,
    tonHienTai: 7,
    tonToiThieu: 3,
    trangThai: 'Đủ hàng'
  },
  {
    maSP: 'SP000008',
    tenSP: 'Bộ hộp nhựa đựng thức ăn Song Long (3 hộp)',
    tonDau: 0,
    tongNhap: 0,
    tongBan: 0,
    tonHienTai: 0,
    tonToiThieu: 5,
    trangThai: 'Hết hàng'
  }
];
