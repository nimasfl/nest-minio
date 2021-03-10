import { Module, DynamicModule, Global } from "@nestjs/common";
import { MinioService } from "./minio.service";
import { MinioModule as ClientModule } from "nestjs-minio-client";
import { MinioConfigInterface } from "./types/minio.config.interface";

@Global()
@Module({})
export class MinioModule {
  static register(minioConfig: MinioConfigInterface): DynamicModule {
    return {
      module: MinioModule,
      imports: [
        ClientModule.register({
          endPoint: minioConfig.endPoint,
          port: minioConfig.port,
          useSSL: minioConfig.useSSL,
          accessKey: minioConfig.accessKey,
          secretKey: minioConfig.secretKey,
        }),
      ],
      providers: [
        {
          provide: MinioService,
          useClass: MinioService,
        },
      ],
      controllers: [],
      exports: [
        {
          provide: MinioService,
          useClass: MinioService,
        },
      ],
    };
  }
}
