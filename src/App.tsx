/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ShoppingCart, 
  FolderInput, 
  Package, 
  Users, 
  Truck, 
  FileText, 
  BarChart, 
  Settings, 
  Menu, 
  Bell, 
  LogOut,
  ChevronDown,
  Check,
  X,
  Eye,
  EyeOff,
  ShieldAlert,
  KeyRound,
  Calendar,
  Clock,
  Zap,
  UserPlus,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  initialProducts, 
  initialInventory, 
  initialCustomers, 
  initialSuppliers, 
  initialInvoices, 
  initialImportSlips, 
  initialStaffs, 
  initialSettings 
} from './initialData';
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
} from './types';

// Importing Tab Components
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Imports from './components/Imports';
import InventoryList from './components/InventoryList';
import Customers from './components/Customers';
import InvoicesList from './components/InvoicesList';
import Reports from './components/Reports';
import SettingsStaff from './components/SettingsStaff';
import PrintModal from './components/PrintModal';
import { extractDominantColor, adjustHueAndLightness } from './utils';

const vndiWeeks = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export default function App() {
  // Navigation active tab State (default: dashboard)
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Unified persistent State engine with local storage backup
  const [products, setProducts] = useState<Product[]>(() => {
    const backup = localStorage.getItem('phpos_products');
    return backup ? JSON.parse(backup) : initialProducts;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const backup = localStorage.getItem('phpos_inventory');
    return backup ? JSON.parse(backup) : initialInventory;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const backup = localStorage.getItem('phpos_customers');
    return backup ? JSON.parse(backup) : initialCustomers;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const backup = localStorage.getItem('phpos_suppliers');
    return backup ? JSON.parse(backup) : initialSuppliers;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const backup = localStorage.getItem('phpos_invoices');
    return backup ? JSON.parse(backup) : initialInvoices;
  });

  const [importSlips, setImportSlips] = useState<ImportSlip[]>(() => {
    const backup = localStorage.getItem('phpos_import_slips');
    return backup ? JSON.parse(backup) : initialImportSlips;
  });

  const [staffs, setStaffs] = useState<Staff[]>(() => {
    const backup = localStorage.getItem('phpos_staffs');
    return backup ? JSON.parse(backup) : initialStaffs;
  });

  const [activeStaffId, setActiveStaffId] = useState<string>(() => {
    const backup = localStorage.getItem('phpos_staff_id');
    return backup ? backup : 'NV001'; // Default: Admin
  });

  const [loggedInStaffId, setLoggedInStaffId] = useState<string | null>(() => {
    const backup = localStorage.getItem('phpos_logged_in_staff_id');
    return backup ? backup : 'NV001'; // Default auto-logged in, but has real logins
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => {
    const backup = localStorage.getItem('phpos_security_logs');
    if (backup) return JSON.parse(backup);
    return [
      {
        id: 'L001',
        userId: 'NV001',
        userName: 'Nguyễn Văn Admin',
        action: 'UPDATE_SETTINGS',
        description: 'Khởi tạo hệ thống quản lý Phong Hưng POS',
        createdAt: '2026-05-30T08:00:00Z'
      }
    ];
  });

  // Security actions helper
  const addSecurityLog = (
    action: SecurityLog['action'],
    description: string,
    targetUserId?: string
  ) => {
    const actStaff = staffs.find(s => s.id === (loggedInStaffId || activeStaffId)) || staffs[0];
    const newLog: SecurityLog = {
      id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId: actStaff ? actStaff.id : 'SYSTEM',
      userName: actStaff ? actStaff.tenNV : 'Hệ thống',
      action,
      targetUserId,
      description,
      createdAt: new Date().toISOString()
    };
    setSecurityLogs(prev => [newLog, ...prev]);
  };

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const backup = localStorage.getItem('phpos_settings');
    return backup ? JSON.parse(backup) : initialSettings;
  });

  // Login input states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Profile overlay / Modal actions
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileDetailsOpen, setIsProfileDetailsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Password fields
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  // Password change fields (mandatory first time)
  const [mustCurrentPass, setMustCurrentPass] = useState('');
  const [mustNewPass, setMustNewPass] = useState('');
  const [mustConfirmNewPass, setMustConfirmNewPass] = useState('');

  // Print Popup states
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printedInvoice, setPrintedInvoice] = useState<Invoice | undefined>(undefined);
  const [printedImportSlip, setPrintedImportSlip] = useState<ImportSlip | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<'a5_01' | 'a5_02' | 'k58_01' | 'k58_02' | 'k80_01'>('a5_01');
  const [isDraftPrint, setIsDraftPrint] = useState(false);

  // Quick Header Logo/Title Editing
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickLogoInitials, setQuickLogoInitials] = useState('');
  const [quickSystemTitle, setQuickSystemTitle] = useState('');
  const [quickLogoName, setQuickLogoName] = useState('');
  const [quickLogoImage, setQuickLogoImage] = useState('');

  // BRAND LOGO CUSTOMIZATION MODEL STATES
  const [isLogoCustomizerOpen, setIsLogoCustomizerOpen] = useState(false);
  const [logoCustomType, setLogoCustomType] = useState<'default' | 'flames' | 'chef' | 'shield' | 'crown' | 'inductor' | 'image'>('default');
  const [logoCustomImage, setLogoCustomImage] = useState('');
  const [logoCustomShape, setLogoCustomShape] = useState<'circle' | 'squircle' | 'hexagon'>('circle');
  const [logoCustomColor, setLogoCustomColor] = useState('#E11D48');
  const [logoCustomGlow, setLogoCustomGlow] = useState(true);
  const [logoCustomBorderWidth, setLogoCustomBorderWidth] = useState(3);
  const [logoCustomShow, setLogoCustomShow] = useState(false);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<'icon' | 'style' | 'text'>('icon');

  const openLogoCustomizer = () => {
    setLogoCustomType(settings.brandLogoType || 'default');
    setLogoCustomImage(settings.brandLogoImage || settings.logoImage || '');
    setLogoCustomShape(settings.brandLogoShape || 'circle');
    setLogoCustomColor(settings.brandLogoColor || '#E11D48');
    setLogoCustomGlow(settings.brandLogoGlow !== false);
    setLogoCustomBorderWidth(settings.brandLogoBorderWidth !== undefined ? settings.brandLogoBorderWidth : 3);
    setLogoCustomShow(settings.showBrandLogo !== false);
    setQuickLogoName(settings.logoName || 'PHONG HƯNG');
    setQuickSystemTitle(settings.systemTitle || 'Chất lượng tạo niềm tin');
    setQuickLogoInitials(settings.logoInitials || 'PH');
    setActiveCustomizerTab('icon');
    setIsLogoCustomizerOpen(true);
  };

  const handleSaveLogoCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: SystemSettings = {
      ...settings,
      brandLogoType: logoCustomType,
      brandLogoImage: logoCustomImage,
      brandLogoShape: logoCustomShape,
      brandLogoColor: logoCustomColor,
      brandLogoGlow: logoCustomGlow,
      brandLogoBorderWidth: logoCustomBorderWidth,
      showBrandLogo: logoCustomShow,
      logoName: quickLogoName,
      systemTitle: quickSystemTitle,
      logoInitials: quickLogoInitials,
      logoImage: logoCustomType === 'image' ? logoCustomImage : undefined
    };
    setSettings(updatedSettings);
    showToast('Cập nhật biểu tượng thương hiệu thành công!', 'success');
    addSecurityLog('UPDATE_SETTINGS', 'Cập nhật kiểu dáng & biểu tượng logo thương hiệu mới');
    setIsLogoCustomizerOpen(false);
  };

  const handleLogoCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Vui lòng tải lên tệp tin dạng hình ảnh!");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Kích thước tệp tin quá lớn! Vui lòng chọn ảnh dung lượng dưới 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoCustomImage(reader.result);
        setLogoCustomType('image'); // Automatically focus on custom image when uploaded
      }
    };
    reader.readAsDataURL(file);
  };

  const openQuickHeaderEdit = () => {
    setQuickLogoInitials(settings.logoInitials || 'PH');
    setQuickSystemTitle(settings.systemTitle || 'Hệ Thống Quản Lý Hộ Kinh Doanh');
    setQuickLogoName(settings.logoName || 'PHONG HƯNG');
    setQuickLogoImage(settings.logoImage || '');
    setIsQuickEditOpen(true);
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      logoInitials: quickLogoInitials,
      systemTitle: quickSystemTitle,
      logoName: quickLogoName,
      logoImage: quickLogoImage
    };
    setSettings(updatedSettings);
    showToast('Cập nhật logo và tiêu đề thành công!', 'success');
    setIsQuickEditOpen(false);
  };

  const handleQuickImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Vui lòng tải lên tệp tin dạng hình ảnh!");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Kích thước tệp tin quá lớn! Vui lòng chọn ảnh dung lượng dưới 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQuickLogoImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderHeaderLogoSVG = (className = "w-12 h-12", customSet?: {
    brandLogoType?: 'default' | 'flames' | 'chef' | 'shield' | 'crown' | 'inductor' | 'image';
    brandLogoShape?: 'circle' | 'squircle' | 'hexagon';
    brandLogoColor?: string;
    brandLogoGlow?: boolean;
    brandLogoBorderWidth?: number;
    brandLogoImage?: string;
    logoInitials?: string;
  }) => {
    const logoType = customSet?.brandLogoType || settings.brandLogoType || 'default';
    const logoShape = customSet?.brandLogoShape || settings.brandLogoShape || 'circle';
    const logoColor = customSet?.brandLogoColor || settings.brandLogoColor || '#E11D48';
    const isGlow = customSet?.brandLogoGlow !== undefined ? customSet.brandLogoGlow : (settings.brandLogoGlow !== false);
    const strokeWidth = customSet?.brandLogoBorderWidth !== undefined ? customSet.brandLogoBorderWidth : (settings.brandLogoBorderWidth !== undefined ? settings.brandLogoBorderWidth : 3);
    const logoImage = customSet?.brandLogoImage !== undefined ? customSet.brandLogoImage : (settings.brandLogoImage || settings.logoImage);
    const initials = customSet?.logoInitials || settings.logoInitials || 'PH';

    // Outer border style
    const borderStyle = {
      stroke: logoColor,
      strokeWidth: strokeWidth,
      fill: 'white',
      transition: 'all 0.3s ease'
    };

    const logoStyle: React.CSSProperties = {
      filter: isGlow ? `drop-shadow(0 0 6.5px ${logoColor}bb)` : 'none',
      transition: 'all 0.3s ease'
    };

    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className} 
        style={logoStyle}
        id="header-brand-logo-svg"
      >
        <defs>
          <linearGradient id="flameGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={logoColor} />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="flameGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor={logoColor} />
          </linearGradient>
          
          <clipPath id="logo-clip-circle">
            <circle cx="50" cy="50" r={48 - strokeWidth} />
          </clipPath>
          <clipPath id="logo-clip-squircle">
            <path d="M 25,10 C 50,10 50,10 75,10 C 90,10 90,20 90,50 C 90,80 90,80 75,90 C 50,90 50,90 25,90 C 10,90 10,80 10,50 C 10,20 10,10 25,10 Z" />
          </clipPath>
          <clipPath id="logo-clip-hexagon">
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
            clipPath={`url(#logo-clip-${logoShape})`} 
            preserveAspectRatio="xMidYMid slice" 
          />
        ) : logoType === 'flames' ? (
          <g transform="translate(10, 10) scale(0.8)">
            <path d="M 50,5 C 65,30 80,45 80,65 C 80,82 66,95 50,95 C 34,95 20,82 20,65 C 20,45 35,30 50,5 Z" fill="url(#flameGrad1)" />
            <path d="M 50,25 C 60,42 70,55 70,70 C 70,82 61,90 50,90 C 39,90 30,82 30,70 C 30,55 40,42 50,25 Z" fill="url(#flameGrad2)" />
            <path d="M 50,45 C 55,55 60,65 60,75 C 60,82 55,87 50,87 C 45,87 40,82 40,75 C 40,65 45,55 50,45 Z" fill="#FBBF24" />
          </g>
        ) : logoType === 'chef' ? (
          <g transform="translate(18, 16) scale(0.65)" stroke={logoColor} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 20,68 C 15,68 12,62 15,55 C 10,48 15,35 25,38 C 30,20 50,15 60,25 C 75,18 88,32 82,46 C 88,54 85,68 70,68 Z" />
            <path d="M 25,68 L 75,68 L 70,85 L 30,85 Z" fill={logoColor} fillOpacity="0.1" />
            <line x1="33" y1="76" x2="67" y2="76" />
            <path d="M 50,38 L 53,46 L 61,46 L 54,51 L 57,59 L 50,54 L 43,59 L 46,51 L 39,46 L 47,46 Z" fill={logoColor} stroke="none" />
          </g>
        ) : logoType === 'shield' ? (
          <g transform="translate(18, 15) scale(0.65)" stroke={logoColor} fill="none" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 12,10 L 50,2 L 88,10 C 88,45 70,75 50,95 C 30,75 12,45 12,10 Z" fill={logoColor} fillOpacity="0.1" />
            <path d="M 50,25 L 50,70 Q 50,82 50,82" strokeWidth="6" />
            <path d="M 32,45 L 68,45" strokeWidth="6" />
          </g>
        ) : logoType === 'crown' ? (
          <g transform="translate(15, 15) scale(0.7)" stroke={logoColor} fill="none" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 10,75 L 20,40 L 40,55 L 50,25 L 60,55 L 80,40 L 90,75 Z" fill={logoColor} fillOpacity="0.1" />
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
            <circle cx="50" cy="50" r="46" fill="white" stroke="#e11d48" strokeWidth="3" />
            <path d="M 12,50 C 35,20 65,80 88,50 C 75,75 25,75 12,50 Z" fill="#e11d48" />
            <path d="M 12,50 C 35,40 65,60 88,50 C 75,85 25,85 12,50 Z" fill="#111827" />
            <path d="M 15,58 C 35,50 65,70 85,58 C 75,90 25,90 15,58 Z" fill="#f59e0b" />
            <text x="50" y="44" fontFamily="sans-serif" fontWeight="900" fontSize="16" fill="#111827" textAnchor="middle">{initials}</text>
            <path id="header_curve_emblem" d="M 18,34 A 32,32 0 0,1 82,34" fill="none" />
            <text className="font-bold tracking-widest font-sans" style={{ fill: '#e11d48', fontSize: '7px' }} textAnchor="middle">
              <textPath href="#header_curve_emblem" startOffset="50%">PHONG HUNG</textPath>
            </text>
            <text x="50" y="88" fontFamily="sans-serif" fontWeight="800" fontSize="7" fill="#e11d48" letterSpacing="0.5" textAnchor="middle">GERMANY</text>
          </>
        )}
      </svg>
    );
  };

  // Toast notifications State
  interface ToastState {
    id: string;
    message: string;
    type: 'success' | 'info' | 'error';
  }
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Active Personnel User info
  const activeStaff = staffs.find(s => s.id === (loggedInStaffId || activeStaffId)) || staffs[0];

  // Live Clock & Calendar State for beautiful header widgets
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Backup State variations to browser LocalStorage automatically
  useEffect(() => {
    localStorage.setItem('phpos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('phpos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('phpos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('phpos_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('phpos_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('phpos_import_slips', JSON.stringify(importSlips));
  }, [importSlips]);

  useEffect(() => {
    localStorage.setItem('phpos_staff_id', activeStaffId);
  }, [activeStaffId]);

  useEffect(() => {
    if (loggedInStaffId) {
      localStorage.setItem('phpos_logged_in_staff_id', loggedInStaffId);
    } else {
      localStorage.removeItem('phpos_logged_in_staff_id');
    }
  }, [loggedInStaffId]);

  useEffect(() => {
    localStorage.setItem('phpos_staffs', JSON.stringify(staffs));
  }, [staffs]);

  useEffect(() => {
    localStorage.setItem('phpos_security_logs', JSON.stringify(securityLogs));
  }, [securityLogs]);

  useEffect(() => {
    localStorage.setItem('phpos_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const applyTheme = () => {
      const mode = settings.themeMode || 'light';
      let isDark = false;
      if (mode === 'dark') {
        isDark = true;
      } else if (mode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if ((settings.themeMode || 'light') === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.themeMode]);

  // Dynamic Theme Colors configuration backed by CSS custom properties and Logo matching!
  useEffect(() => {
    const updateThemePalette = async () => {
      let primaryColor = '#dc2626'; // default phong hung red
      
      const themeColorsMap = {
        red: '#dc2626',
        indigo: '#4f46e5',
        amber: '#d97706',
        emerald: '#059669'
      };

      if (settings.useLogoTheme && settings.logoImage) {
        try {
          const extracted = await extractDominantColor(settings.logoImage);
          if (extracted) {
            primaryColor = extracted;
          }
        } catch (e) {
          console.warn('Fallback settings theme color', e);
          primaryColor = themeColorsMap[settings.themeColor] || themeColorsMap.red;
        }
      } else {
        primaryColor = themeColorsMap[settings.themeColor] || themeColorsMap.red;
      }

      const primaryHover = adjustHueAndLightness(primaryColor, -0.15);
      const primaryLight = `${primaryColor}14`; // ~8% opacity

      const root = document.documentElement;
      root.style.setProperty('--theme-primary', primaryColor);
      root.style.setProperty('--theme-primary-hover', primaryHover);
      root.style.setProperty('--theme-primary-light', primaryLight);
    };

    updateThemePalette();
  }, [settings.logoImage, settings.useLogoTheme, settings.themeColor]);

  const activeAccent = {
    primary: 'bg-theme-primary',
    hover: 'hover:bg-theme-primary-hover',
    text: 'text-theme-primary',
    borderBg: 'border-theme-primary',
    lightBg: 'bg-theme-light',
    accentText: 'text-theme-accent',
    focusRing: 'focus:ring-theme'
  };

  // 1. SAVE COMPLETED INVOICE & TRANSACT INVENTORY / CUSTOMERS DEBTS
  const handleSaveInvoice = (newInvoice: Invoice) => {
    // Generate actual ID from present state safely (hd prefix + sequence)
    const nextInvoiceNum = invoices.length + 1;
    const realMaHD = `${settings.prefixHD}${String(nextInvoiceNum).padStart(6, '0')}`;
    
    // Patch invoice object details with actual sequence ID
    const updatedInvoice: Invoice = {
      ...newInvoice,
      maHD: realMaHD,
      details: newInvoice.details.map(det => ({ ...det, maHD: realMaHD }))
    };

    // a) Save record
    setInvoices(prev => [updatedInvoice, ...prev]);

    // b) Subtract from Inventory
    setInventory(prev => prev.map(invItem => {
      const soldDetail = updatedInvoice.details.find(d => d.maSP === invItem.maSP);
      if (soldDetail) {
        const nextStock = invItem.tonHienTai - soldDetail.soLuong;
        let nextState: InventoryItem['trangThai'] = 'Đủ hàng';
        if (nextStock < 0) nextState = 'Âm kho';
        else if (nextStock === 0) nextState = 'Hết hàng';
        else if (nextStock <= invItem.tonToiThieu) nextState = 'Sắp hết';

        return {
          ...invItem,
          tongBan: invItem.tongBan + soldDetail.soLuong,
          tonHienTai: nextStock,
          trangThai: nextState
        };
      }
      return invItem;
    }));

    // c) Increment Customer totals and debt records
    setCustomers(prev => prev.map(c => {
      if (c.maKH === updatedInvoice.maKH) {
        return {
          ...c,
          tongTien: c.tongTien + updatedInvoice.tongTien,
          daTra: c.daTra + updatedInvoice.daTra,
          conNo: c.conNo + updatedInvoice.conNo
        };
      }
      return c;
    }));

    // d) Launch Print receipts drawer
    setPrintedImportSlip(undefined);
    setPrintedInvoice(updatedInvoice);
    setIsPrintOpen(true);
  };

  // 2. SAVE IMPORT SLIP & INCREASE STOCK / REGISTER DEBTS TO SUPPLIER
  const handleSaveImportSlip = (newSlip: ImportSlip) => {
    const nextSlipNum = importSlips.length + 1;
    const realMaPN = `${settings.prefixPN}${String(nextSlipNum).padStart(6, '0')}`;

    const updatedSlip: ImportSlip = {
      ...newSlip,
      maPN: realMaPN,
      details: newSlip.details.map(det => ({ ...det, maPN: realMaPN }))
    };

    // a) Save record
    setImportSlips(prev => [updatedSlip, ...prev]);

    // b) Supply inventory item additions
    setInventory(prev => prev.map(invItem => {
      const importedDetail = updatedSlip.details.find(d => d.maSP === invItem.maSP);
      if (importedDetail) {
        const nextStock = invItem.tonHienTai + importedDetail.soLuong;
        let nextState: InventoryItem['trangThai'] = 'Đủ hàng';
        if (nextStock < 0) nextState = 'Âm kho';
        else if (nextStock === 0) nextState = 'Hết hàng';
        else if (nextStock <= invItem.tonToiThieu) nextState = 'Sắp hết';

        return {
          ...invItem,
          tongNhap: invItem.tongNhap + importedDetail.soLuong,
          tonHienTai: nextStock,
          trangThai: nextState
        };
      }
      return invItem;
    }));

    // c) Increase debt values on selected Suppliers
    setSuppliers(prev => prev.map(s => {
      if (s.maNCC === updatedSlip.maNCC) {
        return {
          ...s,
          tongNhap: s.tongNhap + updatedSlip.tongTien,
          daTra: s.daTra + updatedSlip.daTra,
          conNo: s.conNo + updatedSlip.conNo
        };
      }
      return s;
    }));

    // d) Launch Print receipt
    setPrintedInvoice(undefined);
    setPrintedImportSlip(updatedSlip);
    setIsPrintOpen(true);
  };

  // 3. SECURELY REVERT CANCELLED INVOICE TRANSACTION (ADMIN AUTHORIZED)
  const handleCancelInvoice = (maHD: string, reason: string, staffName: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.maHD === maHD) {
        // Find and revert details
        const revertedInvoice = {
          ...inv,
          trangThai: 'Đã hủy' as const,
          lyDoHuy: reason,
          nguoiHuy: staffName,
          ngayHuy: new Date().toISOString()
        };

        // Revert Stock counters
        setInventory(prevInv => prevInv.map(invItem => {
          const detail = revertedInvoice.details.find(d => d.maSP === invItem.maSP);
          if (detail) {
            // Subtract from sold quantity, add back to stock!
            const nextStock = invItem.tonHienTai + detail.soLuong;
            let nextState: InventoryItem['trangThai'] = 'Đủ hàng';
            if (nextStock < 0) nextState = 'Âm kho';
            else if (nextStock === 0) nextState = 'Hết hàng';
            else if (nextStock <= invItem.tonToiThieu) nextState = 'Sắp hết';

            return {
              ...invItem,
              tongBan: Math.max(0, invItem.tongBan - detail.soLuong),
              tonHienTai: nextStock,
              trangThai: nextState
            };
          }
          return invItem;
        }));

        // Revert Customer financial accounts
        setCustomers(prevCust => prevCust.map(c => {
          if (c.maKH === revertedInvoice.maKH) {
            return {
              ...c,
              tongTien: Math.max(0, c.tongTien - revertedInvoice.tongTien),
              daTra: Math.max(0, c.daTra - revertedInvoice.daTra),
              conNo: Math.max(0, c.conNo - revertedInvoice.conNo)
            };
          }
          return c;
        }));

        return revertedInvoice;
      }
      return inv;
    }));
  };

  // 4. SECURELY REVERT CANCELLED GOOD IMPORT SLIP
  const handleCancelImportSlip = (maPN: string, reason: string, staffName: string) => {
    setImportSlips(prev => prev.map(slip => {
      if (slip.maPN === maPN) {
        const revertedSlip = {
          ...slip,
          trangThai: 'Đã hủy' as const,
          lyDoHuy: reason,
          nguoiHuy: staffName,
          ngayHuy: new Date().toISOString()
        };

        // Subtract received stocking
        setInventory(prevInv => prevInv.map(invItem => {
          const detail = revertedSlip.details.find(d => d.maSP === invItem.maSP);
          if (detail) {
            const nextStock = invItem.tonHienTai - detail.soLuong;
            let nextState: InventoryItem['trangThai'] = 'Đủ hàng';
            if (nextStock < 0) nextState = 'Âm kho';
            else if (nextStock === 0) nextState = 'Hết hàng';
            else if (nextStock <= invItem.tonToiThieu) nextState = 'Sắp hết';

            return {
              ...invItem,
              tongNhap: Math.max(0, invItem.tongNhap - detail.soLuong),
              tonHienTai: nextStock,
              trangThai: nextState
            };
          }
          return invItem;
        }));

        // Subtract Supplier values & remove recorded debt
        setSuppliers(prevSup => prevSup.map(s => {
          if (s.maNCC === revertedSlip.maNCC) {
            return {
              ...s,
              tongNhap: Math.max(0, s.tongNhap - revertedSlip.tongTien),
              daTra: Math.max(0, s.daTra - revertedSlip.daTra),
              conNo: Math.max(0, s.conNo - revertedSlip.conNo)
            };
          }
          return s;
        }));

        return revertedSlip;
      }
      return slip;
    }));
  };

  // 5. IN-PLACE NEW PRODUCT REGISTERER BACK TO POOL IN IMPORTER/CATALOGUE
  const handleAddNewProduct = (newProduct: Product, initialQty: number) => {
    // Save to product catalog
    setProducts(prev => [...prev, newProduct]);

    // Save corresponding Inventory Item track row
    const newInvItem: InventoryItem = {
      maSP: newProduct.maSP,
      tenSP: newProduct.tenSP,
      tonDau: initialQty,
      tongNhap: 0,
      tongBan: 0,
      tonHienTai: initialQty,
      tonToiThieu: 5,
      trangThai: initialQty === 0 ? 'Hết hàng' : initialQty <= 5 ? 'Sắp hết' : 'Đủ hàng'
    };
    setInventory(prev => [...prev, newInvItem]);
  };

  // Sửa thông tin hàng hóa
  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.maSP === updatedProduct.maSP ? updatedProduct : p));
    setInventory(prev => prev.map(inv => 
      inv.maSP === updatedProduct.maSP ? { ...inv, tenSP: updatedProduct.tenSP } : inv
    ));
  };

  // COLLECT DEBT PAYMENTS FROM CUSTOMER
  const handleCollectCustomerDebt = (maKH: string, amount: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.maKH === maKH) {
        return {
          ...c,
          daTra: c.daTra + amount,
          conNo: Math.max(0, c.conNo - amount)
        };
      }
      return c;
    }));
  };

  // PAY REMAINING BALANCE PAYABLES TO SUPPLIERS
  const handlePaySupplierDebt = (maNCC: string, amount: number) => {
    setSuppliers(prev => prev.map(s => {
      if (s.maNCC === maNCC) {
        return {
          ...s,
          daTra: s.daTra + amount,
          conNo: Math.max(0, s.conNo - amount)
        };
      }
      return s;
    }));
  };

  // Add new customer & Supplier
  const handleAddNewCustomerObject = (c: Customer) => {
    setCustomers(prev => [...prev, c]);
  };

  const handleAddNewSupplierObject = (s: Supplier) => {
    setSuppliers(prev => [...prev, s]);
  };

  // Fast Print triggering helper
  const handleOpenPrintInvoice = (inv: Invoice) => {
    setPrintedImportSlip(undefined);
    setPrintedInvoice(inv);
    setIsPrintOpen(true);
  };

  const handleOpenPrintImport = (slip: ImportSlip) => {
    setPrintedInvoice(undefined);
    setPrintedImportSlip(slip);
    setIsPrintOpen(true);
  };

  // --- REAL LOGIN SECURITY CONTROLS ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizeUser = loginUsername.trim().toLowerCase();
    const st = staffs.find(s => (s.username || '').toLowerCase() === normalizeUser);
    
    if (!st) {
      alert("Tên đăng nhập không tồn tại!");
      return;
    }

    if (st.password !== loginPassword) {
      alert("Mật khẩu không chính xác!");
      return;
    }

    const currentStStatus = st.status || (st.active ? 'ACTIVE' : 'LOCKED');
    if (currentStStatus === 'LOCKED') {
      alert("Tài khoản của bạn hiện đang bị khóa! Vui lòng liên hệ Admin để mở khóa.");
      return;
    }

    if (currentStStatus === 'LEFT') {
      alert("Tài khoản này thuộc về nhân viên đã nghỉ việc.");
      return;
    }

    // Success login!
    setLoggedInStaffId(st.id);
    setActiveStaffId(st.id);
    localStorage.setItem('phpos_logged_in_staff_id', st.id);
    localStorage.setItem('phpos_staff_id', st.id);

    // Update login date
    const updatedStaffs = staffs.map(item => {
      if (item.id === st.id) {
        return { ...item, lastLoginAt: new Date().toISOString() };
      }
      return item;
    });
    setStaffs(updatedStaffs);

    // Add security log
    const newLog: SecurityLog = {
      id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId: st.id,
      userName: st.tenNV,
      action: 'LOGIN',
      description: `Đăng nhập thành công từ giao diện xác thực. Mức vai trò: ${st.vaiTro}`,
      createdAt: new Date().toISOString()
    };
    setSecurityLogs(prev => [newLog, ...prev]);

    setLoginUsername('');
    setLoginPassword('');
    showToast(`Đăng nhập thành công! Chào ${st.tenNV}`, 'success');
  };

  const handleLogout = () => {
    if (loggedInStaffId) {
      const st = staffs.find(s => s.id === loggedInStaffId) || staffs[0];
      const newLog: SecurityLog = {
        id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        userId: st.id,
        userName: st.tenNV,
        action: 'LOGOUT',
        description: `Đăng xuất tài khoản khỏi hệ thống`,
        createdAt: new Date().toISOString()
      };
      setSecurityLogs(prev => [newLog, ...prev]);
    }
    setLoggedInStaffId(null);
    localStorage.removeItem('phpos_logged_in_staff_id');
    setIsProfileMenuOpen(false);
    showToast('Đăng xuất thành công!', 'info');
  };

  const handleMustChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mustCurrentPass !== activeStaff.password) {
      alert("Mật khẩu hiện tại không điền đúng!");
      return;
    }
    if (mustNewPass.length < 6) {
      alert("Mật khẩu mới phải có tối thiểu 6 ký tự!");
      return;
    }
    if (mustNewPass !== mustConfirmNewPass) {
      alert("Nhập lại mật khẩu mới không trùng khớp!");
      return;
    }
    if (mustNewPass === activeStaff.password) {
      alert("Mật khẩu mới không được trùng với mật khóa mặc định hiện tại!");
      return;
    }

    // Success, update password
    const updatedStaffs = staffs.map(s => {
      if (s.id === activeStaff.id) {
        return {
          ...s,
          password: mustNewPass,
          mustChangePassword: false
        };
      }
      return s;
    });
    setStaffs(updatedStaffs);

    const newLog: SecurityLog = {
      id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId: activeStaff.id,
      userName: activeStaff.tenNV,
      action: 'CHANGE_PASSWORD',
      targetUserId: activeStaff.id,
      description: 'Thay đổi mật khẩu đăng nhập bắt buộc lần đầu thành công',
      createdAt: new Date().toISOString()
    };
    setSecurityLogs(prev => [newLog, ...prev]);

    setMustCurrentPass('');
    setMustNewPass('');
    setMustConfirmNewPass('');
    showToast('Đổi mật khẩu bảo mật thành công! Đã cấp quyền truy cập hệ thống.', 'success');
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== activeStaff.password) {
      alert("Mật khẩu hiện tại không chính xác!");
      return;
    }
    if (newPass.length < 6) {
      alert("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }
    if (newPass !== confirmNewPass) {
      alert("Lặp lại mật khẩu mới không chính xác!");
      return;
    }
    if (newPass === activeStaff.password) {
      alert("Mật khẩu mới phải khác với mật khẩu cũ hiện tại!");
      return;
    }

    const updatedStaffs = staffs.map(s => {
      if (s.id === activeStaff.id) {
        return {
          ...s,
          password: newPass,
          mustChangePassword: false
        };
      }
      return s;
    });
    setStaffs(updatedStaffs);

    const newLog: SecurityLog = {
      id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId: activeStaff.id,
      userName: activeStaff.tenNV,
      action: 'CHANGE_PASSWORD',
      targetUserId: activeStaff.id,
      description: 'Đổi mật khẩu cá nhân thành công qua cài đặt người dùng',
      createdAt: new Date().toISOString()
    };
    setSecurityLogs(prev => [newLog, ...prev]);

    setCurrentPass('');
    setNewPass('');
    setConfirmNewPass('');
    setIsChangePasswordOpen(false);
    showToast('Đổi mật khẩu tài khoản thành công!', 'success');
  };

  const handleSwitchStaff = (sid: string) => {
    setActiveStaffId(sid);
    setLoggedInStaffId(sid);
    localStorage.setItem('phpos_logged_in_staff_id', sid);
    localStorage.setItem('phpos_staff_id', sid);
    
    const targetSt = staffs.find(s => s.id === sid);
    if (targetSt) {
      const newLog: SecurityLog = {
        id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        userId: targetSt.id,
        userName: targetSt.tenNV,
        action: 'LOGIN',
        description: `Chuyển nhanh phiên đăng nhập qua bảng Phân Quyền Giả Lập.`,
        createdAt: new Date().toISOString()
      };
      setSecurityLogs(prev => [newLog, ...prev]);
      showToast(`Đã chuyển sang đóng vai ${targetSt.tenNV}!`, 'info');
    }
  };

  // Roles Failsafe validations for sales / reports tabs
  const isWarehouseStaffOnly = activeStaff.vaiTro === 'Nhân viên kho';

  if (!loggedInStaffId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-800 bg-radial from-white to-slate-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Top Brand Banner */}
          <div className="bg-[#E11D48] p-6 text-white text-center space-y-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-red-600/30 opacity-50"></div>
            <div className="relative">
              {settings.logoImage ? (
                <img 
                  src={settings.logoImage} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-xl shadow inline-block border border-rose-100 mb-2 bg-white p-1"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="bg-white text-[#E11D48] text-xl font-black py-2 px-3 rounded-xl shadow inline-block border-2 border-rose-100 mb-2 font-mono">
                  {settings.logoInitials || 'PH'}
                </span>
              )}
              <h2 className="text-lg font-bold tracking-tight uppercase leading-none">{settings.logoName}</h2>
              <p className="text-[10px] text-rose-150 uppercase tracking-widest font-bold">{settings.systemTitle || 'Hệ Thống Quản Lý POS'}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Tên đăng nhập</label>
              <input
                type="text"
                required
                placeholder="Nhập tên tài khoản (Ví dụ: admin, quanly, ...)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] outline-none text-xs font-semibold lowercase font-mono"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value.replace(/\s+/g, ''))}
              />
            </div>

            <div className="space-y-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Mật khẩu</label>
              </div>
              <input
                type={showLoginPass ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] outline-none text-xs font-mono"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowLoginPass(!showLoginPass)}
                className="absolute right-3.5 bottom-2.5 text-slate-400 hover:text-slate-655 transition cursor-pointer"
              >
                {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                Đăng nhập hệ thống
              </button>
            </div>

            {/* Quick simulated account shortcut list */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-2">Tài khoản thử nghiệm nhanh (Click để điền)</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('admin');
                    setLoginPassword('123456');
                  }}
                  className="p-2 border border-slate-150 hover:bg-slate-50 rounded-xl font-bold text-[10px] cursor-pointer transition text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('quanly');
                    setLoginPassword('123456');
                  }}
                  className="p-2 border border-slate-150 hover:bg-slate-50 rounded-xl font-bold text-[10px] cursor-pointer transition text-center"
                >
                  Quản lý
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('kho');
                    setLoginPassword('123456');
                  }}
                  className="p-2 border border-slate-150 hover:bg-slate-50 rounded-xl font-bold text-[10px] cursor-pointer transition text-center"
                >
                  Kho hàng
                </button>
              </div>
            </div>

          </form>
          
        </div>
      </div>
    );
  }

  if (activeStaff && activeStaff.mustChangePassword) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-800 bg-radial from-white to-slate-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          
          <div className="bg-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white text-center space-y-1 relative">
            <h3 className="text-base font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-white">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              Yêu cầu đổi mật khẩu lần đầu
            </h3>
            <p className="text-[10px] text-indigo-150 font-medium">Bảo mật tài khoản bắt buộc ban hành theo quy chế KiotViet</p>
          </div>

          <form onSubmit={handleMustChangePasswordSubmit} className="p-6 space-y-4 text-xs text-left">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl leading-relaxed text-[10px] font-medium font-sans">
              Bạn đang sử dụng mật khẩu mặc định hoặc tài khoản vừa mới khởi tạo bởi Quản Trị Viên. 
              Vui lòng thiết lập mật khẩu cá nhân có độ bảo mật cao để tiếp tục sử dụng Phong Hưng POS.
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Mật khẩu hiện tại (Mặc định: 123456)</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-indigo-500"
                value={mustCurrentPass}
                onChange={(e) => setMustCurrentPass(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mật khẩu mới (ít nhất 6 kí tự)</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-indigo-500"
                  value={mustNewPass}
                  onChange={(e) => setMustNewPass(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-indigo-500"
                  value={mustConfirmNewPass}
                  onChange={(e) => setMustConfirmNewPass(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 font-bold transition cursor-pointer"
              >
                Trở lại đăng nhập
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md inline-flex items-center gap-1"
              >
                Cập nhật mật khẩu chính thức
              </button>
            </div>

          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 font-sans relative">
      
      {/* BACKGROUND WATERMARK BRAND LOGO (Mờ ảo hài hòa dưới nền) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden select-none">
        <div className="w-[800px] h-[800px] opacity-[0.022] dark:opacity-[0.012] transition-opacity duration-300 transform rotate-12 scale-110">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#e11d48" strokeWidth="1.5" />
            <path d="M 12,50 C 35,20 65,80 88,50 C 75,75 25,75 12,50 Z" stroke="#e11d48" strokeWidth="1" fill="none" />
            <path d="M 12,50 C 35,40 65,60 88,50 C 75,85 25,85 12,50 Z" stroke="#e11d48" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>
      
      {/* 2. Brand Header (Polished exact photo representation) */}
      <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 select-none sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-2 sm:h-20 gap-4">
          
          {/* Logo Name styled exactly like mock header */}
          <div 
            id="brand-header-trigger"
            onClick={openLogoCustomizer}
            title="Nhấp vào để tùy chỉnh kiểu dáng và biểu tượng Logo"
            className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1 px-2.5 rounded-xl transition duration-150 shrink-0 select-none"
          >
            {/* Custom/Default styled brand emblem representation */}
            {settings.showBrandLogo !== false && (
              <div className="shrink-0 transition-transform group-hover:scale-105 duration-200 drop-shadow-sm">
                {renderHeaderLogoSVG("w-12 h-12")}
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1">
                <h1 className="text-[17px] font-black tracking-tight uppercase font-display leading-none">
                  {settings.logoName === 'PHONG HƯNG' || settings.logoName === 'PHONG HUNG' ? (
                    <>
                      <span className="text-[#E11D48] font-bold">PHONG HUNG</span>{' '}
                      <span className="text-slate-900 dark:text-slate-100">GERMANY</span>
                    </>
                  ) : (
                    <span 
                      className="font-bold" 
                      style={{ color: settings.brandLogoColor || '#E11D48' }}
                    >
                      {settings.logoName || 'PHONG HUNG'}
                    </span>
                  )}
                </h1>
              </div>
              <p 
                id="header-system-title"
                className="text-slate-400 dark:text-slate-500 text-[9.5px] uppercase font-black tracking-wider mt-1 block font-sans"
              >
                {settings.systemTitle || 'Chất lượng tạo niềm tin'}
              </p>
            </div>
          </div>

          {/* DESKTOP INTEGRATED HEADER TABS - EXACT MOCKUP (Visible on xl screens onwards) */}
          <div className="hidden xl:flex items-center self-stretch h-full mx-2 border-r border-slate-100 dark:border-slate-800/60 pr-2">
            {[
              { id: 'dashboard', label: 'Tổng quan', icon: Home },
              (!isWarehouseStaffOnly ? { id: 'sales', label: 'Bán hàng', icon: ShoppingCart } : null),
              { id: 'imports', label: 'Nhập hàng', icon: FolderInput },
              { id: 'inventory', label: 'Hàng hóa', icon: Package },
              { id: 'customers', label: 'Đối tác', icon: Users },
              { id: 'ledger', label: 'Đơn hàng', icon: FileText },
              (!isWarehouseStaffOnly ? { id: 'reports', label: 'Báo cáo', icon: BarChart } : null),
              { id: 'settings', label: 'Cài đặt', icon: Settings }
            ].filter(Boolean).map((item: any) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 xl:px-4.5 h-full flex flex-col justify-center items-center gap-1.5 transition-all relative border-b-[3px] font-sans ${
                    isActive 
                      ? 'text-[#E11D48] font-extrabold border-b-[#E11D48]' 
                      : 'text-slate-500 hover:text-slate-900 border-b-transparent hover:border-b-slate-100 dark:hover:text-slate-200'
                  }`}
                  style={{ height: '80px' }}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E11D48]' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold tracking-wide leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side controls: Rapid checkout, Notification and profile dropdown */}
          <div className="flex items-center gap-3.5 shrink-0">
            
            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="header-quick-actions-toggle"
                onClick={() => {
                  setIsQuickActionsOpen(!isQuickActionsOpen);
                  setIsProfileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-rose-600/90 to-amber-500/90 hover:from-rose-500 hover:to-amber-400 text-white relative overflow-hidden shadow-[0_3px_10px_rgba(225,29,72,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] border border-white/20 backdrop-blur px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.03] active:scale-95 duration-150 select-none cursor-pointer group"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
                <span className="tracking-wide text-[11px]">TÁC VỤ NHANH</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isQuickActionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Liquid Glass Dropdown Box */}
              {isQuickActionsOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-150 dark:border-slate-800 shadow-2xl rounded-2xl p-2 z-50 text-slate-800 dark:text-slate-100 text-left animate-in fade-in slide-in-from-top-3 duration-150">
                  <div className="px-3.5 py-2 border-b border-rose-100/40 dark:border-slate-800/50 flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-455 font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
                    Lối tắt vận hành nhanh
                  </div>
                  
                  {/* Action 1: New Sale */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isWarehouseStaffOnly) {
                        alert("Tài khoản kho không có quyền bán lẻ gõ đơn.");
                        return;
                      }
                      setActiveTab('sales');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('open-new-sale'));
                      }, 50);
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full mt-1.5 p-2 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 rounded-xl transition duration-150 text-left flex items-start gap-2.5 group border border-transparent hover:border-rose-100/30 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#E11D48] dark:text-rose-400 animate-pulse">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-slate-900 dark:text-white group-hover:text-[#E11D48] transition-colors">Bán lẻ mới (New Sale)</span>
                      <span className="text-[9.5px] text-slate-400 mt-0.5 block font-medium">Lập hóa đơn giỏ hàng nhanh</span>
                    </div>
                  </button>

                  {/* Action 2: Add Inventory Item */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inventory');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('open-add-product-modal'));
                      }, 50);
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full p-2 hover:bg-amber-50/60 dark:hover:bg-amber-955/20 rounded-xl transition duration-150 text-left flex items-start gap-2.5 group border border-transparent hover:border-amber-100/30 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-amber-600 dark:text-amber-400">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">Khai mặt hàng mới</span>
                      <span className="text-[9.5px] text-slate-400 mt-0.5 block font-medium">Thêm mặt hàng mới vào danh mục</span>
                    </div>
                  </button>

                  {/* Action 3: Register Customer */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('customers');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('open-add-customer-modal'));
                      }, 50);
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full mb-1 p-2 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 rounded-xl transition duration-150 text-left flex items-start gap-2.5 group border border-transparent hover:border-emerald-100/30 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-emerald-600 dark:text-emerald-400">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">Đăng ký đối tác</span>
                      <span className="text-[9.5px] text-slate-400 mt-0.5 block font-medium">Lưu thông tin khách hàng mới</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* RAPID SELL BUTTON - "BÁN HÀNG NHANH" (Matches the picture's red trigger button!) */}
            {!isWarehouseStaffOnly && (
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className="bg-[#E11D48] hover:bg-[#BE123C] text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-[0_3px_10px_rgba(225,29,72,0.3)] hover:scale-[1.03] active:scale-95 transition-all duration-150 select-none cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-white fill-white/10 shrink-0" />
                BÁN HÀNG NHANH
              </button>
            )}

            {/* Notification Bell trigger with orange state dot */}
            <div className="relative">
              <button 
                type="button" 
                onClick={() => showToast('Hộp thư thông báo trống!', 'info')}
                className="w-10 h-10 rounded-xl bg-slate-55 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 transition flex items-center justify-center select-none cursor-pointer"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full"></span>
              </button>
            </div>

            {/* Profile Dropdown Trigger (Admin-Quản trị Layout) */}
            <div className="relative">
              <div 
                id="header-profile-toggle"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1.5 px-2.5 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 transition select-none"
              >
                <div className="text-right text-[10px] leading-tight font-sans">
                  <span className="font-extrabold text-slate-800 dark:text-white block truncate max-w-[100px] flex items-center gap-1">
                    {activeStaff.tenNV.split(' ').pop()}
                    <span className="text-[7.5px] text-slate-400">▼</span>
                  </span>
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block mt-0.5">Quản trị</span>
                </div>
                <div className="w-8 h-8 bg-[#881337] rounded-full border border-rose-220 text-white font-black text-xs shrink-0 flex items-center justify-center shadow-sm">
                  {activeStaff.tenNV.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Profile drop list overlay */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-800 py-1.5 z-50 text-slate-700 dark:text-slate-200 text-xs text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Mã tài khoản: {activeStaff.id}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsProfileDetailsOpen(true);
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer transition text-left"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Thông tin cá nhân
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setCurrentPass('');
                      setNewPass('');
                      setConfirmNewPass('');
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer transition text-left"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    Đổi mật khẩu
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 font-bold flex items-center gap-2 cursor-pointer transition text-left text-[#E11D48]"
                  >
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
          
        </div>
      </header>

      {/* HORIZONTAL TAB MENU BAR (Shown only on viewports below desktop for responsiveness) */}
      <nav className="flex xl:hidden bg-[#111827] dark:bg-slate-950 border-b-2 border-amber-500 shadow-md sticky top-0 lg:top-20 z-30 overflow-x-auto text-xs min-h-[46px] select-none">
        <div className="max-w-7xl mx-auto flex whitespace-nowrap">
          
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
              activeTab === 'dashboard' 
                ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                : 'text-slate-350 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" /> TRANG CHỦ
          </button>

          {!isWarehouseStaffOnly && (
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
                activeTab === 'sales' 
                  ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                  : 'text-slate-350 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" /> BÁN HÀNG
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('imports')}
            className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
              activeTab === 'imports' 
                ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                : 'text-slate-355 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderInput className="w-4 h-4 shrink-0" /> NHẬP HÀNG
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
              activeTab === 'inventory' 
                ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                : 'text-slate-355 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" /> HÀNG HÓA
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
              activeTab === 'customers' 
                ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                : 'text-slate-355 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" /> ĐỐI TÁC
          </button>

          <button
            type="button"
            className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
              activeTab === 'ledger' 
                ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                : 'text-slate-355 hover:text-white hover:bg-slate-800/60'
            }`}
            onClick={() => setActiveTab('ledger')}
          >
            <FileText className="w-4 h-4 shrink-0" /> ĐƠN HÀNG
          </button>

          {!isWarehouseStaffOnly && (
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full border-r border-slate-800/80 ${
                activeTab === 'reports' 
                  ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                  : 'text-slate-355 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart className="w-4 h-4 shrink-0" /> BÁO CÁO
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 md:py-3.5 font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer h-full ${
              activeTab === 'settings' 
                ? 'bg-[#E11D48] text-white shadow-inner font-extrabold' 
                : 'text-slate-355 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" /> CÀI ĐẶT
          </button>

        </div>
      </nav>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20">
        
        {/* TAB WORKSPACE ROUTER */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            invoices={invoices}
            inventory={inventory}
            customers={customers}
            suppliers={suppliers}
            settings={settings}
            onNavigate={(tab) => {
              if (tab === 'sales' && isWarehouseStaffOnly) {
                alert("Tài khoản kho không có quyền bán lẻ gõ đơn.");
                return;
              }
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'sales' && !isWarehouseStaffOnly && (
          <Sales
            products={products}
            customers={customers}
            inventory={inventory}
            settings={settings}
            currentStaffName={activeStaff.tenNV}
            onSaveInvoice={handleSaveInvoice}
            onNavigate={(tab) => setActiveTab(tab)}
            selectedTemplate={selectedTemplate}
            onUpdateTemplate={setSelectedTemplate}
            onPrintDraft={(draftInvoice) => {
              setPrintedImportSlip(undefined);
              setPrintedInvoice(draftInvoice);
              setIsDraftPrint(true);
              setIsPrintOpen(true);
            }}
          />
        )}

        {activeTab === 'imports' && (
          <Imports
            products={products}
            suppliers={suppliers}
            inventory={inventory}
            settings={settings}
            currentStaffName={activeStaff.tenNV}
            onSaveImportSlip={handleSaveImportSlip}
            onAddNewProduct={handleAddNewProduct}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryList
            products={products}
            inventory={inventory}
            settings={settings}
            canEditProducts={activeStaff.vaiTro !== 'Nhân viên kho'}
            onAddNewProduct={handleAddNewProduct}
            onEditProduct={handleEditProduct}
          />
        )}

        {activeTab === 'customers' && (
          <Customers
            customers={customers}
            invoices={invoices}
            onAddNewCustomer={handleAddNewCustomerObject}
            onCollectDebt={handleCollectCustomerDebt}
            suppliers={suppliers}
            importSlips={importSlips}
            onAddNewSupplier={handleAddNewSupplierObject}
            onPaySupplierDebt={handlePaySupplierDebt}
            isWarehouseStaff={isWarehouseStaffOnly}
          />
        )}

        {activeTab === 'ledger' && (
          <InvoicesList
            invoices={invoices}
            importSlips={importSlips}
            currentUserRole={activeStaff.vaiTro}
            currentStaffName={activeStaff.tenNV}
            onCancelInvoice={handleCancelInvoice}
            onCancelImportSlip={handleCancelImportSlip}
            onSelectPrintInvoice={handleOpenPrintInvoice}
            onSelectPrintImport={handleOpenPrintImport}
          />
        )}

        {activeTab === 'reports' && !isWarehouseStaffOnly && (
          <Reports
            invoices={invoices}
            products={products}
            customers={customers}
            suppliers={suppliers}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsStaff
            settings={settings}
            staffs={staffs}
            activeStaffId={activeStaffId}
            securityLogs={securityLogs}
            onUpdateSettings={(newSet) => setSettings(newSet)}
            onUpdateStaffs={setStaffs}
            onAddSecurityLog={addSecurityLog}
            onSwitchStaff={handleSwitchStaff}
          />
        )}

      </main>

      {/* BRAND BLACK/CHARCOAL FOOTER SECTION */}
      <footer className="bg-[#111827] text-slate-400 py-6 border-t border-slate-800 text-xs text-center select-none font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left leading-relaxed">
            <p className="font-extrabold text-[#E11D48] tracking-wider uppercase font-display">PHONG HUNG GERMANY POS</p>
            <p className="text-[9.5px] text-slate-500 mt-1">Bản quyền thuộc về hộ kinh doanh Phong Hùng © 2025 - Thiết kế theo quy chuẩn hình ảnh thương hiệu.</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
            <span className="hover:text-[#E11D48] transition cursor-pointer">Điều khoản</span>
            <span>•</span>
            <span className="hover:text-[#E11D48] transition cursor-pointer">Bảo mật</span>
            <span>•</span>
            <span className="hover:text-[#E11D48] transition cursor-pointer">Hỗ trợ kỹ thuật: 098.POS.GERMANY</span>
          </div>
        </div>
      </footer>

      {/* SOLID BILL PRINTER MODAL FRAME */}
      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          setPrintedInvoice(undefined);
          setPrintedImportSlip(undefined);
          setIsDraftPrint(false);
        }}
        invoice={printedInvoice}
        importSlip={printedImportSlip}
        settings={settings}
        selectedTemplate={selectedTemplate}
        onUpdateTemplate={setSelectedTemplate}
        isDraft={isDraftPrint || printedInvoice?.maHD === 'HD-TAMTINH'}
        onShowToast={showToast}
      />

      {/* Quick Header Logo/Title Edit Dialog */}
      <AnimatePresence>
        {isQuickEditOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickEditOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 max-w-sm w-full relative z-10 text-left font-sans"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 text-[10px] uppercase tracking-wider font-extrabold bg-rose-50 text-[#E11D48] rounded-lg">Cấu hình</span>
                  <h3 className="text-xs font-bold text-slate-800">Cấu hình nhanh Logo & Tiêu đề</h3>
                </div>
                <button 
                  onClick={() => setIsQuickEditOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Kí tự Biểu tượng Logo (2-3 Chữ)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-[#E11D48] uppercase text-center focus:border-rose-400 focus:ring-1 focus:ring-rose-400 focus:outline-none"
                    value={quickLogoInitials}
                    onChange={(e) => setQuickLogoInitials(e.target.value)}
                  />
                  <p className="text-[9px] text-slate-400">Từ viết tắt hiển thị khi không có logo hình ảnh (ví dụ: PH)</p>
                </div>

                {/* Quick Image Uploader */}
                <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Thêm ảnh Logo từ thiết bị</span>
                  {quickLogoImage ? (
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <img 
                        src={quickLogoImage} 
                        alt="Quick Logo Preview" 
                        className="w-10 h-10 object-contain rounded-md border p-1 animate-fadeIn"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <span className="text-[9px] text-emerald-600 font-bold block">Sẵn sàng áp dụng</span>
                        <button
                          type="button"
                          onClick={() => setQuickLogoImage('')}
                          className="text-rose-500 hover:text-rose-700 text-[9px] font-bold transition cursor-pointer select-none"
                        >
                          Xóa chọn ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer bg-white hover:bg-slate-50 text-center text-[10px] font-bold text-slate-600 transition shadow-sm select-none">
                        Chọn ảnh từ thiết bị
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQuickImageUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Tên thương hiệu doanh nghiệp</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-400 focus:ring-1 focus:ring-rose-400 focus:outline-none"
                    value={quickLogoName}
                    onChange={(e) => setQuickLogoName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Dòng Tiêu đề Hệ thống</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-rose-400 focus:ring-1 focus:ring-rose-400 focus:outline-none"
                    value={quickSystemTitle}
                    onChange={(e) => setQuickSystemTitle(e.target.value)}
                  />
                </div>

                <div className="pt-3 border-t border-slate-50 flex justify-end gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
                  >
                    Xác nhận đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2B. ADVANCED LOGO AND ICON STYLE CUSTOMIZER MODAL */}
      <AnimatePresence>
        {isLogoCustomizerOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoCustomizerOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-5 max-w-lg w-full relative z-10 text-left font-sans flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 text-[9.5px] uppercase tracking-wider font-extrabold bg-[#E11D48]/10 text-[#E11D48] rounded-lg">Cá nhân hóa</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Thiết kế Biểu tượng Thương hiệu</h3>
                </div>
                <button 
                  onClick={() => setIsLogoCustomizerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Live Preview Panel */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4 mb-4 flex items-center gap-4 shrink-0 shadow-inner">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-100 dark:border-slate-800 shrink-0 select-none">
                  {renderHeaderLogoSVG("w-16 h-16", {
                    brandLogoType: logoCustomType,
                    brandLogoShape: logoCustomShape,
                    brandLogoColor: logoCustomColor,
                    brandLogoGlow: logoCustomGlow,
                    brandLogoBorderWidth: logoCustomBorderWidth,
                    brandLogoImage: logoCustomImage,
                    logoInitials: quickLogoInitials
                  })}
                </div>
                <div className="flex-1 text-xs">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 block mb-1">XEM TRƯỚC HÌNH ẢNH TRỰC TIẾP</span>
                  <p className="font-black text-[15px] dark:text-slate-100 tracking-tight select-none uppercase" style={{ color: logoCustomColor }}>
                    {quickLogoName || 'PHONG HUNG'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                    {quickSystemTitle || 'Chất lượng tạo niềm tin'}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    Hình dáng: <span className="font-bold lowercase text-slate-550">{logoCustomShape}</span> • Biểu tượng: <span className="font-bold lowercase text-slate-550">{logoCustomType}</span>
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCustomizerTab('icon')}
                  className={`flex-1 pb-2 font-bold transition-all border-b-2 text-center cursor-pointer ${
                    activeCustomizerTab === 'icon' 
                      ? 'border-[#E11D48] text-[#E11D48]' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  1. CHỌN BIỂU TƯỢNG
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCustomizerTab('style')}
                  className={`flex-1 pb-2 font-bold transition-all border-b-2 text-center cursor-pointer ${
                    activeCustomizerTab === 'style' 
                      ? 'border-[#E11D48] text-[#E11D48]' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  2. PHONG CÁCH & MÀU SẮC
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCustomizerTab('text')}
                  className={`flex-1 pb-2 font-bold transition-all border-b-2 text-center cursor-pointer ${
                    activeCustomizerTab === 'text' 
                      ? 'border-[#E11D48] text-[#E11D48]' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  3. TIÊU ĐỀ & CHỮ
                </button>
              </div>

              {/* Form Content / Body (Scrollable if needed) */}
              <form onSubmit={handleSaveLogoCustomization} className="text-xs flex-1 overflow-y-auto pr-1 space-y-4 text-left">
                {activeCustomizerTab === 'icon' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500">CHỌN LOẠI BIỂU TƯỢNG TRƯNG BÀY</label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Option 1: Classic default */}
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('default')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition select-none cursor-pointer ${
                            logoCustomType === 'default'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 bg-rose-50 rounded-lg flex items-center justify-center p-0.5 border border-rose-100">
                            {renderHeaderLogoSVG("w-7 h-7", { brandLogoType: 'default', brandLogoGlow: false, brandLogoBorderWidth: 1.5, logoInitials: quickLogoInitials })}
                          </div>
                          <div>
                            <span className="block text-[11px]">Đặc trưng Phục Cổ</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-sans font-normal">Chữ {quickLogoInitials} & Quốc kỳ Đức</span>
                          </div>
                        </button>

                        {/* Option 2: Eco-flames */}
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('flames')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition select-none cursor-pointer ${
                            logoCustomType === 'flames'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 bg-amber-50 rounded-lg flex items-center justify-center p-0.5 border border-amber-100">
                            {renderHeaderLogoSVG("w-7 h-7", { brandLogoType: 'flames', brandLogoGlow: false, brandLogoBorderWidth: 1.5 })}
                          </div>
                          <div>
                            <span className="block text-[11px]">Ngọn lửa Eco-Gas</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-sans font-normal">Năng lượng nhà bếp</span>
                          </div>
                        </button>

                        {/* Option 3: Master cook hat */}
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('chef')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition select-none cursor-pointer ${
                            logoCustomType === 'chef'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 bg-indigo-50 rounded-lg flex items-center justify-center p-0.5 border border-indigo-100">
                            {renderHeaderLogoSVG("w-7 h-7", { brandLogoType: 'chef', brandLogoGlow: false, brandLogoBorderWidth: 1.5, brandLogoColor: logoCustomColor })}
                          </div>
                          <div>
                            <span className="block text-[11px]">Vua Nhà Bếp (Chef)</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-normal">Ba sao tinh hoa ẩm thực</span>
                          </div>
                        </button>

                        {/* Option 4: Protective shield */}
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('shield')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition select-none cursor-pointer ${
                            logoCustomType === 'shield'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center p-0.5 border border-slate-200">
                            {renderHeaderLogoSVG("w-7 h-7", { brandLogoType: 'shield', brandLogoGlow: false, brandLogoBorderWidth: 1.5, brandLogoColor: logoCustomColor })}
                          </div>
                          <div>
                            <span className="block text-[11px]">Khiên Kỹ thuật Đức</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-normal">Bền bỉ tuyệt đối của thép</span>
                          </div>
                        </button>

                        {/* Option 5: Golden Crown */}
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('crown')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition select-none cursor-pointer ${
                            logoCustomType === 'crown'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 bg-yellow-50 rounded-lg flex items-center justify-center p-0.5 border border-yellow-100">
                            {renderHeaderLogoSVG("w-7 h-7", { brandLogoType: 'crown', brandLogoGlow: false, brandLogoBorderWidth: 1.5, brandLogoColor: logoCustomColor })}
                          </div>
                          <div>
                            <span className="block text-[11px]">Vương Miện Chất lượng</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-normal">Hoàng Gia & Sang Trọng</span>
                          </div>
                        </button>

                        {/* Option 6: Dual Induction loop */}
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('inductor')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition select-none cursor-pointer ${
                            logoCustomType === 'inductor'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 bg-emerald-50 rounded-lg flex items-center justify-center p-0.5 border border-emerald-100">
                            {renderHeaderLogoSVG("w-7 h-7", { brandLogoType: 'inductor', brandLogoGlow: false, brandLogoBorderWidth: 1.5, brandLogoColor: logoCustomColor })}
                          </div>
                          <div>
                            <span className="block text-[11px]">Vòng Bếp Từ Thông Minh</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-normal">Công nghệ cảm ứng từ</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Custom Image Option */}
                    <div className="space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Chọn Ảnh Cá Nhân Làm Logo</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">Tải ảnh PNG/JPG (&lt;2MB)</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setLogoCustomType('image')}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-left transition flex-1 select-none cursor-pointer ${
                            logoCustomType === 'image'
                              ? 'border-[#E11D48] bg-rose-50/25 dark:bg-rose-950/10 text-slate-900 dark:text-slate-100 font-bold'
                              : 'border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border p-0.5">
                            {logoCustomImage ? (
                              <img src={logoCustomImage} alt="Uploaded logo" className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="block text-[11px]">Sử dụng Ảnh này</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-500">
                              {logoCustomImage ? 'Nhấp chọn áp dụng' : 'Chưa tải ảnh lên'}
                            </span>
                          </div>
                        </button>

                        <div className="shrink-0 flex gap-2">
                          <label className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 transition duration-150 select-none">
                            Tải Ảnh Mới
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoCustomImageUpload}
                            />
                          </label>
                          {logoCustomImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setLogoCustomImage('');
                                setLogoCustomType('default');
                              }}
                              className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-500 rounded-xl cursor-pointer transition"
                              title="Xóa bỏ ảnh hiện tại"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeCustomizerTab === 'style' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Choose Boundary Shape */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-500 block mb-0.5">1. KHUNG VIỀN NGOÀI BIỂU TƯỢNG</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'circle', label: 'Khung Tròn', desc: 'Trắc diện cổ điển' },
                          { id: 'squircle', label: 'Bo Sành Điệu', desc: 'Bo góc squircle' },
                          { id: 'hexagon', label: 'Lục Giác Lực', desc: 'Hiện đại kiêu hãnh' }
                        ].map(shape => (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => setLogoCustomShape(shape.id as any)}
                            className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                              logoCustomShape === shape.id
                                ? 'border-[#E11D48] bg-rose-50/20 dark:bg-rose-950/10 text-[#E11D48] font-bold'
                                : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <span className="block text-[11px] uppercase tracking-tight">{shape.label}</span>
                            <span className="block text-[8.5px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{shape.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stroke Width customization */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold text-slate-500 flex justify-between">
                        <span>2. ĐỘ DÀY VIỀN BIỂU TƯỢNG (STROKE)</span>
                        <span className="font-mono text-[#E11D48] font-bold">{logoCustomBorderWidth}px</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(pixel => (
                          <button
                            key={pixel}
                            type="button"
                            onClick={() => setLogoCustomBorderWidth(pixel)}
                            className={`flex-1 py-1.5 rounded-lg border font-mono font-bold transition cursor-pointer text-xs ${
                              logoCustomBorderWidth === pixel
                                ? 'bg-[#E11D48] text-white border-[#E11D48]'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {pixel}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color selection customization */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-extrabold text-slate-500 block">3. CHỌN MÀU THỂ HIỆN BRAND CHỦ ĐẠO</label>
                      
                      {/* Presets */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[
                          { id: '#E11D48', name: 'Đỏ Thạnh (Default)', bg: 'bg-[#E11D48]' },
                          { id: '#F59E0B', name: 'Hổ Phách bếp vàng', bg: 'bg-[#F59E0B]' },
                          { id: '#4F46E5', name: 'Châu Âu xanh thẳm', bg: 'bg-[#4F46E5]' },
                          { id: '#10B981', name: 'Mộc lục bạc hà', bg: 'bg-[#10B981]' },
                          { id: '#1E293B', name: 'Graphite Cao Cấp', bg: 'bg-[#1E293B]' }
                        ].map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => setLogoCustomColor(color.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition cursor-pointer select-none ${
                              logoCustomColor === color.id
                                ? 'border-[#E11D48] bg-slate-50 dark:bg-slate-800'
                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${color.bg} shadow-sm border border-black/10`} />
                            {color.name}
                          </button>
                        ))}
                      </div>

                      {/* Manual Hex Input / Custom Color Picker */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] uppercase font-bold text-slate-555 flex items-center gap-1.5 dark:text-slate-400">
                          <input
                            type="color"
                            value={logoCustomColor}
                            onChange={(e) => setLogoCustomColor(e.target.value)}
                            className="w-7 h-7 rounded border border-slate-200/50 cursor-pointer p-0 bg-transparent flex-shrink-0"
                          />
                          Màu thủ công khác:
                        </label>
                        <input
                          type="text"
                          maxLength={7}
                          className="w-24 px-2 py-1 font-mono uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-black tracking-wider text-slate-700 dark:text-slate-200 rounded-lg focus:outline-none"
                          value={logoCustomColor}
                          onChange={(e) => {
                            if (e.target.value.startsWith('#')) {
                              setLogoCustomColor(e.target.value);
                            } else {
                              setLogoCustomColor('#' + e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Glow and filtration switch */}
                    <div className="flex items-center justify-between bg-[#E11D48]/5 dark:bg-[#E11D48]/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-100 text-[11px]">Bật hiệu ứng hào quang Neon Glow</span>
                        <span className="block text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Tạo bóng sáng mượt xung quanh biểu tượng (phù hợp với màn hình hiện đại)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLogoCustomGlow(!logoCustomGlow)}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          logoCustomGlow ? 'bg-[#E11D48]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                            logoCustomGlow ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Show/Hide Header Logo Toggle */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-100 text-[11px]">Hiển thị biểu tượng Logo ở thanh tiêu đề</span>
                        <span className="block text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Bật hoặc tắt biểu tượng đồ họa bên cạnh tên thương hiệu</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLogoCustomShow(!logoCustomShow)}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                          logoCustomShow ? 'bg-[#E11D48]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                            logoCustomShow ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {activeCustomizerTab === 'text' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Brand Initials Letter */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Chữ tắt Logo (Hiển thị ở Logo Phục Cổ - Max 4 kí tự)</label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        placeholder="Ví dụ: PH"
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg font-mono font-bold text-[#E11D48] uppercase text-center focus:border-rose-400 focus:ring-1 focus:ring-rose-400 focus:outline-none text-sm"
                        value={quickLogoInitials}
                        onChange={(e) => setQuickLogoInitials(e.target.value)}
                      />
                    </div>

                    {/* Brand Header Display Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Tiêu đề thương hiệu (Hiển thị ở Header)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: PHONG HUNG"
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg font-bold text-slate-700 dark:text-slate-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 focus:outline-none text-xs"
                        value={quickLogoName}
                        onChange={(e) => setQuickLogoName(e.target.value)}
                      />
                    </div>

                    {/* Brand Tagline Slogan */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Khẩu hiệu của thương hiệu (Tagline)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Chất lượng tạo niềm tin"
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-100 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 focus:outline-none text-xs"
                        value={quickSystemTitle}
                        onChange={(e) => setQuickSystemTitle(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Toolbar */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-[11px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsLogoCustomizerOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition"
                  >
                    Hủy thiết kế
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white rounded-xl font-bold cursor-pointer transition shadow-md flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: logoCustomColor }}
                  >
                    <Check className="w-3.5 h-3.5" /> Lưu Thương Hiệu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. PROFILE DETAILS DIALOG LIMITS */}
      <AnimatePresence>
        {isProfileDetailsOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-left text-xs font-sans animate-in zoom-in-95 duration-150"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rose-600 font-bold" />
                  Hồ sơ cá nhân nhân viên
                </h3>
                <button 
                  onClick={() => setIsProfileDetailsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-left">
                <div className="flex items-center gap-3 bg-rose-50/20 p-3 rounded-xl border border-rose-100">
                  <div className="w-10 h-10 bg-[#E11D48] rounded-full flex items-center justify-center text-white font-black text-base border-2 border-rose-200 shadow-sm shrink-0">
                    {activeStaff.tenNV.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h4 className="font-extrabold text-slate-800 text-[13px] truncate">{activeStaff.tenNV}</h4>
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-rose-100 text-[#E11D48] px-2 py-0.5 rounded border border-rose-200 inline-block mt-0.5 font-mono">{activeStaff.vaiTro}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 font-medium text-slate-600">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wide">Mã nhân viên</span>
                    <p className="font-mono font-bold text-slate-800">{activeStaff.id}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wide">Tên đăng nhập</span>
                    <p className="font-mono font-bold text-slate-800">{activeStaff.username || 'chưa cấp'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wide">Số điện thoại</span>
                    <p className="font-bold text-slate-850">{activeStaff.sdt || '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-450 uppercase font-black tracking-wide">Trạng thái</span>
                    <p className="font-bold text-emerald-600">Active / Đang làm</p>
                  </div>
                  {activeStaff.createdAt && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-[9px] text-slate-455 uppercase font-black tracking-wide">Thời gian cấp phát</span>
                      <p className="text-slate-700 font-mono text-[10px] font-bold">{new Date(activeStaff.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsProfileDetailsOpen(false)}
                  className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition cursor-pointer"
                >
                  Đóng lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. VOLUNTARY USER PASSWORD CHANGING */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-left text-xs font-sans animate-in zoom-in-95 duration-150"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-rose-600" />
                  Đổi mật khẩu bảo mật cá nhân
                </h3>
                <button 
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="p-4 space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-rose-500"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Mật khẩu mới (Tối thiểu 6 kí tự)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-rose-500"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Nhập lại mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none font-mono focus:border-rose-500"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-[#BE123C] text-white rounded-lg transition cursor-pointer shadow-md font-bold"
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Toast Notifications Portal */}
      <div className="fixed top-5 right-5 z-[10000] pointer-events-none flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-slate-900/95 text-white p-3.5 px-4 rounded-xl shadow-xl border border-slate-700/50 flex items-center justify-between gap-3 text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'success' && (
                  <span className="flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
                {toast.type === 'info' && (
                  <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full shrink-0">
                    <Settings className="w-3 h-3 text-white" />
                  </span>
                )}
                <span className="font-semibold text-slate-100">{toast.message}</span>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white transition p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
