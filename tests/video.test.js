import * as handler from '../video/video';
import * as mock from './mocks/video';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe ('video_test', async () => {

  describe ('video_add', async () => {
    test('add_video_with_face', async () => {

      const event = mock.image_video;
      const context = 'context';
      const callback = (error, response) => {
        expect(response.statusCode).toEqual(200);
        expect(typeof response.body).toBe("string");
      };

      await handler.add(event, context, callback);
    });
  });

  describe ("video_process", async () => { 
    test('video_ok', async () => {
      
      const event = mock.event;
      const context = 'context';
      const callback = (error, response) => {
        expect(response.statusCode).toEqual(200);
        expect(typeof response.body).toBe("string");
      };

      await handler.process(event, context, callback);
    });
  });
});