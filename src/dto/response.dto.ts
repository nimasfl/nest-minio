export class DeleteFileResponse {
  constructor(isFileDeleted: boolean) {
    this.isFileDeleted = isFileDeleted;
  }
  isFileDeleted: boolean;
}

export class UploadFileResponse {
  constructor(url?: string, largeUrl?: string, smallUrl?: string) {
    this.isFileUploaded = true;
    this.url = url;
    this.smallUrl = smallUrl;
    this.largeUrl = largeUrl;
  }
  isFileUploaded: boolean;
  url?: string;
  smallUrl?: string;
  largeUrl?: string;
}
