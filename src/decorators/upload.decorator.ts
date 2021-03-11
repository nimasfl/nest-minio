import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiFile } from './api-file.decorator';

export const Upload = (fileName: string) => {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiFile(fileName),
    UseInterceptors(FileInterceptor(fileName)),
  );
};
