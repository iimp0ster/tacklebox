import mappings from './atomic-mappings.json';

export type AtomicMapping = (typeof mappings.convergence)[number];

export function getProcedureAtomicMapping(recordId: string, kitId: string) {
  return mappings.convergence.find(
    (mapping) => mapping.recordId === recordId && mapping.kitId === kitId,
  );
}

export function getRelationAtomicMappings(relationId: string, kitId: string) {
  return mappings.relations.filter(
    (mapping) => mapping.relationId === relationId && mapping.kitId === kitId,
  );
}
