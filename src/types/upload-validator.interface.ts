import { MinioMimeType } from './minio-mime-type.enum';

export interface IUploadValidator {
  validMimes: MinioMimeType[];
  maxSize: number;
}
