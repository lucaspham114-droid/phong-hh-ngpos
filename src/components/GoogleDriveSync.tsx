import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  RefreshCw, 
  HardDrive, 
  LogOut, 
  ShieldCheck, 
  Grid,
  ExternalLink,
  BookOpen,
  FolderOpen
} from "lucide-react";
import firebaseConfig from "../../firebase-applet-config.json";
import { googleSignIn, logoutGoogle, initAuth, getAccessToken } from "../googleAuth";
import { 
  getOrCreateBackupFolder, 
  uploadToDrive, 
  listFolderFiles, 
  downloadFileContent, 
  deleteDriveFile,
  DriveFile
} from "../googleDrive";
import { createPOSSpreadsheet, updateSheetValues } from "../googleSheets";
import { backupToFirestore, restoreFromFirestore } from "../firebaseSync";
import { 
  Product, 
  InventoryItem, 
  Customer, 
  Supplier, 
  Invoice, 
  ImportSlip, 
  Staff, 
  SystemSettings,
  SecurityLog 
} from "../types";
import { formatVND } from "../utils";

interface GoogleDriveSyncProps {
  products: Product[];
  inventory: InventoryItem[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  importSlips: ImportSlip[];
  staffs: Staff[];
  settings: SystemSettings;
  securityLogs: SecurityLog[];
  currentStaffName: string;
  onRestoreState: (restoredData: {
    products?: Product[];
    inventory?: InventoryItem[];
    customers?: Customer[];
    suppliers?: Supplier[];
    invoices?: Invoice[];
    importSlips?: ImportSlip[];
    staffs?: Staff[];
    settings?: SystemSettings;
    securityLogs?: SecurityLog[];
  }) => void;
  onAddSecurityLog: (action: string, description: string) => void;
}

export default function GoogleDriveSync({
  products,
  inventory,
  customers,
  suppliers,
  invoices,
  importSlips,
  staffs,
  settings,
  securityLogs,
  currentStaffName,
  onRestoreState,
  onAddSecurityLog
}: GoogleDriveSyncProps) {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [backups, setBackups] = useState<DriveFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedSheetUrl, setGeneratedSheetUrl] = useState<string | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Helper to load Google APIs (gapi) and Picker library dynamically
  const loadPickerAPI = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const g = (window as any).google;
      if (g && g.picker) {
        resolve(g);
        return;
      }

      // Loader callback when GAPI script loads
      const loadGapi = () => {
        const gapi = (window as any).gapi;
        if (!gapi) {
          reject(new Error("Không thể khởi tạo nền tảng Google API client (gapi)"));
          return;
        }
        gapi.load("picker", {
          callback: () => {
            resolve((window as any).google);
          },
          onerror: () => {
            reject(new Error("Lỗi khi tải thư viện Google Picker thông qua GAPI"));
          }
        });
      };

      if (!(window as any).gapi) {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.type = "text/javascript";
        script.async = true;
        script.onload = loadGapi;
        script.onerror = () => reject(new Error("Không thể tải mã nguồn gapi.js"));
        document.body.appendChild(script);
      } else {
        loadGapi();
      }
    });
  };

  const handleOpenGooglePicker = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage("Vui lòng kết nối tài khoản Google trước khi sử dụng Google Picker.");
      return;
    }

    setPickerLoading(true);
    setErrorMessage(null);

    try {
      const googleObj = await loadPickerAPI();
      
      const view = new googleObj.picker.DocsView()
        .setMimeTypes("application/json") // Limit to JSON files
        .setSelectFolderEnabled(false);

      const picker = new googleObj.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(firebaseConfig.apiKey)
        .setTitle("Chọn tệp Sao lưu từ Google Drive của bạn (.json)")
        .setCallback(async (data: any) => {
          if (data[googleObj.picker.Response.ACTION] === googleObj.picker.Action.PICKED) {
            const docSelected = data[googleObj.picker.Response.DOCUMENTS][0];
            const fileId = docSelected[googleObj.picker.Document.ID];
            const fileName = docSelected[googleObj.picker.Document.NAME];
            await handleRestorePickedFile(fileId, fileName);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Không thể khởi tạo Google Picker: ${err.message || err}`);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleRestorePickedFile = async (fileId: string, fileName: string) => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage("Chương trình không có Token Google Auth.");
      return;
    }

    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn chuẩn bị nạp bản sao lưu "${fileName}" chọn từ Google Picker.\n` +
      `Thao tác này sẽ GHI ĐÈ toàn bộ cơ sở dữ liệu hiện tại (Sản phẩm, Hóa đơn, Khách hàng, Cài đặt v.v.).\n` +
      `Thao tác này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn tiến hành không?`
    );

    if (!confirmed) return;

    setActionLoading("picker_restoring");
    setErrorMessage(null);

    try {
      const fileDataRaw = await downloadFileContent(token, fileId);
      const data = JSON.parse(fileDataRaw);

      if (!data.payload || !data.meta) {
        throw new Error("Cấu trúc tệp JSON không hợp lệ hoặc không phải bản sao lưu Phong Hung POS chuẩn chỉnh.");
      }

      onRestoreState(data.payload);
      onAddSecurityLog("RESTORE_GOOGLE_PICKER", `Phục hồi cơ sở dữ liệu hệ thống thông qua Google Picker: ${fileName}`);
      
      alert(`Đã phục hồi dữ liệu thành công từ tệp Cloud Backup ngày: ${new Date(data.meta.exportedAt).toLocaleString("vi-VN")}`);
      setSuccessMessage(`Khôi phục hệ thống Phong Hưng hoàn tất thành công từ file: ${fileName}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Không thể khôi phục dữ liệu từ Google Picker: ${err.message || "Tệp sao lưu bị hỏng hoặc sai định dạng JSON"}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-clear messages after 6 seconds
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 10000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // Listen to Google OAuth state changed (Firebase Auth representation)
  useEffect(() => {
    const unsub = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setAccessTokenState(token);
        fetchFolderAndBackups(token);
      },
      () => {
        setGoogleUser(null);
        setAccessTokenState(null);
        setBackups([]);
        setDriveFolderId(null);
      }
    );
    return () => unsub();
  }, []);

  // Fetch drive folder and contents
  const fetchFolderAndBackups = async (token: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const folderId = await getOrCreateBackupFolder(token);
      setDriveFolderId(folderId);
      const files = await listFolderFiles(token, folderId);
      setBackups(files);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Không thể kết nối đến tài khoản Google Drive để lấy danh sách sao lưu. Vui lòng thử đăng nhập lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAccessTokenState(res.accessToken);
        onAddSecurityLog("LIEN_KET_GOOGLE_DRIVE", `Thu ngân ${currentStaffName} kích hoạt kết nối tài khoản Google`);
        await fetchFolderAndBackups(res.accessToken);
        setSuccessMessage("Kết nối Google thành công!");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Quá trình cấp quyền tài khoản Google không thành công.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn ngắt kết nối với tài khoản Google hiện tại không?")) {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessTokenState(null);
      setBackups([]);
      setDriveFolderId(null);
      onAddSecurityLog("NGAT_KET_KET_GOOGLE_DRIVE", `Ngắt liên kết tài khoản Google`);
      setSuccessMessage("Đã ngắt kết nối tài khoản Google thành công.");
    }
  };

  // Create JSON System Backup file in Google Drive
  const handleCreateBackup = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage("Vui lòng đăng nhập Google trước khi thực hiện.");
      return;
    }

    setActionLoading("backup_json");
    setErrorMessage(null);

    try {
      const now = new Date();
      const dateStringForFileName = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      const filename = `phpos_backup_full_${dateStringForFileName}.json`;

      const backupPayload = {
        meta: {
          exporter: currentStaffName,
          exportedAt: now.toISOString(),
          version: "PhongHung_POS_V1",
          itemsCount: {
            products: products.length,
            inventory: inventory.length,
            customers: customers.length,
            suppliers: suppliers.length,
            invoices: invoices.length,
            importSlips: importSlips.length,
            staffs: staffs.length
          }
        },
        payload: {
          products,
          inventory,
          customers,
          suppliers,
          invoices,
          importSlips,
          staffs,
          settings,
          securityLogs
        }
      };

      const folderId = driveFolderId || await getOrCreateBackupFolder(token);
      await uploadToDrive(token, filename, JSON.stringify(backupPayload, null, 2), "application/json", folderId);
      
      onAddSecurityLog("BACKUP_GOOGLE_DRIVE", `Tạo bản sao lưu hệ thống toàn vẹn lên Google Drive: ${filename}`);
      setSuccessMessage(`Đã tạo và đồng bộ tệp sao lưu hệ thống: ${filename} lên Google Drive thành công!`);
      
      // Refresh list
      const files = await listFolderFiles(token, folderId);
      setBackups(files);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi trong quá trình xuất lưu dữ liệu: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Convert array to CSV string
  const compileCSV = (headers: string[], rows: any[][]): string => {
    const cleanCell = (cell: any) => {
      const normalized = cell ? cell.toString().replace(/"/g, '""') : '';
      return normalized.includes(',') || normalized.includes('\n') || normalized.includes('"') 
        ? `"${normalized}"` 
        : normalized;
    };
    const headerLine = headers.map(cleanCell).join(",");
    const dataLines = rows.map(r => r.map(cleanCell).join(",")).join("\n");
    return "\uFEFF" + headerLine + "\n" + dataLines;
  };

  // Export Invoices ledger as Google Drive Spreadsheet (CSV)
  const handleExportInvoicesCSV = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage("Vui lòng kết nối Google trước.");
      return;
    }

    setActionLoading("export_csv_invoices");
    try {
      const headers = [
        "Mã hóa đơn",
        "Ngày lập",
        "Tên khách hàng",
        "SĐT khách",
        "Thu ngân",
        "Tổng tiền hàng (đ)",
        "Giảm giá (đ)",
        "Khách đã trả (đ)",
        "Khách còn nợ (đ)",
        "Trạng thái"
      ];

      const rows = invoices.map(v => [
        v.maHD,
        v.ngay ? new Date(v.ngay).toLocaleString("vi-VN") : "",
        v.tenKH,
        v.sdtKH || "",
        v.nhanVien || "",
        (v.tongTien + (v.giamGia || 0)).toString(),
        (v.giamGia || 0).toString(),
        v.daTra.toString(),
        v.conNo.toString(),
        v.trangThai
      ]);

      const now = new Date();
      const dateString = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      const filename = `phpos_invoices_report_${dateString}.csv`;
      
      const content = compileCSV(headers, rows);
      const folderId = driveFolderId || await getOrCreateBackupFolder(token);
      await uploadToDrive(token, filename, content, "text/csv", folderId);

      onAddSecurityLog("EXPORT_CSV_GOOGLE_DRIVE", `Xuất báo cáo hóa đơn CSV lên Google Drive: ${filename}`);
      setSuccessMessage(`Đã xuất báo cáo hóa đơn ${filename} trực tiếp vào Google Drive!`);
      
      const files = await listFolderFiles(token, folderId);
      setBackups(files);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi xuất báo cáo Invoices: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // EXPORT LIVE DATASETS TO GOOGLE SHEETS
  const handleExportToGoogleSheets = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage("Vui lòng đăng nhập Google trước khi xuất Sheets.");
      return;
    }

    setActionLoading("export_sheets");
    setErrorMessage(null);
    setGeneratedSheetUrl(null);

    try {
      const now = new Date();
      const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
      const title = `Phong Hưng POS - Báo cáo đồng bộ [${dateStr}]`;

      // 1. Create a pristine new spreadsheet with specific sheets
      const { spreadsheetId, spreadsheetUrl } = await createPOSSpreadsheet(token, title);

      // 2. Prepare Hóa Đơn Bán Hàng data
      const invoiceHeaders = [
        "Mã hóa đơn",
        "Ngày lập",
        "Tên khách hàng",
        "SĐT khách",
        "Thu ngân",
        "Tổng thanh toán (đ)",
        "Giảm giá (đ)",
        "Đã thanh toán (đ)",
        "Dư nợ công nợ (đ)",
        "Trạng thái đơn hàng"
      ];
      const invoiceRows = invoices.map(v => [
        v.maHD,
        v.ngay ? new Date(v.ngay).toLocaleString("vi-VN") : "",
        v.tenKH,
        v.sdtKH || "",
        v.nhanVien || "",
        v.tongTien,
        v.giamGia || 0,
        v.daTra,
        v.conNo,
        v.trangThai
      ]);
      const invoiceSheetData = [invoiceHeaders, ...invoiceRows];

      // 3. Prepare Danh Mục Sản Phẩm data
      const productHeaders = [
        "Mã hàng hóa (SKU)",
        "Tên sản phẩm",
        "Nhóm hàng phân loại",
        "Đơn vị tính (DVT)",
        "Mã vạch Barcode",
        "Giá nhập gốc (đ)",
        "Giá niêm yết (đ)",
        "Trạng thái kinh doanh"
      ];
      const productRows = products.map(p => [
        p.maSP,
        p.tenSP,
        p.nhomHang || "Sản phẩm",
        p.dvt || "Cái",
        p.maVach || "",
        p.giaNhap || 0,
        p.giaBan,
        p.trangThai
      ]);
      const productSheetData = [productHeaders, ...productRows];

      // 4. Prepare Nhật Ký Bảo Mật data
      const securityHeaders = [
        "Thời gian ghi nhận",
        "Nhân viên thực hiện",
        "Loại hành động",
        "Nội dung chi tiết hệ thống"
      ];
      const securityRows = securityLogs.map(log => [
        log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "",
        log.userName || "",
        log.action,
        log.description
      ]);
      const securitySheetData = [securityHeaders, ...securityRows];

      // 5. Upload write values asynchronously using sheets range endpoint
      await updateSheetValues(token, spreadsheetId, "Hóa Đơn Bán Hàng!A1", invoiceSheetData);
      await updateSheetValues(token, spreadsheetId, "Danh Mục Sản Phẩm!A1", productSheetData);
      await updateSheetValues(token, spreadsheetId, "Nhật Ký Bảo Mật!A1", securitySheetData);

      onAddSecurityLog("EXPORT_GOOGLE_SHEETS", `Tạo báo cáo Google Sheets đồng bộ đa bảng: ${title}`);
      setGeneratedSheetUrl(spreadsheetUrl);
      setSuccessMessage(`Đã xuất và định dạng bảng tính Google Sheets của bạn thành công!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi xuất Google Sheets: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // SYNC STATE TO FIREBASE FIRESTORE
  const handleBackupToFirestore = async () => {
    if (!googleUser || !googleUser.uid) {
      setErrorMessage("Vui lòng đăng nhập Google để định danh UID sao lưu Firestore.");
      return;
    }

    setActionLoading("firestore_backup");
    setErrorMessage(null);

    try {
      const now = new Date();
      const payload = {
        meta: {
          exporter: currentStaffName,
          exportedAt: now.toISOString(),
          itemsCount: {
            products: products.length,
            inventory: inventory.length,
            customers: customers.length,
            suppliers: suppliers.length,
            invoices: invoices.length,
            importSlips: importSlips.length,
            staffs: staffs.length
          }
        },
        products,
        inventory,
        customers,
        suppliers,
        invoices,
        importSlips,
        staffs,
        settings,
        securityLogs
      };

      await backupToFirestore(googleUser.uid, payload);
      onAddSecurityLog("FIRESTORE_BACKUP", `Đồng bộ trạng thái POS toàn diện lên Firebase Firestore`);
      setSuccessMessage("Đã đồng bộ cơ sở dữ liệu lên đám mây Firebase Firestore thành công!");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Xảy ra sự cố khi đồng bộ Firestore: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // RESTORE STATE FROM FIREBASE FIRESTORE
  const handleRestoreFromFirestore = async () => {
    if (!googleUser || !googleUser.uid) {
      setErrorMessage("Vui lòng đăng nhập Google để định danh dữ liệu.");
      return;
    }

    const confirmed = window.confirm(
      "Bạn chuẩn bị tải trạng thái lưu trữ trên đám mây Firebase Firestore về.\n" +
      "Thao tác này sẽ ghi đè toàn bộ dữ liệu POS cục bộ hiện tại. Thao tác này KHÔNG thể hoàn tác.\n" +
      "Bạn có chắc chắn muốn tiến hành nạp khôi phục không?"
    );

    if (!confirmed) return;

    setActionLoading("firestore_restore");
    setErrorMessage(null);

    try {
      const backup = await restoreFromFirestore(googleUser.uid);
      if (!backup) {
        setErrorMessage("Không tìm thấy bản sao lưu nào lưu trên Firestore của tài khoản này.");
        return;
      }

      onRestoreState(backup);
      onAddSecurityLog("FIRESTORE_RESTORE", `Khôi phục toàn bộ dữ liệu POS từ đám mây Firebase Firestore`);
      setSuccessMessage(`Đã khôi phục dữ liệu từ Firebase Firestore thành công (cập nhật lúc: ${new Date(backup.updatedAt).toLocaleString("vi-VN")})!`);
      alert("Khôi phục toàn bộ hệ thống từ Firebase Firestore thành công!");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Lỗi phục hồi dữ liệu Firestore: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Restore/Import State from downloaded Cloud JSON
  const handleRestoreBackup = async (file: DriveFile) => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setErrorMessage("Chương trình không có Token.");
      return;
    }

    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn chuẩn bị nạp bản sao lưu "${file.name}" tải từ Google Drive.\n` +
      `Thao tác này sẽ GHI ĐÈ toàn bộ cơ sở dữ liệu hiện tại (Sản phẩm, Hóa đơn, Khách hàng, Cài đặt v.v.).\n` +
      `Thao tác này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn tiến hành không?`
    );

    if (!confirmed) return;

    setActionLoading(`restore_${file.id}`);
    setErrorMessage(null);

    try {
      const fileDataRaw = await downloadFileContent(token, file.id);
      const data = JSON.parse(fileDataRaw);

      if (!data.payload || !data.meta) {
        throw new Error("Cấu trúc tệp JSON không hợp lệ hoặc không phải bản sao lưu Phong Hung POS chuẩn chỉnh.");
      }

      onRestoreState(data.payload);
      onAddSecurityLog("RESTORE_GOOGLE_DRIVE", `Phục hồi cơ sở dữ liệu hệ thống từ tệp Google Drive: ${file.name}`);
      
      alert(`Đã phục hồi dữ liệu thành công từ tệp Cloud Backup ngày: ${new Date(data.meta.exportedAt).toLocaleString("vi-VN")}`);
      setSuccessMessage(`Khôi phục hệ thống Phong Hưng hoàn tất thành công từ file: ${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Không thể khôi phục dữ liệu: ${err.message || "Tệp sao lưu bị hỏng hoặc sai định dạng JSON"}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete specific file inside Google Drive
  const handleDeleteBackupFile = async (file: DriveFile) => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;

    const confirmed = window.confirm(
      `XÓA FILE CLOUD: Bạn có chắc chắn muốn xóa vĩnh viễn tệp "${file.name}" khỏi tài khoản Google Drive của mình không?`
    );

    if (!confirmed) return;

    setActionLoading(`delete_${file.id}`);
    setErrorMessage(null);

    try {
      await deleteDriveFile(token, file.id);
      onAddSecurityLog("DELETE_CLOUD_BACKUP", `Xóa tệp cấu hình sao lưu đám mây: ${file.name}`);
      setSuccessMessage(`Đã xóa tệp đám mây thành công: ${file.name}`);
      
      // Update local listing
      setBackups(prev => prev.filter(b => b.id !== file.id));
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Không thể xóa tệp: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualSyncList = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;
    await fetchFolderAndBackups(token);
    setSuccessMessage("Đã làm mới danh mục tệp đám mây.");
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 select-none font-sans" id="google-drive-sync-panel">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
            <Cloud className="w-6 h-6 text-[#E11D48] animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5 leading-tight">
              Trung tâm lưu trữ đám mây & Báo cáo POS
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 font-medium font-sans">
              Sao lưu đồng hành cùng nền tảng đám mây Firebase Firestore, xuất báo cáo nhiều tab Google Sheets, và khôi phục dữ liệu từ tệp tin Google Drive.
            </p>
          </div>
        </div>

        {/* GOOGLE CONNECTOR TRIGGER BUTTON */}
        <div className="shrink-0 flex items-center">
          {googleUser ? (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/60 p-2 pl-3 pr-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
              {googleUser.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-xs" 
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-105 flex items-center justify-center font-bold text-xs text-blue-600 border">
                  G
                </div>
              )}
              <div className="text-left leading-normal max-w-40">
                <span className="text-[10px] text-[#E11D48] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-ping"></span> ĐÃ KẾT NỐI
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-204 truncate" title={googleUser.email}>
                  {googleUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="p-1 px-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-bold rounded-lg text-[10.5px] tracking-wide transition ml-2 cursor-pointer border border-red-250/20 shadow-xs flex items-center gap-1"
                title="Ngắt kết nối tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="px-4 py-2.5 bg-[#E11D48] hover:bg-rose-700 text-white font-extrabold text-xs shadow-md border border-rose-500 hover:scale-[1.02] active:scale-95 duration-100 tracking-wide cursor-pointer transition select-none flex items-center gap-2 rounded-xl"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>NHẤN ĐỂ KẾT NỐI TÀI KHOẢN GOOGLE</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK STATUS CARDS */}
      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-xl flex items-start gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-355">Thao tác thành công</h4>
            <p className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {generatedSheetUrl && (
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-blue-850 dark:text-blue-300">ĐÃ TẠO THÀNH CÔNG BẢNG TÍNH GOOGLE SHEETS!</h4>
              <p className="text-[11px] text-blue-650 dark:text-blue-400 mt-0.5 font-medium">Bạn có thể chỉnh sửa, mở trực tuyến, chia sẻ cho đồng nghiệp hoặc phân tích kết quả.</p>
            </div>
          </div>
          <a
            href={generatedSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3.5 py-1.8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg shadow-sm flex items-center gap-1.5 transition ml-8 sm:ml-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>MỞ BÁO CÁO GOOGLE SHEETS</span>
          </a>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-800 dark:text-rose-355">Phát hiện sự cố</h4>
            <p className="text-rose-600 dark:text-rose-400 mt-0.5 font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* THREE ACTION BENTO PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* PANEL 1: SYSTEM FIRESTORE SYNCHRONIZATION */}
        <div className="bg-white dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
                <Database className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-250">Đồng bộ Firebase Firestore</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed min-h-12">
              Lưu trữ bản sao dữ liệu an toàn lên đám mây Firebase Firestore dán nhãn theo tài khoản Google đăng nhập của bạn. Thuận tiện truyền dữ liệu liên thiết bị.
            </p>
            <div className="mt-3.5 space-y-1.5 font-sans text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span>Trạng thái máy chủ:</span>
                <span className="text-emerald-500 font-extrabold flex items-center gap-1">● ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>Dữ liệu nén cục bộ:</span>
                <strong className="text-slate-705 dark:text-slate-300 font-semibold font-mono">OK</strong>
              </div>
            </div>
          </div>
          
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleBackupToFirestore}
              disabled={!googleUser || actionLoading !== null}
              className={`py-2 px-1 flex items-center justify-center gap-1 font-extrabold text-[11px] rounded-xl border transition cursor-pointer select-none ${
                !googleUser 
                  ? "bg-slate-100 hover:bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-600 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {actionLoading === "firestore_backup" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>GỬI LÊN CLOUD</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreFromFirestore}
              disabled={!googleUser || actionLoading !== null}
              className={`py-2 px-1 flex items-center justify-center gap-1 font-extrabold text-[11px] rounded-xl border transition cursor-pointer select-none ${
                !googleUser 
                  ? "bg-slate-100 hover:bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-600 cursor-not-allowed" 
                  : "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {actionLoading === "firestore_restore" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5" />
              )}
              <span>KHÔI PHỤC</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: EXPORT LIVE WORKBOOK TO GOOGLE SHEETS */}
        <div className="bg-white dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-55/10 flex items-center justify-center text-emerald-600">
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-500" />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-250">Đồng bộ Google Sheets</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed min-h-12">
              Phân tích và kết xuất đồng bộ trực tiếp đa bảng tính: hóa đơn bán hàng, danh mục hàng hóa niêm yết, và logs bảo mật thành 1 tệp Excel Sheets chuyên nghiệp.
            </p>
            <div className="mt-3.5 space-y-1.5 font-sans text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span>Số lượng Sheet xuất:</span>
                <strong className="text-slate-705 dark:text-slate-250 font-bold font-mono">3 Sheets (Tabs)</strong>
              </div>
              <div className="flex justify-between">
                <span>Hỗ trợ Unicode:</span>
                <strong className="text-slate-705 dark:text-slate-250 font-semibold font-mono">Tiếng Việt 100%</strong>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleExportToGoogleSheets}
            disabled={!googleUser || actionLoading !== null}
            className={`w-full mt-5 py-2 px-3 flex items-center justify-center gap-1.5 font-extrabold text-xs rounded-xl border tracking-wide transition cursor-pointer select-none ${
              !googleUser 
                ? "bg-slate-100 hover:bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-600 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {actionLoading === "export_sheets" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>ĐANG KHỞI TẠO BẢNG TÍNH...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>XUẤT SANG GOOGLE SHEETS</span>
              </>
            )}
          </button>
        </div>

        {/* PANEL 3: GOOGLE DRIVE BACKUPS FILE STORE */}
        <div className="bg-white dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-955/30 flex items-center justify-center text-[#E11D48]">
                <Grid className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-250">File Sao Lưu Google Drive</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed min-h-12">
              Tạo bản sao lưu nén định dạng JSON hoặc tệp dữ liệu hóa đơn phẳng dạng CSV trực tiếp lưu trữ vào phân mục bảo mật Google Drive cá nhân.
            </p>
            <div className="mt-3.5 space-y-1.5 font-sans text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span>Số tệp đang lưu trữ:</span>
                <strong className="text-slate-705 dark:text-slate-250 font-mono font-bold">{backups.length} tệp</strong>
              </div>
              <div className="flex justify-between">
                <span>Phân mục thư mục:</span>
                <strong className="text-slate-705 dark:text-slate-250 font-medium truncate">/PhongHungPOS_Backups</strong>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={!googleUser || actionLoading !== null}
              className={`flex-1 py-2 px-1 flex items-center justify-center gap-1 font-extrabold text-[11px] rounded-xl border transition cursor-pointer select-none ${
                !googleUser 
                  ? "bg-slate-100 hover:bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-600 cursor-not-allowed" 
                  : "bg-rose-600 hover:bg-rose-700 border-rose-500 text-white hover:scale-[1.01] active:scale-[0.99]"
              }`}
              title="Xuất file JSON toàn hệ thống lên Google Drive"
            >
              {actionLoading === "backup_json" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>TẠO FILE REPO</span>
            </button>

            <button
              type="button"
              onClick={handleExportInvoicesCSV}
              disabled={!googleUser || actionLoading !== null}
              className={`px-3 py-2 flex items-center justify-center font-bold text-xs rounded-xl border transition cursor-pointer select-none ${
                !googleUser 
                  ? "bg-slate-105 hover:bg-slate-100 border-slate-200 text-slate-450 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-600 cursor-not-allowed" 
                  : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              }`}
              title="Xuất nhanh báo cáo hóa đơn dạng CSV phẳng lên Google Drive"
            >
              {actionLoading === "export_csv_invoices" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              )}
            </button>
          </div>
        </div>

      </div>

      {/* CLOUD BROWSER: PREVIOUS BACKUPS (RESTORE CENTER) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/20 overflow-hidden shadow-xs">
        
        {/* Section title & controls */}
        <div className="p-4 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-105 uppercase tracking-wide">
              Bộ lưu trữ Google Drive phân mục Phong Hưng POS
            </h3>
          </div>
          
          {googleUser && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenGooglePicker}
                disabled={pickerLoading || actionLoading !== null}
                className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-lg text-[10.5px] font-black tracking-tight transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {pickerLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-200" />
                )}
                MỞ GOOGLE PICKER CLOUD
              </button>

              <button
                type="button"
                onClick={handleManualSyncList}
                disabled={loading}
                className="p-1 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-55 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-bold tracking-tight transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                LÀM MỚI DANH SÁCH DRIVE
              </button>
            </div>
          )}
        </div>

        {/* Backups file explorer */}
        <div className="p-4">
          {!googleUser ? (
            <div className="text-center py-10 select-none">
              <Cloud className="w-12 h-12 mx-auto text-slate-300/80 mb-2.5" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">Chưa kích hoạt liên kết lưu trữ</h4>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Kết nối tài khoản Google của bạn để quản lý các tệp sao lưu hệ thống toàn vẹn, xuất các spreadsheet Google Sheets và lưu chuyển trạng thái POS an toàn.
              </p>
            </div>
          ) : loading && backups.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-3" />
              <p className="text-xs text-slate-505 font-medium font-sans">Đang truy xuất thông số tệp tin từ Google Drive API...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-10">
              <HardDrive className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-600 mb-2.5" />
              <h4 className="font-bold text-slate-750 dark:text-slate-355 text-xs">Thư mục sao lưu trống</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Vui lòng nhấp nút "Tạo file Repo" hoặc các hành động xuất dữ liệu ở trên để tiến hành đồng bộ.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 font-sans border-collapse divide-y divide-slate-100 dark:divide-slate-800">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-850/10">
                    <th className="py-2.5 px-3">Loại tệp</th>
                    <th className="py-2.5 px-3">Tên file sao lưu</th>
                    <th className="py-2.5 px-3">Kích thước</th>
                    <th className="py-2.5 px-3">Ngày lưu trữ</th>
                    <th className="py-2.5 px-3 text-right">Thao tác an toàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backups.map((file) => {
                    const isJson = file.mimeType === "application/json";
                    const isCsv = file.mimeType === "text/csv";
                    const sizeNum = file.size ? parseInt(file.size) : 0;
                    const formatSize = sizeNum > 1024 ? `${(sizeNum / 1024).toFixed(1)} KB` : `${sizeNum} B`;

                    return (
                      <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition duration-150">
                        <td className="py-3 px-3">
                          {isJson ? (
                            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-705 dark:text-indigo-400 px-2 py-0.8 rounded-md font-mono font-bold text-[9.5px] uppercase">
                              JSON Backup
                            </span>
                          ) : isCsv ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-705 dark:text-emerald-400 px-2 py-0.8 rounded-md font-mono font-bold text-[9.5px] uppercase">
                              Excel Report
                            </span>
                          ) : (
                            <span className="bg-slate-105 dark:bg-slate-800 text-slate-600 px-2 py-0.8 rounded-md font-mono font-bold text-[9.5px] uppercase">
                              DATA
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs font-bold text-slate-803 dark:text-slate-200 select-all">
                          {file.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{formatSize}</td>
                        <td className="py-3 px-3 text-slate-505 dark:text-slate-450 font-medium">
                          {file.createdTime ? new Date(file.createdTime).toLocaleString("vi-VN") : "N/A"}
                        </td>
                        <td className="py-3 px-3 text-right flex items-center justify-end gap-1.5 h-full">
                          
                          {/* JSON Restoring Trigger */}
                          {isJson && (
                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(file)}
                              disabled={actionLoading !== null}
                              className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-[10.5px] rounded-lg tracking-wide transition cursor-pointer flex items-center gap-1 hover:scale-[1.02]"
                              title="Tải về và Import đè hoàn toàn trạng thái cơ sở dữ liệu hiện hành"
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                              <span>NẠP PHỤC HỒI</span>
                            </button>
                          )}

                          {isCsv && (
                            <a
                              href={`https://drive.google.com/open?id=${file.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-550 hover:bg-emerald-600 text-white font-extrabold text-[10.5px] rounded-lg transition tracking-wide flex items-center gap-1"
                              title="Mở tài liệu Excel trực tiếp trên tài khoản Google Drive cá nhân của bạn"
                            >
                              MỞ TRÊN GDRIVE
                            </a>
                          )}

                          {/* Permanently delete from Google Drive */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBackupFile(file)}
                            disabled={actionLoading !== null}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-750 dark:bg-red-955/20 dark:hover:bg-red-955/50 rounded-lg transition"
                            title="Xóa vĩnh viễn tệp này trên Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER AUDITING INFORMATION NOTE */}
      <div className="mt-6 flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 font-sans border-t border-slate-100 dark:border-slate-800 pt-4 px-1.5 leading-normal">
        <span className="flex items-center gap-1.5 font-bold text-slate-450">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          HỆ THỐNG GIAO DIỆN BẢO MẬT PHONG HƯNG POS CLOUD — TOÀN BỘ PHƯƠNG THỨC LIÊN KẾT ĐỀU SỬ DỤNG CHỮ KÝ SHA256 AN TOÀN API GOOGLE
        </span>
        <span className="hidden sm:inline-block">Cung cấp quyền truy cập sheets & drive với sự chấp thuận của người dùng.</span>
      </div>

    </div>
  );
}
