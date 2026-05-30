// Accent removal utility
export function removeSign(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

// Check if a search query matches a product/customer/supplier
export function smartMatch(text: string, query: string, tags?: string): boolean {
  if (!query) return true;
  const cleanText = removeSign(text);
  const cleanQuery = removeSign(query);
  const cleanTags = tags ? removeSign(tags) : '';

  // 1. Direct substring match
  if (cleanText.includes(cleanQuery) || cleanTags.includes(cleanQuery)) {
    return true;
  }

  // 2. Abbreviation/acronym match (e.g. "chao chong dinh" -> "ccd")
  // For words in cleanText, get the first letters:
  const firstLetters = cleanText
    .split(/\s+/)
    .map(word => word[0])
    .join('');
  if (firstLetters.includes(cleanQuery)) {
    return true;
  }

  // 3. Try to match letters of abbreviation for tags too
  if (cleanTags) {
    const tagLetters = cleanTags
      .split(/\s+/)
      .map(word => word[0])
      .join('');
    if (tagLetters.includes(cleanQuery)) {
      return true;
    }
  }

  return false;
}

// Convert numbers to VND currency format (e.g., 150000 -> "150.000 đ")
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount || 0)
    .replace('₫', 'đ');
}

// Format Date string (e.g., "2026-05-30T04:19:13Z" -> "30/05/2026 11:19")
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
}

// Generate automatic IDs
export function generateId(prefix: string, list: { maSP?: string; maKH?: string; maNCC?: string; maHD?: string; maPN?: string }[]): string {
  const keys = ['maSP', 'maKH', 'maNCC', 'maHD', 'maPN'] as const;
  let maxNum = 0;
  
  for (const item of list) {
    for (const key of keys) {
      const val = item[key];
      if (val && val.startsWith(prefix)) {
        const numPart = val.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(6, '0')}`;
}

export function adjustHueAndLightness(hex: string, percent: number): string {
  if (!hex || hex[0] !== '#') return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return hex;
  }

  r = Math.min(255, Math.max(0, Math.round(r * (1 + percent))));
  g = Math.min(255, Math.max(0, Math.round(g * (1 + percent))));
  b = Math.min(255, Math.max(0, Math.round(b * (1 + percent))));

  const toHex = (c: number) => c.toString(16);

  const pad = (s: string) => s.length === 1 ? '0' + s : s;
  return `#${pad(toHex(r))}${pad(toHex(g))}${pad(toHex(b))}`;
}

export function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#e11d48');
          return;
        }
        canvas.width = 30;
        canvas.height = 30;
        ctx.drawImage(img, 0, 0, 30, 30);
        const data = ctx.getImageData(0, 0, 30, 30).data;
        
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          
          if (a < 150) continue;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const saturation = max === 0 ? 0 : delta / max;
          const brightness = max / 255;
          
          if (saturation < 0.15 || brightness < 0.1 || brightness > 0.95) {
            continue;
          }
          
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
        
        if (count === 0) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const a = data[i+3];
            if (a < 100) continue;
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }
        
        if (count > 0) {
          const rAvg = Math.round(rSum / count);
          const gAvg = Math.round(gSum / count);
          const bAvg = Math.round(bSum / count);
          
          const pad = (s: string) => s.length === 1 ? '0' + s : s;
          resolve(`#${pad(rAvg.toString(16))}${pad(gAvg.toString(16))}${pad(bAvg.toString(16))}`);
        } else {
          resolve('#e11d48');
        }
      } catch (err) {
        console.error('Failed to extract color', err);
        resolve('#e11d48');
      }
    };
    img.onerror = () => {
      resolve('#e11d48');
    };
  });
}
