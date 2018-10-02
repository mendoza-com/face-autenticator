import * as handler from '../photo/photo';
import * as mock from './mocks/photo';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe ('photo_add', async () => {

  test('photo_fail', async () => {
    
    const event = mock.image_fail;
    const context = 'context';
    const callback = (error, response) => {
      expect(response.statusCode).toEqual(400);
      expect(typeof response.body).toBe("string");
    };

    await handler.add(event, context, callback);
  });

  test('photo_ok', async () => {

    const event = mock.image_ok;
    const context = 'context';
    const callback = (error, response) => {
      expect(response.statusCode).toEqual(200);
      expect(typeof response.body).toBe("string");
    };

    await handler.add(event, context, callback);
  });
})