export class IsFileDeleted {
  constructor(isFileDeleted: boolean) {
    this.isFileDeleted = isFileDeleted;
  }
  isFileDeleted: boolean;
}

export class IsFileUploaded {
  constructor(isFileUploaded: boolean) {
    this.isFileUploaded = isFileUploaded;
  }
  isFileUploaded: boolean;
}

export class FileUrl {
  constructor(url: string) {
    this.url = url;
  }
  url: string;
}
