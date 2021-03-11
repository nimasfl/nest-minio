import { ApiBody } from '@nestjs/swagger';

export const ApiManyFile = (fileNames: string[]): MethodDecorator => (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => {
  const properties = {};
  fileNames.forEach((fileName) => {
    properties[fileName] = {
      type: 'string',
      format: 'binary',
    };
  });
  ApiBody({
    schema: {
      type: 'object',
      properties,
    },
  })(target, propertyKey, descriptor);
};
