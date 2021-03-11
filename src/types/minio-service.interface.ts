import { BufferedFile } from './buffered-file.interface';
import { DeleteFileResponse, UploadFileResponse } from '..';
import { Response } from 'express';

export interface IMinioService {
  upload(file: BufferedFile, bucket: string): Promise<UploadFileResponse>;
  delete(objectName: string, bucket: string): Promise<DeleteFileResponse>;
  get(res: Response, fileName: string, bucket: string): Promise<void>;
}
