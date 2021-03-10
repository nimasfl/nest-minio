export interface BufferedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: AppMimeType;
  size: number;
  buffer: Buffer | string;
}

export enum AppMimeType {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  AVI = 'video/x-msvideo',
  BIN = 'application/octet-stream',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ICO = 'image/vnd.microsoft.icon',
  JSON = 'application/json',
  MP3 = 'audio/mpeg',
  MPEG = 'video/mpeg',
  PDF = 'application/pdf',
  RAR = 'application/vnd.rar',
  SVG = 'image/svg+xml',
  TAR = 'application/x-tar',
  TXT = 'text/plain',
  WAV = 'audio/wav',
  WOFF = 'font/woff',
  WOFF2 = 'font/woff2',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XML_TEXT = 'text/xml',
  XML_APP = 'application/xml',
  ZIP = 'application/zip',
  SEVEN_Z = 'application/x-7z-compressed',
}
