import { Module, DynamicModule, Global } from '@nestjs/common';
import { ClientOptions } from 'minio';
import { MinioService } from './minio.service';
import { MinioOptions } from './types/minio.options';
import { MINIO_CONFIG, MINIO_OPTIONS } from './types/constants';

@Global()
@Module({})
export class MinioModule {
  static register(
    minioConfig: ClientOptions,
    minioOptions: MinioOptions = null,
  ): DynamicModule {
    return {
      global: true,
      module: MinioModule,
      providers: [
        { provide: MINIO_CONFIG, useValue: minioConfig },
        { provide: MINIO_OPTIONS, useValue: minioOptions },
        MinioService,
      ],
      exports: [MinioService],
    };
  }
}
