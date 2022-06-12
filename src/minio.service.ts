import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { Client, ClientOptions } from 'minio';
import { BufferedFile } from './types/buffered-file.interface';
import { DeleteFileResponse, UploadFileResponse } from './dto/response.dto';
import { IMinioService } from './types/minio-service.interface';
import { MinioOptions } from './types/minio.options';
import { UploadValidator } from './types/upload-validator.interface';
import { MINIO_CONFIG, MINIO_OPTIONS } from './types/constants';
import { MinioMimeType } from './types/minio-mime-type.enum';

const Jimp = require('jimp');
const JPEG = require('jpeg-js');
const { promisify } = require('util');
const readByJimp = promisify(Jimp.read);

@Injectable()
export class MinioService implements IMinioService {
  //region [ Constructor ]
  public readonly service: Client;
  private readonly logger: Logger;
  private readonly directAccess: boolean = false;
  private readonly directPrefix: string;

  constructor(
    @Inject(MINIO_CONFIG) private minioConfig: ClientOptions,
    @Inject(MINIO_OPTIONS) private minioOptions: MinioOptions,
  ) {
    if (this.minioOptions?.directAccessPrefix) {
      this.directAccess = true;
      this.directPrefix = this.minioOptions?.directAccessPrefix;
      if (this.directPrefix.substr(this.directPrefix.length - 1) === '/') {
        this.directPrefix = this.directPrefix.substr(
          0,
          this.directPrefix.length - 1,
        );
      }
    }
    if (this.minioOptions?.compression) {
      this.minioOptions.compression.baseDim =
        this.minioOptions.compression.baseDim || 1024;
      this.minioOptions.compression.smallSize =
        this.minioOptions.compression.smallSize || 128;
    }
    this.service = new Client(this.minioConfig);
    this.logger = new Logger('MinioStorageService');
  }
  //endregion

  //region [ Private Methods ]
  private getExtension(file: BufferedFile) {
    return file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );
  }
  private getBucket(url: string) {
    return url.substr(1, url.indexOf('/', 1) - 1);
  }
  private getRealFileName(url: string) {
    return url.substr(url.indexOf('/', 1) + 1);
  }

  private getRandomString() {
    const timestamp = new Date().getTime().toString();
    return crypto.createHash('md5').update(timestamp).digest('hex');
  }

  private getRandomFileName(file: BufferedFile) {
    const ext = this.getExtension(file);
    const hashedFileName = this.getRandomString();
    return hashedFileName + ext;
  }

  private getMetaData(file: BufferedFile) {
    return {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Testing': 1234,
    };
  }

  private getFileName(
    fileName: string,
    bucketValidator: string,
    res: Response,
  ): { fileName: string; bucketName: string } {
    // remove base url if exists
    if (this.directAccess) {
      fileName = fileName.substr(this.directPrefix.length);
    }
    const realBucketName = this.getBucket(fileName);
    const realFileName = this.getRealFileName(fileName);

    // if bucket exists validate its name
    if (bucketValidator && bucketValidator !== realBucketName) {
      this.logger.error('Bucket names does not match.');
      this.logger.error(
        `Sent Bucket: ${realBucketName} | Bucket Validator: ${bucketValidator}`,
      );
      if (res) {
        res.setHeader('Content-Type', 'application/json');
      }
      throw new NotFoundException(`file ${fileName} not found`);
    }
    return { fileName: realFileName, bucketName: realBucketName };
  }

  private catchError(err: Error): never {
    this.logger.error(err.message);
    throw new InternalServerErrorException(err.message);
  }

  private async createBucket(bucket: string): Promise<void> {
    if (!(await this.service.bucketExists(bucket))) {
      await this.service.makeBucket(bucket, 'us-east-1');
    }
  }

  private async validateBeforeUpdate(
    file: BufferedFile,
    bucket: string,
    validator: UploadValidator,
  ) {
    if (validator) {
      // MIME Validation
      if (validator.validMimes && validator.validMimes.length) {
        const list = validator.validMimes.map((item) =>
          item.toString().toLowerCase(),
        );
        if (!list.includes(file.mimetype.toLowerCase())) {
          throw new UnsupportedMediaTypeException();
        }
      }
      // Size Validation
      if (validator.maxSize) {
        if (validator.maxSize * 1000 < file.size) {
          throw new PayloadTooLargeException(
            `maximum size is set to ${validator.maxSize} kilobytes`,
          );
        }
      }
    }
    await this.createBucket(bucket);
  }

  private async singleUpload(
    file: BufferedFile,
    bucket: string,
  ): Promise<UploadFileResponse> {
    const metaData = this.getMetaData(file);
    const fileName = this.getRandomFileName(file);

    return this.service
      .putObject(bucket, fileName, file.buffer, metaData)
      .then(() => {
        const url = this.makeUrl(bucket, fileName);
        return new UploadFileResponse(url);
      })
      .catch((err) => this.catchError(err));
  }

  private async multipleUpload(
    file: BufferedFile,
    bucket: string,
  ): Promise<UploadFileResponse> {
    Jimp.decoders['image/jpeg'] = (data) =>
      JPEG.decode(data, { maxMemoryUsageInMB: 1024 });

    const originalBuffer = file.buffer;
    const jimpImage = await readByJimp(file.buffer);

    const { width, height } = this.rescaleDims(jimpImage);

    const uploadAllResponse = new UploadFileResponse();
    const metaData = this.getMetaData(file);
    const fileName = this.getRandomFileName(file);
    const mimeType =
      metaData['Content-Type'] === MinioMimeType.JPEG
        ? Jimp.MIME_JPEG
        : Jimp.MIME_PNG;

    const largeFileName = this.addSuffixToFileName(fileName, '_lg');
    const smallFileName = this.addSuffixToFileName(fileName, '_sm');

    if (this.minioOptions?.compression?.original) {
      await this.service.putObject(bucket, fileName, originalBuffer);
      uploadAllResponse.url = this.makeUrl(bucket, fileName);
    }

    if (this.minioOptions?.compression?.large) {
      await jimpImage
        .quality(50)
        .resize(width, height)
        .getBuffer(mimeType, async (err, img) => {
          if (err) throw new InternalServerErrorException(err);
          await this.service.putObject(bucket, largeFileName, img);
        });

      uploadAllResponse.largeUrl = this.makeUrl(bucket, largeFileName);
    }

    if (this.minioOptions?.compression?.small) {
      const { smallSize } = this.minioOptions.compression;
      await jimpImage
        .quality(50)
        .resize(smallSize, smallSize)
        .getBuffer(mimeType, async (err, img) => {
          if (err) throw new InternalServerErrorException(err);
          await this.service.putObject(bucket, smallFileName, img);
        });
      uploadAllResponse.smallUrl = this.makeUrl(bucket, smallFileName);
    }

    return uploadAllResponse;
  }

  private rescaleDims(jimpImage) {
    const baseDim = this.minioOptions.compression.baseDim;
    let height = jimpImage.getHeight();
    let width = jimpImage.getWidth();
    if (height > 2000 || width > 2000) {
      if (height > width) {
        width = (baseDim / height) * width;
        height = baseDim;
      } else {
        height = (baseDim / width) * height;
        width = baseDim;
      }
    }
    return { height, width };
  }

  private addSuffixToFileName(fileName: string, suffix: string) {
    return fileName.split('.')[0] + suffix + '.' + fileName.split('.')[1];
  }

  private makeUrl(bucket: string, fileName: string) {
    const url = '/' + bucket + '/' + fileName;
    if (this.directAccess && this.directPrefix.length) {
      return this.directPrefix + url;
    }
    return url;
  }
  //endregion

  //region [ Public Methods ]
  async upload(
    file: BufferedFile,
    bucket: string,
    validator?: UploadValidator,
  ): Promise<UploadFileResponse> {
    if (!file) {
      throw new BadRequestException('file cannot be empty');
    }
    await this.validateBeforeUpdate(file, bucket, validator);
    const compressibleTypes: string[] = [MinioMimeType.PNG, MinioMimeType.JPEG];
    if (
      this.minioOptions?.compression?.enable &&
      compressibleTypes.includes(file.mimetype)
    ) {
      return this.multipleUpload(file, bucket);
    }
    return this.singleUpload(file, bucket);
  }

  async delete(
    path: string,
    bucketValidator: string,
  ): Promise<DeleteFileResponse> {
    const { fileName, bucketName } = this.getFileName(
      path,
      bucketValidator,
      null,
    );
    await this.service.removeObject(bucketName, fileName);
    return new DeleteFileResponse(true);
  }

  async get(
    res: Response,
    path: string,
    bucketValidator: string = null,
  ): Promise<void> {
    const { fileName, bucketName } = this.getFileName(
      path,
      bucketValidator,
      res,
    );
    try {
      const data = await this.service.getObject(bucketName, fileName);
      data.pipe(res);
    } catch (e) {
      this.logger.error(e.message);
      res.setHeader('Content-Type', 'application/json');
      throw new NotFoundException(`file ${path} not found`);
    }
  }
  //endregion
}
