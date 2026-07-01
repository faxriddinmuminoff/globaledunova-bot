export interface FileScanResult {
  safe: boolean;
  reason?: string;
}

export interface FileScanner {
  scan(input: { fileName: string; mimeType: string; fileSize: number }): Promise<FileScanResult>;
}
