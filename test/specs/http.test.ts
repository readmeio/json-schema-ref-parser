/* eslint-disable no-unused-expressions */
import { host } from '@jsdevtools/host-environment';
import { describe, it, expect } from 'vitest';

import $RefParser from '../../lib';

describe('HTTP options', () => {
  describe('http.headers', () => {
    it('should override default HTTP headers', async () => {
      const parser = new $RefParser();

      const schema = await parser.parse('https://httpbin.org/headers', {
        resolve: {
          http: {
            headers: {
              accept: 'application/json',
            },
          },
        },
      });

      expect(schema.headers).to.have.property('Accept', 'application/json');
    });

    it('should set custom HTTP headers', async () => {
      const parser = new $RefParser();

      const schema = await parser.parse('https://httpbin.org/headers', {
        resolve: {
          http: {
            headers: {
              'my-custom-header': 'hello, world',
            },
          },
        },
      });

      expect(schema.headers).to.have.property('My-Custom-Header', 'hello, world');
    });
  });

  // 2020-07-08 - The HTTPBin redirect endpoints are suddenly returning 404 errors. Not sure why 🤷‍♂️
  // TODO: Re-enable these tests once HTTPBin is working again
  // eslint-disable-next-line vitest/no-disabled-tests
  describe.skip('http.redirect', { timeout: 30000 }, () => {
    it('should follow 5 redirects by default', async () => {
      const parser = new $RefParser();

      const schema = await parser.parse('https://httpbin.org/redirect/5');
      expect(schema.url).to.equal('https://httpbin.org/get');
    });

    it('should not follow 6 redirects by default', async () => {
      try {
        const parser = new $RefParser();
        const schema = await parser.parse('https://httpbin.org/redirect/6');

        if (host.node) {
          throw new Error('All 6 redirects were followed. That should NOT have happened!');
        } else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          expect(schema.url).to.equal('https://httpbin.org/get');
        }
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('Error downloading https://httpbin.org/redirect/6');
        if (host.node) {
          expect(err.message).to.equal(
            'Error downloading https://httpbin.org/redirect/6. \n' +
              'Too many redirects: \n' +
              '  https://httpbin.org/redirect/6 \n' +
              '  https://httpbin.org/relative-redirect/5 \n' +
              '  https://httpbin.org/relative-redirect/4 \n' +
              '  https://httpbin.org/relative-redirect/3 \n' +
              '  https://httpbin.org/relative-redirect/2 \n' +
              '  https://httpbin.org/relative-redirect/1',
          );
        }
      }
    });

    it('should follow 10 redirects if http.redirects = 10', async () => {
      const parser = new $RefParser();

      const schema = await parser.parse('https://httpbin.org/redirect/10', {
        resolve: { http: { redirects: 10 } },
      });

      expect(schema.url).to.equal('https://httpbin.org/get');
    });

    it('should not follow any redirects if http.redirects = 0', async () => {
      try {
        const parser = new $RefParser();
        const schema = await parser.parse('https://httpbin.org/redirect/1', {
          resolve: { http: { redirects: 0 } },
        });

        if (host.node) {
          throw new Error('The redirect was followed. That should NOT have happened!');
        } else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          expect(schema.url).to.equal('https://httpbin.org/get');
        }
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('Error downloading https://httpbin.org/redirect/1');
        if (host.node) {
          expect(err.message).to.equal(
            'Error downloading https://httpbin.org/redirect/1. \n' +
              'Too many redirects: \n' +
              '  https://httpbin.org/redirect/1',
          );
        }
      }
    });
  });

  describe('http.withCredentials', () => {
    it('should work by default with CORS "Access-Control-Allow-Origin: *"', async () => {
      const parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // This should work by-default.
      const schema = await parser.parse('https://petstore.swagger.io/v2/swagger.json');

      expect(schema).to.be.an('object');
      expect(schema).not.to.be.empty;
      expect(parser.schema).to.equal(schema);
    });

    it('should download successfully with http.withCredentials = false (default)', async () => {
      const parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
      const schema = await parser.parse('https://petstore.swagger.io/v2/swagger.json', {
        resolve: { http: { withCredentials: false } },
      });

      expect(schema).to.be.an('object');
      expect(schema).not.to.be.empty;
      expect(parser.schema).to.equal(schema);
    });
  });
});
