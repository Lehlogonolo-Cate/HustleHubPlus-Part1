const { sanitizeInput, stripHtml } = require('../../src/middleware/sanitize');
const AppError = require('../../src/utils/AppError');

const run = (body) => {
  const req = { body, path: '/test', ip: '127.0.0.1' };
  sanitizeInput(req, {}, () => {});
  return req.body;
};

describe('stripHtml', () => {
  it('removes script tags and their contents', () => {
    expect(stripHtml({ title: 'Logo <script>alert(1)</script>design' }).title).toBe('Logo design');
  });

  it('removes HTML tags and event-handler attributes', () => {
    expect(stripHtml({ title: '<img src=x onerror=alert(1)>Nice' }).title).toBe('Nice');
  });

  it('leaves passwords untouched', () => {
    expect(stripHtml({ password: 'P<ss>w0rd!' }).password).toBe('P<ss>w0rd!');
  });

  it('sanitises nested objects and arrays', () => {
    const result = stripHtml({ list: ['<b>bold</b>'], nested: { text: '<i>x</i>' } });
    expect(result).toEqual({ list: ['bold'], nested: { text: 'x' } });
  });
});

describe('sanitizeInput', () => {
  it('rejects MongoDB operators in the body', () => {
    expect(() => run({ email: { $ne: null } })).toThrow(AppError);
  });

  it('rejects operators hidden in arrays', () => {
    expect(() => run({ items: [{ $where: 'sleep(1000)' }] })).toThrow(AppError);
  });

  it('rejects dotted keys', () => {
    expect(() => run({ 'profile.role': 'admin' })).toThrow(AppError);
  });

  it('passes normal input through', () => {
    expect(run({ email: 'a@b.com', price: 100 })).toEqual({ email: 'a@b.com', price: 100 });
  });
});
