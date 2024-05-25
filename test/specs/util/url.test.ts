import { describe, it, expect } from 'vitest';

import $url from '../../../lib/util/url';

describe('Return the extension of a URL', () => {
  it("should return an empty string if there isn't any extension", () => {
    const extension = $url.getExtension('/file');
    expect(extension).to.equal('');
  });

  it('should return the extension in lowercase', () => {
    const extension = $url.getExtension('/file.YML');
    expect(extension).to.equal('.yml');
  });

  it('should return the extension without the query', () => {
    const extension = $url.getExtension('/file.yml?foo=bar');
    expect(extension).to.equal('.yml');
  });
});
