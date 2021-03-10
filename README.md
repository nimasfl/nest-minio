# Nest Minio Module
This package developed to handle minio requests in nestjs application as easy as possible.

## Installation
Install the package:
```
npm install @nimasfl/nest-minio --save
```

## Usage

### Import
First you should register the module in your main module for example `app.module`. since it's a global package, it will be available in every other module you're using.
```typescript
// src/app.module.ts

@Module({
  imports: [
    FileModule.register({
      accessKey: 'random-access-key',
      endPoint: 'localhost',
      port: 9000,
      secretKey: 'random-secret-key',
      useSSL: false,
    }),
    ...
  ],
  ...
})
```

You can use `MinioConfig` interface to write a config file for this module.
then you must use `FileService` class in your service files in order to make use of this module.
```typescript
// src/example/example.service.ts

import { FileService } from '@nimasfl/nest-minio';

@Injectable()
export class FileUploadService {
  constructor(private fileService: FileService) {}
  ...
```
Note that in following examples `BufferedFile`, `AppMimeType` and `FileService` classes are imported from `@nimasfl/nest-minio`

### Upload File

```typescript
// src/example/example.service.ts

async uploadImage(image: BufferedFile) {
    if (!image.mimetype.includes(AppMimeType.PNG)) {
      throw new UnsupportedMediaTypeException();
    }
    return this.fileService.upload(image, 'testBucket');
  }
```
### Delete File

```typescript
  async delete(fileName: string) {
    await this.fileService.delete(fileName, 'testBucket');
  }
```
### Get File
```typescript
  // Here fileName contains bucket name
  // for example /testBucket/f276953ac23604d2bc4b1a16990b0cf4.png
  async get(fileName: string, res: Response) {
    return this.fileService.get(fileName, res);
  }
```
