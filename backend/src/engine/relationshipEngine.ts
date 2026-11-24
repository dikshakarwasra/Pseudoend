import { EntityNode, RelationshipEdge, MockRouteRecord } from '../types/index.js';

/**
 * Intelligent Schema Analysis & Relationship Detection Engine
 */

export interface OpenApiSchema {
  openapi?: string;
  swagger?: string;
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
  definitions?: Record<string, any>;
}

const COLOR_PALETTE = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1'  // Indigo
];

/**
 * Normalizes resource name (e.g., 'users' -> 'users', '/api/users/:id' -> 'users')
 */
export function extractResourceName(path: string): string | null {
  const segments = path.replace(/^\//, '').split('/').filter(Boolean);
  const filtered = segments.filter(s => !['api', 'mock'].includes(s.toLowerCase()) && !/^v\d+$/i.test(s));
  if (filtered.length === 0) return null;
  const root = filtered.find(s => !s.startsWith(':') && !s.startsWith('{'));
  return root ? root.toLowerCase() : null;
}

/**
 * Infers field type from a JavaScript value
 */
function inferType(val: any): string {
  if (val === null || val === undefined) return 'string';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'number') return Number.isInteger(val) ? 'integer' : 'float';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'object') return 'object';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return 'date-time';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'email';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}/.test(val)) return 'uuid';
    return 'string';
  }
  return 'string';
}

/**
 * Analyzes routes and their response bodies to automatically extract nodes and relationship edges.
 */
export function analyzeSchemaFromRoutes(routes: MockRouteRecord[]): {
  nodes: EntityNode[];
  edges: RelationshipEdge[];
} {
  const resourceMap: Map<string, {
    fields: Map<string, { type: string; isPrimary?: boolean; required?: boolean }>;
    samples: any[];
  }> = new Map();

  for (const route of routes) {
    const resource = extractResourceName(route.path);
    if (!resource || resource === 'echo') continue;

    if (!resourceMap.has(resource)) {
      resourceMap.set(resource, { fields: new Map(), samples: [] });
    }

    const entry = resourceMap.get(resource)!;

    // Analyze response body if object or array
    let body = route.responseBody;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* ignore */ }
    }

    const inspectObject = (obj: any) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      entry.samples.push(obj);
      for (const [key, val] of Object.entries(obj)) {
        if (!entry.fields.has(key)) {
          const isPrimary = ['id', '_id', `${resource}Id`, `${resource}_id`].includes(key.toLowerCase());
          entry.fields.set(key, {
            type: inferType(val),
            isPrimary,
            required: isPrimary
          });
        }
      }
    };

    if (Array.isArray(body)) {
      body.slice(0, 5).forEach(inspectObject);
    } else if (body && typeof body === 'object') {
      // Check for nested arrays (e.g., { users: [...] })
      let foundNested = false;
      for (const [k, v] of Object.entries(body)) {
        if (Array.isArray(v) && k.toLowerCase() === resource) {
          v.slice(0, 5).forEach(inspectObject);
          foundNested = true;
          break;
        }
      }
      if (!foundNested) {
        inspectObject(body);
      }
    }
  }

  // Ensure default primary key if none detected
  for (const [resource, data] of resourceMap.entries()) {
    if (!Array.from(data.fields.values()).some(f => f.isPrimary)) {
      data.fields.set('id', { type: 'string', isPrimary: true, required: true });
    }
  }

  // Build Entity Nodes
  const nodes: EntityNode[] = [];
  let colorIdx = 0;
  let col = 0;
  let row = 0;

  for (const [resource, data] of resourceMap.entries()) {
    const fields = Array.from(data.fields.entries()).map(([name, f]) => ({
      name,
      type: f.type,
      required: f.required,
      isPrimary: f.isPrimary
    }));

    nodes.push({
      id: resource,
      name: resource.charAt(0).toUpperCase() + resource.slice(1),
      resource,
      fields,
      recordCount: Math.max(data.samples.length, 5),
      color: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
      x: 100 + col * 320,
      y: 80 + row * 260
    });

    colorIdx++;
    col++;
    if (col >= 3) {
      col = 0;
      row++;
    }
  }

  // Detect Foreign-Key Relationships (Edges)
  const edges: RelationshipEdge[] = [];
  const nodeIds = nodes.map(n => n.id);

  for (const targetNode of nodes) {
    for (const field of targetNode.fields) {
      if (field.isPrimary) continue;

      const fName = field.name.toLowerCase();

      // Check matching candidate parent resources
      for (const sourceNode of nodes) {
        if (sourceNode.id === targetNode.id) continue;

        const sId = sourceNode.id.toLowerCase();
        // Singular form: 'users' -> 'user'
        const singular = sId.endsWith('s') ? sId.slice(0, -1) : sId;

        const isForeignKey = 
          fName === `${singular}id` ||
          fName === `${singular}_id` ||
          fName === `${sId}id` ||
          fName === `${sId}_id` ||
          fName === 'authorid' ||
          fName === 'creatorid' ||
          fName === 'parentid';

        if (isForeignKey && (singular === 'user' ? (fName.includes('user') || fName.includes('author') || fName.includes('creator')) : fName.includes(singular))) {
          const edgeId = `rel_${sourceNode.id}_${targetNode.id}_${field.name}`;
          if (!edges.some(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceNode.id,
              target: targetNode.id,
              sourceField: 'id',
              targetField: field.name,
              type: '1:N',
              label: `1 : N (${sourceNode.name} -> ${targetNode.name})`
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Analyzes an OpenAPI 3.0 or Swagger 2.0 document into nodes and relationship edges.
 */
export function analyzeOpenApiDocument(doc: OpenApiSchema): {
  nodes: EntityNode[];
  edges: RelationshipEdge[];
} {
  const schemas = doc.components?.schemas || doc.definitions || {};
  const nodes: EntityNode[] = [];
  let colorIdx = 0;
  let col = 0;
  let row = 0;

  for (const [schemaName, schemaObj] of Object.entries(schemas)) {
    if (!schemaObj || typeof schemaObj !== 'object') continue;
    const properties = schemaObj.properties || {};
    const requiredList = Array.isArray(schemaObj.required) ? schemaObj.required : [];

    const fields = Object.entries(properties).map(([propName, propObj]: [string, any]) => {
      const isPrimary = ['id', '_id', `${schemaName.toLowerCase()}id`].includes(propName.toLowerCase());
      return {
        name: propName,
        type: propObj.type || (propObj.$ref ? 'reference' : 'string'),
        required: requiredList.includes(propName) || isPrimary,
        isPrimary
      };
    });

    if (!fields.some(f => f.isPrimary)) {
      fields.unshift({ name: 'id', type: 'string', required: true, isPrimary: true });
    }

    const resource = schemaName.toLowerCase() + (schemaName.endsWith('s') ? '' : 's');

    nodes.push({
      id: resource,
      name: schemaName,
      resource,
      fields,
      recordCount: 5,
      color: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
      x: 100 + col * 320,
      y: 80 + row * 260
    });

    colorIdx++;
    col++;
    if (col >= 3) {
      col = 0;
      row++;
    }
  }

  // Detect edges from $ref or foreign keys
  const edges: RelationshipEdge[] = [];
  for (const targetNode of nodes) {
    for (const field of targetNode.fields) {
      if (field.isPrimary) continue;
      const fName = field.name.toLowerCase();

      for (const sourceNode of nodes) {
        if (sourceNode.id === targetNode.id) continue;
        const sId = sourceNode.id.toLowerCase();
        const singular = sId.endsWith('s') ? sId.slice(0, -1) : sId;

        if (fName === `${singular}id` || fName === `${singular}_id` || fName.includes(singular)) {
          const edgeId = `rel_${sourceNode.id}_${targetNode.id}_${field.name}`;
          if (!edges.some(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceNode.id,
              target: targetNode.id,
              sourceField: 'id',
              targetField: field.name,
              type: '1:N',
              label: `1 : N (${sourceNode.name} -> ${targetNode.name})`
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Generates interconnected mock records preserving referential consistency across related entities.
 */
export function generateRelationalMockData(
  nodes: EntityNode[],
  edges: RelationshipEdge[],
  countPerEntity = 5
): Record<string, any[]> {
  const result: Record<string, any[]> = {};
  const idPools: Map<string, string[]> = new Map();

  // First pass: Generate primary keys for parent nodes (nodes with no incoming edges)
  // Sort nodes topologically or parents first
  const parentFirstNodes = [...nodes].sort((a, b) => {
    const aIsTarget = edges.some(e => e.target === a.id);
    const bIsTarget = edges.some(e => e.target === b.id);
    return (aIsTarget ? 1 : 0) - (bIsTarget ? 1 : 0);
  });

  for (const node of parentFirstNodes) {
    const records: any[] = [];
    const pool: string[] = [];

    for (let i = 1; i <= countPerEntity; i++) {
      const record: Record<string, any> = {};
      const primaryId = `${node.resource.slice(0, 3)}_${i}`;
      pool.push(primaryId);

      for (const field of node.fields) {
        if (field.isPrimary) {
          record[field.name] = primaryId;
          continue;
        }

        // Check if this field is a foreign key linked via an edge
        const incomingEdge = edges.find(e => e.target === node.id && e.targetField === field.name);
        if (incomingEdge && idPools.has(incomingEdge.source)) {
          const parentPool = idPools.get(incomingEdge.source)!;
          // Assign random valid ID from parent pool
          record[field.name] = parentPool[(i - 1) % parentPool.length];
          continue;
        }

        // Otherwise generate realistic field values
        record[field.name] = generateMockFieldValue(field.name, field.type, i, node.name);
      }

      record.createdAt = new Date(Date.now() - (countPerEntity - i) * 3600000).toISOString();
      record.updatedAt = new Date().toISOString();
      records.push(record);
    }

    idPools.set(node.id, pool);
    result[node.resource] = records;
  }

  return result;
}

function generateMockFieldValue(fieldName: string, fieldType: string, index: number, entityName: string): any {
  const f = fieldName.toLowerCase();
  if (f.includes('email')) return `user${index}@pseudoend.dev`;
  if (f.includes('name') && !f.includes('user')) return `${entityName} Item #${index}`;
  if (f.includes('username')) return `user_${index}`;
  if (f.includes('first_name') || f === 'firstname') return ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'][index % 5];
  if (f.includes('last_name') || f === 'lastname') return ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][index % 5];
  if (f.includes('title')) return `Sample ${entityName} Title ${index}`;
  if (f.includes('description') || f.includes('bio') || f.includes('content')) {
    return `This is a realistic simulated ${entityName.toLowerCase()} record generated by Pseudoend.`;
  }
  if (f.includes('price') || f.includes('amount') || f.includes('cost')) return +(19.99 * index).toFixed(2);
  if (f.includes('status')) return ['active', 'pending', 'completed', 'verified'][index % 4];
  if (f.includes('role')) return index === 1 ? 'admin' : 'developer';
  if (f.includes('avatar') || f.includes('image') || f.includes('url')) {
    return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80`;
  }
  if (f.includes('phone')) return `+1 (555) 019-${1000 + index}`;
  if (f.includes('rating')) return +(4.0 + (index % 10) * 0.1).toFixed(1);
  if (f.includes('count') || f.includes('quantity')) return index * 10;
  if (fieldType === 'boolean' || f.startsWith('is') || f.startsWith('has')) return index % 2 === 0;
  if (fieldType === 'integer' || fieldType === 'number') return index;
  if (fieldType === 'array') return [`tag-${index}`, 'pseudoend'];
  if (fieldType === 'object') return { metadata: `meta-${index}`, active: true };
  return `${entityName} ${fieldName} ${index}`;
}
