export class DeleteFileResponse {
  constructor(isFileDeleted: boolean) {
    this.isFileDeleted = isFileDeleted;
  }
  isFileDeleted: boolean;
}

export class UploadFileResponse {
  constructor(url: string) {
    this.isFileUploaded = true;
    this.url = url;
  }
  isFileUploaded: boolean;
  url: string;
}
