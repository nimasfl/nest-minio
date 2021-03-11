import { Module, DynamicModule, Global } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioConfig } from './types/minio.config.type';
import { MinioOptions } from './types/minio.options.type';

@Global()
@Module({})
export class MinioModule {
  static register(
    minioConfig: MinioConfig,
    minioOptions: MinioOptions = null,
  ): DynamicModule {
    return {
      module: MinioModule,
      providers: [
        { provide: 'MINIO_CONFIG', useValue: minioConfig },
        { provide: 'MINIO_OPTIONS', useValue: minioOptions },
        MinioService,
      ],
      exports: [MinioService],
    };
  }
}
