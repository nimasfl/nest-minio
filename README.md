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
    MinioModule.register(
      {
        accessKey: process.env.MINIO_ACCESS_KEY,
        endPoint: process.env.MINIO_HOST,
        port: +process.env.MINIO_PORT,
        secretKey: process.env.MINIO_SECRET_KEY,
        useSSL: false,
      },
      {
        directAccessPrefix: 'http://localhost:9000', // OPTIONAL
        compression: {
          enabled: true,
          original: true,
          medium: true,
          small: true,
          smallSize: 128,
          baseDim: 1024,
        },
      },
    ),
  ],
})
```

`MinioModule` takes 2 arguments as input.

The first is the configuration which you can use `ClientOptions` interface from minio package to write a config file for this module.

The second one is custom options which will be described in another section.

Once you did last part you only need to inject `MinioService` class in your service files in order to make use of this module.
```typescript
// src/example/example.service.ts

import { MinioService } from '@nimasfl/nest-minio';

@Injectable()
export class FileUploadService {
  constructor(private minioService: MinioService) {}
```
Note that in following examples `BufferedFile`, `MinioMimeType` and `MinioService` classes are imported from `@nimasfl/nest-minio`


### Config
All the configuration needed to startup this module, is referenced in [official minio javascript API reference](https://docs.min.io/docs/javascript-client-api-reference.html).


### Options
For now we have directAccessPrefix and compression options.

`directAccessPrefix` is for the scenario where you need absolute url of the file.

`compression` only applies to `image/png` and `image/jpeg` mime types and you can also mention small size that you desired


####  directAccessPrefix
this option enables you to get the absolute url when uploading a file, or use this absolute url when you want to get a file.

For example when using this module the response of upload method will be like
```json
{
  "isFileUploaded": true,
  "url": "http://localhost:9000/test/f4fc1cc1fa377f1b80176b64ccf92ff7.png",
  "smallUrl": null,
  "largeUrl": null
}
```
instead of
```json
{
  "isFileUploaded": true,
  "url": "/test/f4fc1cc1fa377f1b80176b64ccf92ff7.png",
  "smallUrl": null,
  "largeUrl": null
}
```
Then you can use this stored url to the get method.

 Whether you are using this option or not, any string that exists
 in the url response of upload method can be used to fetch that file
 using the get method.


### Using MinioService Methods

following file is a controller file example that uses every method of this module.


```typescript

import { Response } from 'express';
import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Res,
  UploadedFile,
} from '@nestjs/common';
import {
  BufferedFile,
  DeleteFileResponse,
  MinioMimeType,
  MinioService,
  Upload,
  UploadFileResponse,
} from '@nimasfl/nest-minio';

@Controller('/uploads')
export class FileUploadController {
  constructor(private minioService: MinioService) {}

  @Post()
  // Upload decorator configures swagger and uses nest's interceptor to get the file by its name
  @Upload('image')
  async uploadSingle(
    @UploadedFile() image: BufferedFile,
  ): Promise<UploadFileResponse> {
    // Third argument of this method (validator) is optional and wont check anything if its not sent.
    return this.minioService.upload(image, 'testBucket', {
      maxSize: 35, // Maximum size allowed to upload.
      validMimes: [MinioMimeType.PNG, MinioMimeType.JPEG], // Allowed file types tp be uploaded.
    });
  }

  @Delete('/:fileName')
  async delete(
    @Param('fileName') fileName: string,
  ): Promise<DeleteFileResponse> {
    // Second argument of this method (bucketValidator) is optional.
    // you can check whether if the requested file is in the required bucket or not.
    return this.minioService.delete(fileName, 'testBucket');
  }

  @Get('/:fileName')
  // You can set Content-Type based on the file you're trying to fetch.
  @Header('Content-Type', 'application/octet-stream')
  async get(@Param('fileName') fileName: string, @Res() res: Response) {
    // Third argument of this method (bucketValidator) is optional.
    // you can check whether if the requested file is in the required bucket or not.
    return this.minioService.get(res, fileName, 'testBucket');
  }
}

```

Just remember in the `minioService.get()` method you need to pass the raw response
of the request (imported from `express`) to the method. So if you want to use `@Next` decorator
in this controller, you should use it wisely as NestJS said in its docs:

> Nest detects when the handler is using either @Res() or @Next(),
> indicating you have chosen the library-specific option.
> If both approaches are used at the same time, the Standard approach is automatically disabled
> for this single route and will no longer work as expected.
> To use both approaches at the same time (for example, by injecting the response object
> to only set cookies/headers but still leave the rest to the framework),
> you must set the passthrough option to true in the @Res({ passthrough: true }) decorator.
