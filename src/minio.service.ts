import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { promisify } from "util";
import { Response } from "express";
import { MinioService as ClientService } from "nestjs-minio-client";
import { BufferedFile } from "./types/file.model";
import * as crypto from "crypto";

@Injectable()
export class MinioService {
  private readonly logger: Logger;
  private readonly makeBucket;
  private readonly bucketExists;
  private readonly putObject;
  private readonly removeObject;

  constructor(private readonly minio: ClientService) {
    this.logger = new Logger("MinioStorageService");
    this.makeBucket = promisify(this.minio.client.makeBucket);
    this.bucketExists = promisify(this.minio.client.bucketExists);
    this.putObject = promisify(this.minio.client.putObject);
    this.removeObject = promisify(this.minio.client.removeObject);
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
    const ext = MinioService.getExtension(file);
    const metaData = {
      "Content-Type": file.mimetype,
      "X-Amz-Meta-Testing": 1234,
    };
    const fileName = hashedFileName + ext;
    const fileBuffer = file.buffer;
    return this.putObject(bucket, fileName, fileBuffer, metaData)
      .then(() => {
        return { url: "/" + bucket + "/" + fileName };
      })
      .catch((err) => {
        this.logger.error(err.message, err.stack);
        throw new BadRequestException("failed to upload file");
      });
  }

  async delete(objetName: string, bucket: string) {
    this.minio.client.removeObject(bucket, objetName).catch((err) => {
      this.logger.error(err.message, err.stack);
      throw new BadRequestException("failed to delete file");
    });
  }

  async get(url: string, res: Response) {
    const bucket = MinioService.getBucket(url);
    const fileName = MinioService.getFileName(url);
    this.minio.client.getObject(bucket, fileName, (err, dataStream) => {
      if (err) {
        this.logger.error(err.message, err.stack);
        throw new BadRequestException("failed to fetch file");
      }
      dataStream.pipe(res);
    });
  }
}
