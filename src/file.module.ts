import { Module, DynamicModule, Global } from "@nestjs/common";
import { FileService } from "./file.service";
import { MinioModule } from "nestjs-minio-client";
import { MinioConfigInterface } from "./types/minio.config.interface";

@Global()
@Module({})
export class FileModule {
  static register(minioConfig: MinioConfigInterface): DynamicModule {
    return {
      module: FileModule,
      imports: [
        MinioModule.register({
          endPoint: minioConfig.endPoint,
          port: minioConfig.port,
          useSSL: minioConfig.useSSL,
          accessKey: minioConfig.accessKey,
          secretKey: minioConfig.secretKey,
        }),
      ],
      providers: [FileService],
      exports: [FileService],
    };
  }
}
