import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Settings, Check, CreditCard, RefreshCw, Smartphone, MapPin, MessageSquare, Heart } from 'lucide-react';
import { Invoice, ImportSlip, SystemSettings, Product, Customer } from '../types';
import { formatVND, formatDate } from '../utils';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice;
  importSlip?: ImportSlip;
  settings: SystemSettings;
  products?: Product[];
  customers?: Customer[];
  selectedTemplate: 'a5_01' | 'a5_02' | 'k58_01' | 'k58_02' | 'k80_01' | 'a5_kiotviet';
  onUpdateTemplate: (template: 'a5_01' | 'a5_02' | 'k58_01' | 'k58_02' | 'k80_01' | 'a5_kiotviet') => void;
  isDraft?: boolean;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

function docSoTienVND(prefixNumber: number): string {
  if (prefixNumber === 0) return "Không đồng chẵn";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const sections = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];

  let res = "";
  let numStr = Math.floor(prefixNumber).toString();
  
  while (numStr.length % 3 !== 0) {
    numStr = "0" + numStr;
  }

  const chunks: string[] = [];
  for (let i = 0; i < numStr.length; i += 3) {
    chunks.push(numStr.substr(i, 3));
  }

  const readChunk = (chunk: string, isFirst: boolean): string => {
    let aStr = "";
    const tram = parseInt(chunk[0]);
    const chuc = parseInt(chunk[1]);
    const donVi = parseInt(chunk[2]);

    if (!isFirst || tram > 0) {
      aStr += units[tram] + " trăm ";
    }

    if (chuc === 0) {
      if (donVi > 0) {
        if (tram > 0 || !isFirst) {
          aStr += "lẻ ";
        }
        aStr += units[donVi];
      }
    } else if (chuc === 1) {
      aStr += "mười ";
      if (donVi === 5) {
        aStr += "lăm";
      } else if (donVi === 1) {
        aStr += "một";
      } else if (donVi > 0) {
        aStr += units[donVi];
      }
    } else {
      aStr += units[chuc] + " mươi ";
      if (donVi === 5) {
        aStr += "lăm";
      } else if (donVi === 1) {
        aStr += "mốt";
      } else if (donVi > 0) {
        aStr += units[donVi];
      }
    }
    return aStr.trim();
  };

  const nChunks = chunks.length;
  for (let i = 0; i < nChunks; i++) {
    const chunk = chunks[i];
    const val = parseInt(chunk);
    if (val === 0) continue;

    const chunkStr = readChunk(chunk, i === 0);
    const pos = nChunks - 1 - i;
    res += chunkStr + sections[pos] + " ";
  }

  res = res.trim();
  if (res.length > 0) {
    res = res.charAt(0).toUpperCase() + res.slice(1);
    return res + " đồng chẵn";
  }
  return "Không đồng";
}

export default function PrintModal({
  isOpen,
  onClose,
  invoice,
  importSlip,
  settings,
  products = [],
  customers = [],
  selectedTemplate,
  onUpdateTemplate,
  isDraft = false,
  onShowToast
}: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Dynamic user inputs to customize invoice content on the fly
  const [customShopName, setCustomShopName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [bankName, setBankName] = useState('Vietcombank (VCB)');
  const [bankBranch, setBankBranch] = useState('Chi nhánh Cầu Giấy');
  const [bankNumber, setBankNumber] = useState('1023884499095');
  const [bankHolder, setBankHolder] = useState('HỘ KINH DOANH PHONG HƯNG');
  const [customFooterNote, setCustomFooterNote] = useState('Chúc quý khách hàng vạn sự như ý, buôn may bán đắt!');

  // Sync state with settings when modal is opened or changed
  useEffect(() => {
    if (isOpen) {
      setCustomShopName(settings.logoName || settings.softName || 'PHONG HƯNG POS');
      setCustomAddress(settings.shopAddress || 'Cầu Giấy, Hà Nội');
      setCustomPhone(settings.shopPhone || '0984.499.095');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const isInvoice = !!invoice;
  const item = invoice || importSlip;
  if (!item) return null;

  const renderPrintLogoHelper = (className = "w-10 h-10", forceMono = false) => {
    const logoType = settings.brandLogoType || 'default';
    const logoShape = settings.brandLogoShape || 'circle';
    const logoColor = forceMono ? '#000000' : (settings.brandLogoColor || '#E11D48');
    const isGlow = forceMono ? false : (settings.brandLogoGlow !== false);
    const strokeWidth = settings.brandLogoBorderWidth !== undefined ? settings.brandLogoBorderWidth : 3;
    const logoImage = settings.brandLogoImage || settings.logoImage;
    const initials = settings.logoInitials || 'PH';

    // Outer border style
    const borderStyle = {
      stroke: logoColor,
      strokeWidth: strokeWidth,
      fill: 'white',
    };

    const logoStyle: React.CSSProperties = {
      filter: isGlow ? `drop-shadow(0 0 6px ${logoColor}99)` : 'none',
    };

    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className} 
        style={logoStyle}
      >
        <defs>
          <linearGradient id="printFlame1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={logoColor} />
            <stop offset="100%" stopColor={forceMono ? "#666666" : "#F59E0B"} />
          </linearGradient>
          <linearGradient id="printFlame2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={forceMono ? "#666666" : "#F59E0B"} />
            <stop offset="100%" stopColor={logoColor} />
          </linearGradient>
          
          <clipPath id="print-logo-clip-circle">
            <circle cx="50" cy="50" r={48 - strokeWidth} />
          </clipPath>
          <clipPath id="print-logo-clip-squircle">
            <path d="M 25,10 C 50,10 50,10 75,10 C 90,10 90,20 90,50 C 90,80 90,80 75,90 C 50,90 50,90 25,90 C 10,90 10,80 10,50 C 10,20 10,10 25,10 Z" />
          </clipPath>
          <clipPath id="print-logo-clip-hexagon">
            <path d="M 50,6 L 88,28 L 88,72 L 50,94 L 12,72 L 12,28 Z" />
          </clipPath>
        </defs>

        {/* Outer Backing Shape & Stroke */}
        {logoShape === 'circle' && (
          <circle cx="50" cy="50" r={48 - (strokeWidth / 2)} {...borderStyle} />
        )}
        {logoShape === 'squircle' && (
          <path d="M 25,10 C 50,10 50,10 75,10 C 90,10 90,20 90,50 C 90,80 90,80 75,90 C 50,90 50,90 25,90 C 10,90 10,80 10,50 C 10,20 10,10 25,10 Z" {...borderStyle} />
        )}
        {logoShape === 'hexagon' && (
          <path d="M 50,6 L 88,28 L 88,72 L 50,94 L 12,72 L 12,28 Z" {...borderStyle} />
        )}

        {/* Middle Design Component Content */}
        {logoType === 'image' && logoImage ? (
          <image 
            href={logoImage} 
            x="0" 
            y="0" 
            width="100" 
            height="100" 
            clipPath={`url(#print-logo-clip-${logoShape})`} 
            preserveAspectRatio="xMidYMid slice" 
          />
        ) : logoType === 'flames' ? (
          <g transform="translate(10, 10) scale(0.8)">
            <path d="M 50,5 C 65,30 80,45 80,65 C 80,82 66,95 50,95 C 34,95 20,82 20,65 C 20,45 35,30 50,5 Z" fill="url(#printFlame1)" />
            <path d="M 50,25 C 60,42 70,55 70,70 C 70,82 61,90 50,90 C 39,90 30,82 30,70 C 30,55 40,42 50,25 Z" fill="url(#printFlame2)" />
            <path d="M 50,45 C 55,55 60,65 60,75 C 60,82 55,87 50,87 C 45,87 40,82 40,75 C 40,65 45,55 50,45 Z" fill={forceMono ? "#cccccc" : "#FBBF24"} />
          </g>
        ) : logoType === 'chef' ? (
          <g transform="translate(18, 16) scale(0.65)" stroke={logoColor} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 20,68 C 15,68 12,62 15,55 C 10,48 15,35 25,38 C 30,20 50,15 60,25 C 75,18 88,32 82,46 C 88,54 85,68 70,68 Z" />
            <path d="M 25,68 L 75,68 L 70,85 L 30,85 Z" fill={logoColor} fillOpacity={forceMono ? "0.3" : "0.1"} />
            <line x1="33" y1="76" x2="67" y2="76" />
            <path d="M 50,38 L 53,46 L 61,46 L 54,51 L 57,59 L 50,54 L 43,59 L 46,51 L 39,46 L 47,46 Z" fill={logoColor} stroke="none" />
          </g>
        ) : logoType === 'shield' ? (
          <g transform="translate(18, 15) scale(0.65)" stroke={logoColor} fill="none" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 12,10 L 50,2 L 88,10 C 88,45 70,75 50,95 C 30,75 12,45 12,10 Z" fill={logoColor} fillOpacity={forceMono ? "0.3" : "0.1"} />
            <path d="M 50,25 L 50,70 Q 50,82 50,82" strokeWidth="6" />
            <path d="M 32,45 L 68,45" strokeWidth="6" />
          </g>
        ) : logoType === 'crown' ? (
          <g transform="translate(15, 15) scale(0.7)" stroke={logoColor} fill="none" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 10,75 L 20,40 L 40,55 L 50,25 L 60,55 L 80,40 L 90,75 Z" fill={logoColor} fillOpacity={forceMono ? "0.3" : "0.1"} />
            <rect x="10" y="75" width="80" height="10" rx="3" fill={logoColor} stroke="none" />
            <circle cx="50" cy="22" r="5" fill={logoColor} stroke="none" />
            <circle cx="20" cy="37" r="4" fill={logoColor} stroke="none" />
            <circle cx="80" cy="37" r="4" fill={logoColor} stroke="none" />
          </g>
        ) : logoType === 'inductor' ? (
          <g transform="translate(12, 12) scale(0.76)" stroke={logoColor} fill="none" strokeWidth="4" strokeLinecap="round">
            <circle cx="50" cy="50" r="42" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="30" strokeWidth="5" />
            <circle cx="50" cy="50" r="16" fill={logoColor} stroke="none" />
            <line x1="50" y1="8" x2="50" y2="92" strokeWidth="2.5" />
            <line x1="8" y1="50" x2="92" y2="50" strokeWidth="2.5" />
          </g>
        ) : (
          /* Default Phong Hung Germany with Custom initials / PH */
          <>
            <circle cx="50" cy="50" r="46" fill="white" stroke={logoColor} strokeWidth="3" />
            <path d="M 12,50 C 35,20 65,80 88,50 C 75,75 25,75 12,50 Z" fill={logoColor} />
            <path d="M 12,50 C 35,40 65,60 88,50 C 75,85 25,85 12,50 Z" fill="#000" />
            <path d="M 15,58 C 35,50 65,70 85,58 C 75,90 25,90 15,58 Z" fill={forceMono ? "#999999" : "#f59e0b"} />
            <text x="50" y="44" fontFamily="sans-serif" fontWeight="900" fontSize="16" fill="#111827" textAnchor="middle">{initials}</text>
            <path id="print_curve_emblem" d="M 18,34 A 32,32 0 0,1 82,34" fill="none" />
            <text className="font-bold tracking-widest font-sans" style={{ fill: logoColor, fontSize: '7px' }} textAnchor="middle">
              <textPath href="#print_curve_emblem" startOffset="50%">PHONG HUNG</textPath>
            </text>
            <text x="50" y="88" fontFamily="sans-serif" fontWeight="800" fontSize="7" fill={logoColor} letterSpacing="0.5" textAnchor="middle">GERMANY</text>
          </>
        )}
      </svg>
    );
  };

  // Render correct print layout according to selection
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;

    if (printContent) {
      const windowUrl = 'about:blank';
      const windowName = 'PrintWindow';
      const printWindow = window.open(windowUrl, windowName, 'width=850,height=750');
      if (printWindow) {
        // Compile precise style rules for printed page representation
        printWindow.document.write(`
          <html>
            <head>
              <title>In Phiếu - ${customShopName}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                body {
                  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  padding: 10px;
                  color: #000;
                  background: #fff;
                  margin: 0;
                  box-sizing: border-box;
                }
                
                /* Layout widths constraint per format */
                .print-paper-wrap {
                  width: 100%;
                  margin: 0 auto;
                  box-sizing: border-box;
                }
                
                .format-a5_01, .format-a5_02, .format-a5_kiotviet {
                  width: 148mm;
                  max-width: 100%;
                  font-size: 11px;
                }
                
                .format-k58_01, .format-k58_02 {
                  width: 57mm;
                  font-size: 8.5px;
                  line-height: 1.3;
                }
                
                .format-k80_01 {
                  width: 78mm;
                  font-size: 10.5px;
                  line-height: 1.4;
                }
                
                /* Typography & Core Classes */
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-extrabold { font-weight: 800; }
                .font-bold { font-weight: 700; }
                .font-semibold { font-weight: 600; }
                .uppercase { text-transform: uppercase; }
                .tracking-wide { letter-spacing: 0.05em; }
                .mt-2 { margin-top: 0.5rem; }
                .mt-4 { margin-top: 1rem; }
                .mt-6 { margin-top: 1.5rem; }
                .mb-1 { margin-bottom: 0.25rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .w-full { width: 100%; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .gap-1 { gap: 0.25rem; }
                
                /* Dividers */
                .divider-dashed {
                  border-top: 1px dashed #000;
                  margin: 8px 0;
                }
                .divider-double {
                  border-top: 3px double #000;
                  margin: 10px 0;
                }
                .divider-solid {
                  border-top: 1px solid #000;
                  margin: 8px 0;
                }
                
                /* Table styling */
                .print-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 8px 0;
                }
                .print-table th, .print-table td {
                  padding: 4px 2px;
                  text-align: left;
                  vertical-align: top;
                }
                .print-table th {
                  font-weight: 700;
                  border-bottom: 1px solid #000;
                }
                .print-table td {
                  border-bottom: 1px dashed #ddd;
                }
                .print-table-bordered {
                  border: 1px solid #000;
                }
                .print-table-bordered th, .print-table-bordered td {
                  border: 1px solid #000;
                  padding: 5px;
                }
                .print-table-bordered th {
                  background-color: #f3f4f6;
                }
                
                /* Bank Info Table */
                .print-bank-box {
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #000;
                  margin: 10px 0;
                  font-size: 10px;
                }
                .print-bank-box td {
                  border: 1px solid #000;
                  padding: 4px 6px;
                }
                .print-bank-title {
                  background-color: #f3f4f6;
                  font-weight: 700;
                  width: 30%;
                }
                
                /* Draft watermark style */
                .draft-stamp-container {
                  border: 2px solid #ef4444;
                  color: #ef4444;
                  padding: 3px 10px;
                  border-radius: 6px;
                  font-weight: 800;
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                  display: inline-block;
                  margin-bottom: 8px;
                }
                
                /* Custom signatures */
                .sig-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  text-align: center;
                  margin-top: 15px;
                  font-size: 10px;
                }
                .sig-height {
                  height: 35px;
                }
                
                /* Contact badges at bottom */
                .social-badges-bar {
                  display: flex;
                  justify-content: center;
                  gap: 12px;
                  margin-top: 10px;
                  font-size: 9px;
                  color: #444;
                }
                .badge-item {
                  display: flex;
                  align-items: center;
                  gap: 3px;
                }
                
                /* Graphic indicators */
                .print-barcode {
                  margin: 8px auto;
                  height: 30px;
                  width: 85%;
                  background: repeating-linear-gradient(90deg, #000, #000 2px, transparent 2px, transparent 5px);
                  text-align: center;
                }
                .print-qr-placeholder {
                  width: 55px;
                  height: 55px;
                  border: 2px solid #000;
                  margin: 6px auto;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 7px;
                  font-weight: bold;
                  text-align: center;
                }
                
                /* Print specific page overrides */
                @media print {
                  @page {
                    margin: 0 !important;
                  }
                  body {
                    padding: 0 !important; margin: 0 !important;
                  }
                  /* Adaptive margins/paddings and auto widths for thermal rolls */
                  .format-k58_01, .format-k58_02 {
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 1.5mm 2.5mm !important;
                    box-sizing: border-box !important;
                  }
                  .format-k80_01 {
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 2.5mm 3.5mm !important;
                    box-sizing: border-box !important;
                  }
                  .format-a5_01, .format-a5_02, .format-a5_kiotviet {
                    width: 148mm !important;
                    max-width: 148mm !important;
                    padding: 6mm !important;
                    box-sizing: border-box !important;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="print-paper-wrap format-${selectedTemplate}">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => { window.close(); }, 600);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        if (onShowToast) {
          onShowToast('Đã gửi tài liệu tới máy in thành công!', 'success');
        }
      } else {
        alert("Không thể khởi chạy cửa sổ in do cài đặt trình duyệt. Quý khách vui lòng thử lại hoặc nhấn chụp màn hình.");
      }
    }
  };

  // Pre-calculate visual template details
  const draftTitle = isDraft ? "PHIẾU TẠM TÍNH" : "HÓA ĐƠN BÁN HÀNG";
  const finalTitle = isInvoice ? draftTitle : "PHIẾU NHẬP HÀNG";
  const docId = isInvoice ? invoice.maHD : importSlip.maPN;
  const docDate = isInvoice ? invoice.ngay : importSlip.ngayMoi;

  // Width classes inside the preview modal frame
  const getPreviewWidthClass = () => {
    switch (selectedTemplate) {
      case 'k58_01':
      case 'k58_02':
        return 'w-[260px] text-[10px]';
      case 'k80_01':
        return 'w-[330px] text-[11px]';
      case 'a5_01':
      case 'a5_02':
      case 'a5_kiotviet':
      default:
        return 'w-full max-w-[500px] text-[12px]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh]">
        
        {/* LEFT PANEL: REAL-TIME INVOICE DESIGN CONFIGURATION BAR */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-1/2 md:h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-xs font-display tracking-wider uppercase">
              <Settings className="w-4 h-4 text-rose-500 animate-spin-slow" /> Thiết kế & mẫu in
            </h3>
            <span className="bg-rose-100 text-[#E11D48] text-[9px] px-2 py-0.5 rounded font-black uppercase font-mono">
              Quản lý in
            </span>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Template Selector Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-sans block">Sơ đồ Mẫu Hóa Đơn</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'a5_kiotviet', label: 'Khổ A5 - Mẫu in KiotViet' },
                  { id: 'a5_01', label: 'Khổ A5 - Truyền thống' },
                  { id: 'a5_02', label: 'Khổ A5 - Chi tiết Bank & MXH' },
                  { id: 'k58_01', label: 'Khổ K58 - Cuộn siêu thị barcode' },
                  { id: 'k58_02', label: 'Khổ K58 - Bán lẻ liên hệ' },
                  { id: 'k80_01', label: 'Khổ K80 - Hóa Đơn Nhiệt Lớn' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onUpdateTemplate(t.id as any)}
                    className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center justify-between cursor-pointer ${
                      selectedTemplate === t.id
                        ? 'border-rose-500 bg-rose-50/60 text-rose-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.label}</span>
                    {selectedTemplate === t.id && <Check className="w-3.5 h-3.5 text-[#E11D48]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom fields */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-sans">Sửa thông tin nhanh khi in</p>
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Tên Cửa Hàng / Hộ Kinh Doanh</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-1.5 px-2 bg-white text-xs font-semibold text-slate-800"
                  value={customShopName}
                  onChange={(e) => setCustomShopName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Địa Chỉ Cửa Hàng</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-1.5 px-2 bg-white text-xs font-semibold text-slate-800"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Điện Thoại Hotline</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-1.5 px-2 bg-white text-xs font-semibold text-slate-800"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                />
              </div>

              {/* Bank accounts section, visible specifically if A5_02 is selected */}
              {selectedTemplate === 'a5_02' && (
                <div className="p-2.5 bg-rose-50 rounded-xl space-y-2 border border-rose-100 mt-2">
                  <p className="font-black text-rose-800 text-[10px] uppercase font-sans tracking-wide">Chi tiết thụ hưởng ngân hàng</p>
                  
                  <div className="space-y-1">
                    <label className="font-bold text-rose-700 block text-[10px]">Tên Ngân Hàng</label>
                    <input
                      type="text"
                      className="w-full border border-rose-200 rounded-md p-1 px-1.5 bg-white text-[11px] font-semibold"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-rose-700 block text-[10px]">Số Tài Khoản</label>
                    <input
                      type="text"
                      className="w-full border border-rose-200 rounded-md p-1 px-1.5 bg-white text-[11px] font-bold"
                      value={bankNumber}
                      onChange={(e) => setBankNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-rose-700 block text-[10px]">Chủ Tài Khoản</label>
                    <input
                      type="text"
                      className="w-full border border-rose-200 rounded-md p-1 px-1.5 bg-white text-[11px] font-bold"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-rose-700 block text-[10px]">Chi Nhánh</label>
                    <input
                      type="text"
                      className="w-full border border-rose-200 rounded-md p-1 px-1.5 bg-white text-[11px] font-medium"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Lời Chúc Chân Trang</label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-1.5 px-2 bg-white text-xs font-medium text-slate-800"
                  value={customFooterNote}
                  onChange={(e) => setCustomFooterNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: ACTUAL INVOICE LIVE PREVIEW CANVAS */}
        <div className="flex-1 bg-slate-100 flex flex-col h-1/2 md:h-full relative">
          
          {/* Preview Header */}
          <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between font-sans shadow-sm shrink-0">
            <div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Bản xem trước mẫu in
              </span>
              <h2 className="text-sm font-bold text-slate-800 mt-1">
                Mẫu: <strong className="text-rose-600">{selectedTemplate.toUpperCase()}</strong> {isDraft && '(Phiếu Tạm)'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1 px-2 hover:bg-slate-100 rounded-full cursor-pointer transition text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Preview Paper box */}
          <div className="p-6 overflow-y-auto flex-1 flex justify-center items-start">
            <div 
              ref={printRef} 
              className={`bg-white p-6 md:p-8 border border-slate-300 shadow-xl text-black font-sans leading-relaxed text-left transition-all duration-200 ${getPreviewWidthClass()}`}
              style={{ minHeight: '480px' }}
            >
              {/* Draft Watermark Banner */}
              {isDraft && (
                <div className="text-center no-print">
                  <span className="draft-stamp-container">
                    ⚠️ {draftTitle}
                  </span>
                </div>
              )}

              {/* RENDER SELECTED TEMPLATE COMPONENT VIEW */}
              {(() => {
                const detailsList = item.details || [];
                const storeNameUpper = customShopName.toUpperCase();

                // ------------------------------------
                // TEMPLATE a5_01: STANDARD WIDE SHEET
                // ------------------------------------
                if (selectedTemplate === 'a5_01') {
                  return (
                    <div className="space-y-4">
                      {/* Store info details */}
                      <div className="text-center border-b border-dashed border-slate-400 pb-3">
                        <h2 className="text-base font-extrabold tracking-wider">{storeNameUpper}</h2>
                        <p className="text-[10px] text-slate-600 mt-0.5">{customAddress}</p>
                        <p className="text-[10px] text-slate-600">SĐT: {customPhone}</p>
                      </div>

                      {/* Header values */}
                      <div className="text-center">
                        <h1 className="text-base font-extrabold tracking-wide uppercase">{isInvoice ? draftTitle : "PHIẾU NHẬP HÀNG"}</h1>
                        <p className="text-[10px] text-slate-600 mt-0.5">Số phiếu: <strong>{docId}</strong></p>
                        <p className="text-[10px] text-slate-600">Ngày lập: {formatDate(docDate)}</p>
                      </div>

                      {/* Customer / Supplier details */}
                      <div className="space-y-0.5 text-[11px] pb-2 border-b border-dashed border-slate-400">
                        <div className="flex justify-between">
                          <span><span>{isInvoice ? 'Khách hàng: ' : 'Nhà cung cấp: '}</span><strong>{isInvoice ? invoice?.tenKH : (importSlip as any)?.tenNCC || 'Khách vãng lai'}</strong></span>
                          <span>ĐT: <span>{isInvoice ? invoice?.sdtKH : (importSlip as any)?.sdtNCC || '-'}</span></span>
                        </div>
                        {isInvoice && invoice?.maKH !== 'KH000004' && (
                          <p>Địa chỉ: <span>{invoice?.maKH === 'KH000001' ? '12 Kim Mã, HN' : invoice?.maKH === 'KH000003' ? 'Trần Quốc Hoàn, HN' : 'Tại cửa hàng'}</span></p>
                        )}
                        {!isInvoice && (
                          <p>Người liên hệ: <strong>{(importSlip as any)?.nguoiLienHe || '-'}</strong></p>
                        )}
                        <p>Nhân viên lập: <span>{item.nhanVien}</span></p>
                      </div>

                      {/* Product details table */}
                      <table className="w-full font-sans text-[11px] mt-2">
                        <thead>
                          <tr className="border-b-2 border-black font-bold">
                            <th className="py-1 text-left">Mặt hàng</th>
                            <th className="py-1 text-center">SL</th>
                            <th className="py-1 text-right">Đơn giá</th>
                            <th className="py-1 text-right">Tổng cộng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsList.map((detail: any, idx: number) => (
                            <tr key={idx} className="border-b border-dashed border-slate-300">
                              <td className="py-1.5 font-medium">{detail.tenSP}</td>
                              <td className="py-1.5 text-center font-bold">{detail.soLuong}</td>
                              <td className="py-1.5 text-right font-semibold">{formatVND(detail.donGia || detail.donGiaNhap)}</td>
                              <td className="py-1.5 text-right font-bold">{formatVND(detail.thanhTien)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Calculation results */}
                      <div className="border-t border-black pt-2 space-y-1.5 text-[11px] font-sans">
                        <div className="flex justify-between text-slate-700">
                          <span>Cộng tiền hàng:</span>
                          <span className="font-semibold">{formatVND(item.tongTien + (invoice?.giamGia || 0))}</span>
                        </div>
                        {isInvoice && (invoice?.giamGia || 0) > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Chiết khấu giảm giá:</span>
                            <span>-{formatVND(invoice?.giamGia || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-extrabold text-xs pt-1.5 border-t border-slate-300">
                          <span>TỔNG THÀNH TIỀN:</span>
                          <span>{formatVND(item.tongTien)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Đã thanh toán:</span>
                          <span>{formatVND(item.daTra)}</span>
                        </div>
                        <div className="flex justify-between text-rose-700 font-bold">
                          <span>Con nợ còn lại:</span>
                          <span>{formatVND(item.conNo)}</span>
                        </div>
                      </div>

                      {/* Signatories */}
                      <div className="sig-grid pt-5 border-t border-dashed border-slate-400 mt-6">
                        <div>
                          <p className="font-bold">{isInvoice ? 'Người Mua Hàng' : 'Người Nhận'}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">(Ký, ghi rõ họ tên)</p>
                          <div className="sig-height"></div>
                        </div>
                        <div>
                          <p className="font-bold">{isInvoice ? 'Người Lập Hóa Đơn' : 'Người Bán'}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">(Ký, ghi rõ họ tên)</p>
                          <div className="sig-height"></div>
                        </div>
                      </div>

                      {/* Footer Message */}
                      <div className="text-center pt-3 border-t border-dashed border-slate-300 mt-6">
                        <p className="text-[10px] text-slate-500 font-semibold italic">{customFooterNote}</p>
                        <p className="text-[8px] text-slate-400 mt-1">Phong Hưng POS - Giải pháp quản lý trực quan</p>
                      </div>
                    </div>
                  );
                }

                // ------------------------------------
                // TEMPLATE a5_kiotviet: EXQUISITE KIOTVIET INSPIRED
                // ------------------------------------
                if (selectedTemplate === 'a5_kiotviet') {
                  const custObj = isInvoice ? customers?.find(c => c.maKH === invoice?.maKH || c.tenKH === invoice?.tenKH) : null;
                  const customerAddress = invoice?.maKH === 'KH000001' 
                    ? 'Số 10, Phổ Quang, Tân Bình, TPHCM' 
                    : custObj?.diaChi || "Tại cửa hàng";
                  const customerPhone = isInvoice ? invoice?.sdtKH : (importSlip as any)?.sdtNCC || '';

                  // Dynamic Date calculations matching: "Ngày 08 tháng 05 năm 2014" or invoice date
                  const d = new Date(docDate);
                  const dateDay = String(d.getDate()).padStart(2, '0');
                  const dateMonth = String(d.getMonth() + 1).padStart(2, '0');
                  const dateYear = d.getFullYear();

                  // Calculate total quantities
                  const totalQty = detailsList.reduce((sum: number, x: any) => sum + (x.soLuong || 0), 0);
                  const wordSpelling = docSoTienVND(item.tongTien);

                  return (
                    <div className="space-y-4 text-black font-sans leading-relaxed" style={{ color: '#000' }}>
                      {/* Top section: Logo on left, store details in center, invoice number on right */}
                      <div className="grid grid-cols-3 gap-2 items-start justify-between border-b pb-3 border-slate-350">
                        {/* 1. Left cell: Actual Shop Logo */}
                        <div className="flex items-center gap-2 select-none">
                          {renderPrintLogoHelper("w-11 h-11 shrink-0")}
                          <div className="leading-tight text-left">
                            <span className="text-xs font-black tracking-tight text-slate-800 uppercase block leading-none">{customShopName || 'Phong Hùng'}</span>
                            <span className="text-[8px] text-[#1EC460] font-extrabold uppercase tracking-widest block mt-0.5">POS SYSTEM</span>
                          </div>
                        </div>

                        {/* 2. Center cell: Store core information (removed Address as requested) */}
                        <div className="text-center space-y-0.5">
                          <h2 className="text-xs font-black tracking-wider uppercase text-slate-900">{storeNameUpper}</h2>
                          <p className="text-[10px] text-slate-750 font-bold">SĐT: {customPhone}</p>
                        </div>

                        {/* 3. Right cell: Document visual serial code */}
                        <div className="text-right text-[11px] font-sans">
                          <p className="font-bold">Số: <span className="text-rose-600 font-extrabold">{docId}</span></p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Powered by KiotViet</p>
                        </div>
                      </div>

                      {/* Header title */}
                      <div className="text-center py-2">
                        <h2 className="text-base font-black tracking-widest uppercase text-slate-900">
                          {isInvoice ? (isDraft ? "HÓA ĐƠN TẠM TÍNH" : "HÓA ĐƠN BÁN HÀNG") : "PHIẾU NHẬP HÀNG"}
                        </h2>
                      </div>

                      {/* Client / Supplier details layout block spacing */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] pb-2 border-b border-dashed border-slate-300">
                        <div>
                          <p>
                            <span className="text-slate-500 font-bold">{isInvoice ? 'Khách hàng: ' : 'Nhà cung cấp: '}</span>
                            <strong className="text-slate-900">{isInvoice ? invoice?.tenKH : (importSlip as any)?.tenNCC || 'Khách vãng lai'}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <p>
                            <span className="text-slate-500 font-bold">Số điện thoại: </span>
                            <strong className="text-slate-950">{customerPhone || '-'}</strong>
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="leading-normal">
                            <span className="text-slate-500 font-bold">Địa chỉ: </span>
                            <span className="text-slate-800 font-semibold">{isInvoice ? customerAddress : (importSlip as any)?.diaChi || 'Tại cửa hàng'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Main elegant classical border-lined tables */}
                      <table className="w-full text-left text-[11px] border-collapse border border-black font-sans">
                        <thead>
                          <tr className="bg-slate-50 text-slate-900 font-black border-b border-black uppercase text-[10px]">
                            <th className="py-1 px-1 text-center border-r border-black w-8">STT</th>
                            <th className="py-1 px-2 border-r border-black">Tên Hàng</th>
                            <th className="py-1 px-1 text-center border-r border-black w-10">ĐVT</th>
                            <th className="py-1 px-1 text-center border-r border-black w-10">SL</th>
                            <th className="py-1 px-2 text-right border-r border-black">Đơn giá</th>
                            <th className="py-1 px-2 text-right border-r border-black">Chiết khấu</th>
                            <th className="py-1 px-2 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsList.map((detail: any, idx: number) => {
                            const prod = products?.find(p => p.maSP === detail.maSP);
                            const dvt = prod?.dvt || "cái";
                            // Proportional discount distribution based on total discount
                            const discountItemVal = isInvoice && (invoice?.giamGia || 0) > 0 && item.tongTien > 0
                              ? Math.round(((invoice.giamGia || 0) * detail.thanhTien) / item.tongTien / (detail.soLuong || 1))
                              : 0;
                            return (
                              <tr key={idx} className="border-b border-black text-slate-900">
                                <td className="py-1.5 px-1 text-center border-r border-black font-semibold">{idx + 1}</td>
                                <td className="py-1.5 px-2 border-r border-black font-bold">{detail.tenSP}</td>
                                <td className="py-1.5 px-1 text-center border-r border-black text-slate-700 italic">{dvt}</td>
                                <td className="py-1.5 px-1 text-center border-r border-black font-black">{detail.soLuong}</td>
                                <td className="py-1.5 px-2 text-right border-r border-black">{formatVND(detail.donGia || detail.donGiaNhap)}</td>
                                <td className="py-1.5 px-2 text-right border-r border-black text-slate-500">{formatVND(discountItemVal)}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-slate-950">{formatVND(detail.thanhTien)}</td>
                              </tr>
                            );
                          })}

                          {/* Spanning sum row styled exactly like image */}
                          <tr className="bg-slate-50 font-black border-t border-black text-slate-900">
                            <td colSpan={3} className="py-1.5 px-3 text-center border-r border-black uppercase text-[10px]">CỘNG</td>
                            <td className="py-1.5 px-1 text-center border-r border-black text-xs font-black">{totalQty}</td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="py-1.5 px-2 text-right text-xs font-black text-slate-950">{formatVND(item.tongTien)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Literal spell-out phrase */}
                      <div className="text-[11px] italic text-slate-900 py-1 flex items-center gap-1">
                        <span>Viết bằng chữ:</span>
                        <strong className="text-slate-900 font-bold italic">{wordSpelling}</strong>
                      </div>

                      {/* Signatures replaced by help/feedback texts as per requested image */}
                      <div className="pt-2 space-y-3">
                        <div className="text-right text-[11px] text-slate-700 font-bold">
                          Ngày {dateDay} tháng {dateMonth} năm {dateYear}
                        </div>

                        <div className="text-center pt-2 border-t border-black space-y-1">
                          <p className="text-[11px] font-black italic text-black leading-relaxed">
                            Có bất cứ vấn đề gì sản phẩm Khách Hàng vui lòng liên hệ số Hotline để được hỗ trợ nhanh nhất!
                          </p>
                          <p className="text-[12px] font-black italic text-black">
                            Cám ơn Quý Khách
                          </p>
                        </div>
                      </div>

                      {/* Small soft bottom signature footer */}
                      <div className="text-center pt-2.5 border-t border-dashed border-slate-300 mt-4 select-none">
                        <p className="text-[10px] text-slate-400 italic">Cảm ơn quý khách đã ủng hộ {customShopName}!</p>
                      </div>
                    </div>
                  );
                }

                // ------------------------------------
                // TEMPLATE a5_02: BANK TRANSFER & MXH
                // ------------------------------------
                if (selectedTemplate === 'a5_02') {
                  return (
                    <div className="space-y-4">
                      {/* High end double borders decor */}
                      <div className="border-b-4 border-double border-slate-900 pb-3 flex justify-between items-start">
                        <div>
                          <h2 className="text-base font-extrabold tracking-widest text-slate-900">{storeNameUpper}</h2>
                          <p className="text-[10px] text-slate-600 mt-0.5">{customAddress}</p>
                          <p className="text-[10px] text-slate-600">SĐT: {customPhone}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            Bản chính thức
                          </span>
                        </div>
                      </div>

                      {/* Invoice Title Card */}
                      <div className="text-center py-1">
                        <h1 className="text-lg font-black tracking-widest uppercase text-slate-900">{finalTitle}</h1>
                        <p className="text-[10px] text-slate-600 mt-1">Số giao dịch: <strong>{docId}</strong> / Ngày: {formatDate(docDate)}</p>
                      </div>

                      {/* Client information structured */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 text-[11px] grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Người thụ nhận</p>
                          <p className="text-xs font-bold text-slate-800">{isInvoice ? invoice?.tenKH : (importSlip as any)?.tenNCC || 'Khách vãng lai'}</p>
                          <p className="text-slate-600">Liên hệ SĐT: {isInvoice ? invoice?.sdtKH : (importSlip as any)?.sdtNCC || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">giao dịch chi tiết</p>
                          <p className="text-slate-600">Lập phiếu bởi: <strong className="text-slate-800">{item.nhanVien}</strong></p>
                          {isInvoice && invoice?.maKH !== 'KH000004' && (
                            <p className="truncate text-slate-600">Địa chỉ: BA ĐÌNH, CẦU GIẤY, HÀ NỘI</p>
                          )}
                        </div>
                      </div>

                      {/* Columns Grid format */}
                      <table className="print-table w-full text-[11px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-extrabold uppercase text-[9px] tracking-wide">
                            <th className="py-2 px-2">STT</th>
                            <th className="py-2 px-2">Mặt hàng</th>
                            <th className="py-2 px-2 text-center">SL</th>
                            <th className="py-2 px-2 text-right">Đơn giá</th>
                            <th className="py-2 px-2 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsList.map((detail: any, idx: number) => (
                            <tr key={idx} className="border-b border-dashed border-slate-300">
                              <td className="py-2 px-2 font-bold text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                              <td className="py-2 px-2 font-bold text-slate-800">{detail.tenSP}</td>
                              <td className="py-2 px-2 text-center font-extrabold text-slate-900">{detail.soLuong}</td>
                              <td className="py-2 px-2 text-right">{formatVND(detail.donGia || detail.donGiaNhap)}</td>
                              <td className="py-2 px-2 text-right font-black text-rose-600">{formatVND(detail.thanhTien)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* BANKING STRUCTURE TABLE (as in Screenshot #3) */}
                      {isInvoice && (
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans mb-1">Thông tin thanh toán qua ngân hàng</p>
                          <table className="print-bank-box">
                            <tbody>
                              <tr>
                                <td className="print-bank-title">Ngân hàng thụ hưởng</td>
                                <td className="font-semibold text-slate-800">{bankName}</td>
                                <td className="print-bank-title">Chủ tài khoản</td>
                                <td className="font-bold text-slate-800">{bankHolder}</td>
                              </tr>
                              <tr>
                                <td className="print-bank-title">Số tài khoản nhận</td>
                                <td className="font-extrabold font-mono text-xs text-rose-600">{bankNumber}</td>
                                <td className="print-bank-title">Chi nhánh ngân hàng</td>
                                <td className="text-slate-600">{bankBranch}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Calculations right-aligned */}
                      <div className="flex justify-end pt-2 border-t border-slate-200">
                        <div className="w-1/2 space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-600">
                            <span>Thành tiền trước khấu:</span>
                            <span className="font-semibold">{formatVND(item.tongTien + (invoice?.giamGia || 0))}</span>
                          </div>
                          {isInvoice && (invoice?.giamGia || 0) > 0 && (
                            <div className="flex justify-between text-rose-600">
                              <span>Chiết khấu giảm giá:</span>
                              <span>-{formatVND(invoice?.giamGia || 0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-black text-xs text-rose-600 border-t border-slate-300 pt-1.5">
                            <span>TỔNG KHÁCH TRẢ:</span>
                            <span>{formatVND(item.tongTien)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span>Khách đã thanh toán:</span>
                            <span className="font-bold">{formatVND(item.daTra)}</span>
                          </div>
                          <div className="flex justify-between text-slate-700">
                            <span>Hạn nợ ghi nhận:</span>
                            <span className="font-black font-mono">{formatVND(item.conNo)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Social media contact badges (as in Screenshot #3) */}
                      <div className="social-badges-bar">
                        <div className="badge-item font-bold">
                          <span>🔵</span> Zalo: <strong>{customPhone} (Phong Hưng)</strong>
                        </div>
                        <div className="badge-item font-bold">
                          <span>🌐</span> Fanpage: <strong>Hộ Kinh Doanh Phong Hưng</strong>
                        </div>
                        <div className="badge-item font-bold">
                          <span>☎️</span> ĐT: <strong>{customPhone}</strong>
                        </div>
                      </div>

                      {/* Footer Message */}
                      <div className="text-center pt-2.5 border-t border-dashed border-slate-300 mt-4 text-[10px] text-slate-400 font-semibold italic">
                        {customFooterNote}
                      </div>
                    </div>
                  );
                }

                // ------------------------------------
                // TEMPLATE k58_01: THERMAL COMPACT TICKET WITH BARCODES
                // ------------------------------------
                if (selectedTemplate === 'k58_01') {
                  return (
                    <div className="space-y-3 font-sans text-[10px]">
                      {/* Compact Store details */}
                      <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                        {renderPrintLogoHelper("w-9 h-9 mx-auto", true)}
                        <h2 className="text-[11px] font-black tracking-tight uppercase leading-none mt-1">{customShopName}</h2>
                        <p className="text-[8px] text-slate-600">{customAddress}</p>
                        <p className="text-[8px] text-slate-600 font-bold">Hotline: {customPhone}</p>
                      </div>

                      {/* Form Header */}
                      <div className="text-center space-y-0.5">
                        <h1 className="text-xs font-black tracking-wider uppercase">{finalTitle}</h1>
                        <p className="text-[8px] text-slate-600">Số HĐ: <strong>{docId}</strong></p>
                        <p className="text-[8px] text-slate-600">Ngày: {formatDate(docDate)}</p>
                      </div>

                      {/* Customer info */}
                      <div className="text-[8.5px] space-y-0.5 pb-1 border-b border-dashed border-slate-300 text-slate-700">
                        <p>Khách hàng: <strong className="text-black">{isInvoice ? invoice?.tenKH : 'N/A'}</strong></p>
                        <p>Nhân viên ra phiếu: <span>{item.nhanVien}</span></p>
                      </div>

                      {/* Dotted rows list */}
                      <div className="space-y-1.5 py-1">
                        {detailsList.map((detail: any, idx: number) => (
                          <div key={idx} className="border-b border-dotted border-slate-200 pb-1 flex justify-between items-start">
                            <div className="max-w-[70%] text-slate-900 font-medium">
                              <p className="truncate font-bold text-[9px]">{detail.tenSP}</p>
                              <p className="text-[8px] text-slate-500 font-bold">{detail.soLuong} cái x {formatVND(detail.donGia || detail.donGiaNhap)}</p>
                            </div>
                            <span className="text-right font-black text-slate-950 text-[9px]">{formatVND(detail.thanhTien)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Financial results */}
                      <div className="space-y-1 text-right text-[8.5px] border-t border-slate-300 pt-1.5">
                        <p>Tiền hàng gốc: <strong>{formatVND(item.tongTien + (invoice?.giamGia || 0))}</strong></p>
                        {isInvoice && (invoice?.giamGia || 0) > 0 && (
                          <p className="text-rose-600">Chiết khấu: <strong>-{formatVND(invoice?.giamGia || 0)}</strong></p>
                        )}
                        <p className="text-[10px] font-black text-black">TỔNG CỘNG: <span>{formatVND(item.tongTien)}</span></p>
                        <p className="text-emerald-700">Khách trả: <strong>{formatVND(item.daTra)}</strong></p>
                        <p className="text-rose-700 font-bold">Còn dư nợ: <strong>{formatVND(item.conNo)}</strong></p>
                      </div>

                      {/* QR/Barcode Simulation Boxes */}
                      <div className="py-2 text-center">
                        <div className="print-qr-placeholder font-mono text-[7px]">
                          QR CODE<br/>PAYMENT
                        </div>
                        <div className="print-barcode"></div>
                      </div>

                      {/* Small Footer Message */}
                      <div className="text-center pt-2 border-t border-dashed border-slate-200 text-[8px] text-slate-500 italic">
                        <p>{customFooterNote}</p>
                        <p className="mt-1 font-sans text-[7px]">Được xuất bởi Phong Hưng POS</p>
                      </div>
                    </div>
                  );
                }

                // ------------------------------------
                // TEMPLATE k58_02: MINI RETAIL TICKET
                // ------------------------------------
                if (selectedTemplate === 'k58_02') {
                  return (
                    <div className="space-y-3 font-sans text-[10px]">
                      {/* Compact Store details */}
                      <div className="text-center pb-1">
                        {renderPrintLogoHelper("w-9 h-9 mx-auto mb-1", true)}
                        <h2 className="text-[11px] font-black tracking-tight uppercase text-slate-900 leading-normal">{customShopName}</h2>
                        <p className="text-[8px] text-slate-600">{customAddress}</p>
                        <p className="text-[8px] text-slate-600">Hotline: {customPhone}</p>
                      </div>

                      {/* Bold headline as in Screenshot #8 */}
                      <div className="text-center py-1 border-y-4 border-double border-black">
                        <h1 className="text-sm font-black tracking-widest text-black uppercase">
                          {isDraft ? "PHIẾU TẠM TÍNH" : "HÓA ĐƠN BÁN LẺ"}
                        </h1>
                        <p className="text-[8px] text-slate-600 mt-0.5">Mã: {docId} / Ngày: {formatDate(docDate)}</p>
                      </div>

                      {/* Customer metrics */}
                      <div className="text-[8.5px] space-y-0.5 pb-1 border-b border-slate-300 text-slate-700">
                        <p>Khách hàng: <strong className="text-black">{isInvoice ? invoice?.tenKH : 'Khách vãng lai'}</strong></p>
                        <p>NVKD ra đơn: <strong>{item.nhanVien}</strong></p>
                      </div>

                      {/* Detailed list with rates inside columns */}
                      <table className="w-full text-[8.5px] font-sans">
                        <thead>
                          <tr className="border-b border-black font-extrabold text-black">
                            <th className="py-1 text-left">Tên hàng</th>
                            <th className="py-1 text-center">SL</th>
                            <th className="py-1 text-right">Tổng cộng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsList.map((detail: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="py-1">
                                <p className="font-bold text-slate-900">{detail.tenSP}</p>
                                <p className="text-[7.5px] text-slate-600 font-semibold">{formatVND(detail.donGia || detail.donGiaNhap)} / cái</p>
                              </td>
                              <td className="py-1 text-center font-bold">{detail.soLuong}</td>
                              <td className="py-1 text-right font-black">{formatVND(detail.thanhTien)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Totals right positioned summary card */}
                      <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5 text-right text-[8.5px] font-sans">
                        <p>Cộng khoản: <strong>{formatVND(item.tongTien + (invoice?.giamGia || 0))}</strong></p>
                        {isInvoice && (invoice?.giamGia || 0) > 0 && (
                          <p className="text-rose-600 font-semibold">Khấu trừ: -{formatVND(invoice?.giamGia || 0)}</p>
                        )}
                        <p className="text-[10px] font-black text-black">THÀNH TOÁN: <span>{formatVND(item.tongTien)}</span></p>
                        <p className="text-emerald-700 font-bold">Khách trả tiền: {formatVND(item.daTra)}</p>
                        <p className="text-rose-700 font-extrabold">Còn nợ lại: {formatVND(item.conNo)}</p>
                      </div>

                      {/* Social media contact badges at footer as in Screenshot #8 */}
                      <div className="pt-2 border-t border-slate-200/80 text-center text-[7.5px] space-y-1 text-slate-700 font-bold">
                        <p>🔵 Zalo: {customPhone}</p>
                        <p>🌐 FB: Hộ Kinh Doanh Phong Hưng</p>
                        <p>📞 SĐT: {customPhone}</p>
                      </div>

                      {/* Custom footer message */}
                      <div className="text-center text-[8px] text-slate-500 italic pt-1 border-t border-dotted border-slate-300">
                        {customFooterNote}
                      </div>
                    </div>
                  );
                }

                // ------------------------------------
                // TEMPLATE k80_01: THERMAL 80MM RECEIPTS STYLE
                // ------------------------------------
                if (selectedTemplate === 'k80_01') {
                  return (
                    <div className="space-y-3 font-sans text-xs">
                      {/* Thermal 8cm wide design */}
                      <div className="text-center pb-2 border-b border-slate-300">
                        {renderPrintLogoHelper("w-10 h-10 mx-auto mb-1", true)}
                        <h2 className="text-[13px] font-black uppercase tracking-tight leading-normal">{customShopName}</h2>
                        <p className="text-[10px] text-slate-600">{customAddress}</p>
                        <p className="text-[10px] text-slate-600 font-bold">SĐT: {customPhone}</p>
                      </div>

                      <div className="text-center my-2">
                        <h1 className="text-sm font-extrabold tracking-widest text-black uppercase">{finalTitle}</h1>
                        <p className="text-[9px] text-slate-500 mt-0.5">Số phiếu: <strong>{docId}</strong></p>
                        <p className="text-[9px] text-slate-500">Ngày lập: {formatDate(docDate)}</p>
                      </div>

                      {/* Customer / Employee row */}
                      <div className="text-[10.5px] space-y-0.5 pb-2 border-b border-dashed border-slate-300 text-slate-700">
                        <p>Khách hàng: <strong className="text-black">{isInvoice ? invoice?.tenKH : 'Khách vãng lai'}</strong></p>
                        <p>Điện thoại: <span>{isInvoice ? invoice?.sdtKH : '-'}</span></p>
                        <p>Lập phiếu: <span>{item.nhanVien}</span></p>
                      </div>

                      {/* Items grid */}
                      <table className="w-full text-[10.5px] mt-2 print-table">
                        <thead>
                          <tr className="border-b-2 border-slate-900 font-bold text-black text-[9px] uppercase">
                            <th className="py-1.5 text-left">Tên sản phẩm</th>
                            <th className="py-1.5 text-center">SL</th>
                            <th className="py-1.5 text-right">Đơn giá</th>
                            <th className="py-1.5 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsList.map((detail: any, idx: number) => (
                            <tr key={idx} className="border-b border-dashed border-slate-200">
                              <td className="py-2 text-slate-800 max-w-[130px] truncate font-semibold">{detail.tenSP}</td>
                              <td className="py-2 text-center text-slate-950 font-bold">{detail.soLuong}</td>
                              <td className="py-2 text-right">{formatVND(detail.donGia || detail.donGiaNhap)}</td>
                              <td className="py-2 text-right text-black font-extrabold">{formatVND(detail.thanhTien)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Balance totals right aligned */}
                      <div className="space-y-1.5 text-[10.5px] pt-2 border-t border-slate-900 font-sans text-right">
                        <p>Cộng tiền hàng: <span className="font-semibold">{formatVND(item.tongTien + (invoice?.giamGia || 0))}</span></p>
                        {isInvoice && (invoice?.giamGia || 0) > 0 && (
                          <p className="text-rose-600">Đã khấu trừ: -{formatVND(invoice?.giamGia || 0)}</p>
                        )}
                        <p className="text-xs font-black text-black uppercase">TỔNG SỐ TIỀN TRẢ: <span className="text-rose-600 font-mono text-sm">{formatVND(item.tongTien)}</span></p>
                        <p className="text-emerald-700">Khách đã thanh toán: <strong>{formatVND(item.daTra)}</strong></p>
                        <p className="text-rose-700 font-bold">Còn nợ ghi sổ: <strong>{formatVND(item.conNo)}</strong></p>
                      </div>

                      {/* Custom footer message */}
                      <div className="text-center pt-3 border-t border-dashed border-slate-200 text-[9.5px] text-slate-500 italic mt-4 font-sans">
                        <p>{customFooterNote}</p>
                        <p className="mt-1 text-[8px] text-slate-400 font-bold">Phong Hưng Thermal Roll System 80mm</p>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-350 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
            >
              Hủy / Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" /> IN PHIẾU ({selectedTemplate.toUpperCase()})
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
