import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { promisify } from "util";
import { Response } from "express";
import { MinioService } from "nestjs-minio-client";
import { BufferedFile } from "./types/file.model";
import * as crypto from "crypto";

@Injectable()
export class FileService {
  private readonly logger: Logger;
  private readonly makeBucket;
  private readonly bucketExists;
  private readonly putObject;
  private readonly removeObject;

  constructor(private readonly minioService: MinioService) {
    this.logger = new Logger("MinioStorageService");
    this.makeBucket = promisify(this.minioService.client.makeBucket);
    this.bucketExists = promisify(this.minioService.client.bucketExists);
    this.putObject = promisify(this.minioService.client.putObject);
    this.removeObject = promisify(this.minioService.client.removeObject);
  }

  private static getExtension(file: BufferedFile) {
    return file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
  }
  private static getBucket(url: string) {
    return url.substr(1, url.indexOf("/", 1) - 1);
  }
  private static getFileName(url: string) {
    return url.substr(url.indexOf("/", 1) + 1);
  }

  public async upload(
    file: BufferedFile,
    bucket: string
  ): Promise<{ url: string }> {
    this.bucketExists(bucket).catch(() => {
      this.makeBucket(bucket);
    });
    const timestamp = new Date().getTime().toString();
    const hashedFileName = crypto
      .createHash("md5")
      .update(timestamp)
      .digest("hex");
    const ext = FileService.getExtension(file);
    const metaData = {
      "Content-Type": file.mimetype,
      "X-Amz-Meta-Testing": 1234,
    };
    const fileName = hashedFileName + ext;
    const fileBuffer = file.buffer;
    await this.minioService.client.putObject(
      bucket,
      fileName,
      fileBuffer,
      metaData
    );
    return { url: `/${bucket}/${fileName}` };
  }

  async delete(objetName: string, bucket: string) {
    this.minioService.client.removeObject(bucket, objetName).catch((err) => {
      this.logger.error(err.message, err.stack);
      throw new BadRequestException("failed to delete file");
    });
  }

  async get(url: string, res: Response) {
    const bucket = FileService.getBucket(url);
    const fileName = FileService.getFileName(url);
    this.minioService.client.getObject(bucket, fileName, (err, dataStream) => {
      if (err) {
        this.logger.error(err.message, err.stack);
        throw new BadRequestException("failed to fetch file");
      }
      dataStream.pipe(res);
    });
  }
}
