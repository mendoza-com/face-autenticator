import * as handler from '../validation/validation';
import * as mock from './mocks/validation';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe ('validation', async () => {

  describe ('validation_get', async () => {
    test('get_user_validation', async () => {

      const event = mock.validUser;
      const context = 'context';
      const callback = (error, response) => {
        console.log('get',response);
        expect(response.statusCode).toEqual(200);
        expect(typeof response.body).toBe("string");
      };

      await handler.get(event, context, callback);
    });
    
    test('get_not_valid_user_validation', async () => {

      const event = mock.notValidUser;
      const context = 'context';
      const callback = (error, response) => {
        expect(response.statusCode).toEqual(200);
        expect(typeof response.body).toBe("string");
      };

      await handler.get(event, context, callback);
    });
  });

  describe ("validation_update", async () => { 
    test('update_user_validation', async () => {

      const event = mock.validUser;
      const context = 'context';
      const callback = (error, response) => {
        console.log('update',response);
        expect(response.statusCode).toEqual(200);
        expect(typeof response.body).toBe("string");
      };

      await handler.update(event, context, callback);
    });
    test('try_to_update_not_valid_user_validation', async () => {

      const event = mock.notValidUser;
      const context = 'context';
      const callback = (error, response) => {
        expect(response.statusCode).toEqual(200);
        expect(typeof response.body).toBe("string");
      };

      await handler.update(event, context, callback);
    });
  });
});