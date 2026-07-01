import { FileScanner, FileScanResult } from './file-scanner.interface';

export class NoOpFileScanner implements FileScanner {
  async scan(input: {
    fileName: string;
    mimeType: string;
    fileSize: number;
  }): Promise<FileScanResult> {
    if (input.fileSize <= 0) {
      return { safe: false, reason: 'Empty file' };
    }
    return { safe: true };
  }
}
