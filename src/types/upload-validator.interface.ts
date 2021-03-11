import { MinioMimeType } from './minio-mime-type.enum';

export class UploadValidator {
  validMimes?: MinioMimeType[];
  maxSize?: number;
}
