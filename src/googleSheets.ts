/**
 * Google Sheets API v4 Client Helpers
 */

/**
 * Perform authenticated fetch to Google Sheets API
 */
async function sheetsFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errText || response.statusText}`);
  }

  return response;
}

/**
 * Create a new Google Spreadsheet with specific sheet tabs
 */
export async function createPOSSpreadsheet(token: string, title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await sheetsFetch("", token, {
    method: "POST",
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: "Hóa Đơn Bán Hàng",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: "Danh Mục Sản Phẩm",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: "Nhật Ký Bảo Mật",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

/**
 * Appends or overwrites values in a specific Sheet range (e.g., 'Hóa Đơn Bán Hàng'!A1)
 */
export async function updateSheetValues(
  token: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const response = await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, token, {
    method: "PUT",
    body: JSON.stringify({
      range: range,
      majorDimension: "ROWS",
      values: values,
    }),
  });

  return await response.json();
}
