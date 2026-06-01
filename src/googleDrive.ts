/**
 * Google Drive API Client Helpers (v3)
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  size?: string;
}

/**
 * Perform authenticated fetch to Google Drive API
 */
async function driveFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  
  const response = await fetch(`https://www.googleapis.com/${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API error: ${response.status} - ${errText || response.statusText}`);
  }

  return response;
}

/**
 * Find or create a specific backup folder in Google Drive
 */
export async function getOrCreateBackupFolder(token: string, folderName = "PhongHungPOS_Backups"): Promise<string> {
  // 1. Search for existing folder
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await driveFetch(`drive/v3/files?q=${query}&fields=files(id, name)`, token);
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create folder if not found
  const createRes = await driveFetch("drive/v3/files", token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  const createdFolder = await createRes.json();
  return createdFolder.id;
}

/**
 * Upload a file (JSON or CSV) using Google Drive v3 multipart upload
 */
export async function uploadToDrive(
  token: string,
  filename: string,
  content: string,
  mimeType: string,
  parentFolderId?: string
): Promise<DriveFile> {
  const metadata: Record<string, any> = {
    name: filename,
    mimeType: mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = 
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const uploadRes = await driveFetch("upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime", token, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  return await uploadRes.json();
}

/**
 * Search/List all files inside our specific backup folder
 */
export async function listFolderFiles(token: string, folderId: string): Promise<DriveFile[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await driveFetch(`drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id, name, mimeType, size, createdTime)`, token);
  const data = await res.json();
  return data.files || [];
}

/**
 * Download text/file contents from Google Drive
 */
export async function downloadFileContent(token: string, fileId: string): Promise<string> {
  const res = await driveFetch(`drive/v3/files/${fileId}?alt=media`, token);
  return await res.text();
}

/**
 * Permanently delete a file in Google Drive (requires user confirmation before using!)
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  await driveFetch(`drive/v3/files/${fileId}`, token, {
    method: "DELETE",
  });
}
