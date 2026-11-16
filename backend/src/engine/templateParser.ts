import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

export interface TemplateContext {
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  body?: any;
}

/**
 * Resolves a dynamic string tag (e.g. {{faker.internet.email}} or {{request.params.id}}).
 */
export function evaluateTag(tagContent: string, context: TemplateContext): string {
  const trimmed = tagContent.trim();

  // 1. Built-in system tags
  if (trimmed === 'uuid') {
    return uuidv4();
  }
  if (trimmed === 'timestamp') {
    return Math.floor(Date.now() / 1000).toString();
  }
  if (trimmed === 'isoDate') {
    return new Date().toISOString();
  }

  // 2. Request parameter substitution
  if (trimmed.startsWith('request.params.')) {
    const paramKey = trimmed.replace('request.params.', '');
    return context.params[paramKey] ?? '';
  }
  if (trimmed.startsWith('request.query.')) {
    const queryKey = trimmed.replace('request.query.', '');
    return context.query[queryKey] ?? '';
  }
  if (trimmed.startsWith('request.body.') && context.body && typeof context.body === 'object') {
    const bodyKey = trimmed.replace('request.body.', '');
    return context.body[bodyKey] !== undefined ? String(context.body[bodyKey]) : '';
  }

  // 3. Faker.js Dynamic Data Generators
  if (trimmed.startsWith('faker.')) {
    try {
      // Handle faker.number.int(min, max)
      const numberIntMatch = trimmed.match(/^faker\.number\.int\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);
      if (numberIntMatch) {
        const min = parseInt(numberIntMatch[1], 10);
        const max = parseInt(numberIntMatch[2], 10);
        return faker.number.int({ min, max }).toString();
      }

      // Safe lookup for popular faker generators
      switch (trimmed) {
        case 'faker.name.fullName':
        case 'faker.person.fullName':
          return faker.person.fullName();
        case 'faker.name.firstName':
        case 'faker.person.firstName':
          return faker.person.firstName();
        case 'faker.name.lastName':
        case 'faker.person.lastName':
          return faker.person.lastName();
        case 'faker.internet.email':
          return faker.internet.email().toLowerCase();
        case 'faker.internet.userName':
          return faker.internet.userName().toLowerCase();
        case 'faker.internet.url':
          return faker.internet.url();
        case 'faker.image.avatar':
          return faker.image.avatar();
        case 'faker.company.name':
          return faker.company.name();
        case 'faker.location.city':
          return faker.location.city();
        case 'faker.location.country':
          return faker.location.country();
        case 'faker.phone.number':
          return faker.phone.number();
        case 'faker.lorem.sentence':
          return faker.lorem.sentence();
        case 'faker.lorem.paragraph':
          return faker.lorem.paragraph();
        default:
          return `[Unsupported tag: ${trimmed}]`;
      }
    } catch (e) {
      console.error(`Error resolving faker tag "${trimmed}":`, e);
      return '';
    }
  }

  return `{{${tagContent}}}`;
}

/**
 * Replaces all {{...}} tags inside a string.
 */
export function interpolateString(template: string, context: TemplateContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, tag) => {
    return evaluateTag(tag, context);
  });
}

/**
 * Recursively parses and interpolates dynamic tags across any object, array, or string.
 */
export function parseTemplate(template: any, context: TemplateContext): any {
  if (template === null || template === undefined) {
    return template;
  }

  if (typeof template === 'string') {
    // If the entire string is a number generator tag, convert to a real number
    const numberIntMatch = template.match(/^\{\{\s*faker\.number\.int\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*\}\}$/);
    if (numberIntMatch) {
      const min = parseInt(numberIntMatch[1], 10);
      const max = parseInt(numberIntMatch[2], 10);
      return faker.number.int({ min, max });
    }
    if (template.trim() === '{{timestamp}}') {
      return Math.floor(Date.now() / 1000);
    }
    return interpolateString(template, context);
  }

  if (Array.isArray(template)) {
    return template.map((item) => parseTemplate(item, context));
  }

  if (typeof template === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(template)) {
      result[key] = parseTemplate(val, context);
    }
    return result;
  }

  return template;
}

