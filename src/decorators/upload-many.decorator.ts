import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiManyFile } from './api-many-file.decorator';

export const UploadMany = (fileNames: string[]) => {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiManyFile(fileNames),
    UseInterceptors(
      FileFieldsInterceptor(
        fileNames.map((fileName) => ({
          name: fileName,
          maxCount: 1,
        })),
      ),
    ),
  );
};
