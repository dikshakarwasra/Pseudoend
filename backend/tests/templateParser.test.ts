import { describe, it, expect } from 'vitest';
import { parseTemplate, evaluateTag } from '../src/engine/templateParser.js';

describe('templateParser', () => {
  const context = {
    params: { id: '42', category: 'electronics' },
    query: { page: '2', limit: '20' },
    body: { username: 'alice' }
  };

  it('evaluates built-in system tags (uuid, timestamp, isoDate)', () => {
    const uuid = evaluateTag('uuid', context);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const timestamp = evaluateTag('timestamp', context);
    expect(Number(timestamp)).toBeGreaterThan(1700000000);

    const isoDate = evaluateTag('isoDate', context);
    expect(new Date(isoDate).toISOString()).toBe(isoDate);
  });

  it('substitutes path parameters, query parameters, and body values', () => {
    expect(evaluateTag('request.params.id', context)).toBe('42');
    expect(evaluateTag('request.params.category', context)).toBe('electronics');
    expect(evaluateTag('request.query.page', context)).toBe('2');
    expect(evaluateTag('request.body.username', context)).toBe('alice');
  });

  it('generates dynamic faker data', () => {
    const name = evaluateTag('faker.name.fullName', context);
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(2);

    const email = evaluateTag('faker.internet.email', context);
    expect(email).toContain('@');

    const number = evaluateTag('faker.number.int(10, 50)', context);
    const num = Number(number);
    expect(num).toBeGreaterThanOrEqual(10);
    expect(num).toBeLessThanOrEqual(50);
  });

  it('recursively interpolates nested JSON templates', () => {
    const template = {
      id: '{{request.params.id}}',
      user: {
        name: '{{faker.name.fullName}}',
        email: '{{faker.internet.email}}'
      },
      tags: ['{{request.params.category}}', 'verified']
    };

    const result = parseTemplate(template, context);
    expect(result.id).toBe('42');
    expect(result.user.name.length).toBeGreaterThan(2);
    expect(result.user.email).toContain('@');
    expect(result.tags).toEqual(['electronics', 'verified']);
  });
});

