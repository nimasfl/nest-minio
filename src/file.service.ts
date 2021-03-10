import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { MinioService } from 'nestjs-minio-client';
import { BufferedFile } from './types/file.model';
import * as crypto from 'crypto';
import { FileUrl, IsFileDeleted } from './types/response.dto';

@Injectable()
export class FileService {
  private readonly logger: Logger;

  constructor(private readonly minioService: MinioService) {
    this.logger = new Logger('MinioStorageService');
  }

  private static getExtension(file: BufferedFile) {
    return file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );
  }
  private static getBucket(url: string) {
    return url.substr(1, url.indexOf('/', 1) - 1);
  }
  private static getFileName(url: string) {
    return url.substr(url.indexOf('/', 1) + 1);
  }

  private async uploadFile(file: BufferedFile, bucket: string) {
    const timestamp = new Date().getTime().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');
    const ext = FileService.getExtension(file);
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Testing': 1234,
    };
    const fileName = hashedFileName + ext;
    const fileBuffer = file.buffer;
    return this.minioService.client
      .putObject(bucket, fileName, fileBuffer, metaData)
      .then(() => new FileUrl(`/${bucket}/${fileName}`))
      .catch((err) => {
        this.logger.error(err.message);
        throw new InternalServerErrorException(err.message);
      });
  }

  async upload(file: BufferedFile, bucket: string): Promise<FileUrl> {
    if (!(await this.minioService.client.bucketExists(bucket))) {
      await this.minioService.client.makeBucket(bucket, 'us-east-1');
    }
    return this.uploadFile(file, bucket);
  }

  async delete(objetName: string, bucket: string) {
    return this.minioService.client
      .removeObject(bucket, objetName)
      .then(() => {
        return new IsFileDeleted(true);
      })
      .catch((err) => {
        this.logger.error(err.message);
        throw new InternalServerErrorException(err.message);
      });
  }

  async get(url: string, res: Response) {
    const bucket = FileService.getBucket(url);
    const fileName = FileService.getFileName(url);
    try {
      this.minioService.client.getObject(
        bucket,
        fileName,
        (err, dataStream) => {
          if (err) {
            this.logger.error(
              err.message,
              `Filename: ${fileName} | Bucket: ${bucket}`,
            );
            res.sendStatus(404);
            return;
          }
          dataStream.pipe(res);
        },
      );
    } catch (err) {
      this.logger.error(
        err.message,
        `Filename: ${fileName} | Bucket: ${bucket}`,
      );
      res.sendStatus(500);
    }
  }
}
