import { createHash } from 'crypto';

export interface OntologyClass {
  id: string;
  name: string;
  label: string;
  description: string;
  parentClass?: string;
  equivalentClasses: string[];
  disjointWith: string[];
  restrictions: Restriction[];
  annotations: Record<string, string>;
  versionInfo: string;
}

export interface ObjectProperty {
  id: string;
  name: string;
  domain: string;
  range: string;
  inverse?: string;
  characteristics: ('functional' | 'inverseFunctional' | 'transitive' | 'symmetric' | 'reflexive')[];
  subPropertyOf?: string;
  minCardinality?: number;
  maxCardinality?: number;
}

export interface DatatypeProperty {
  id: string;
  name: string;
  domain: string;
  datatype: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime' | 'text' | 'json';
  required: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  unit?: string;
}

export interface Individual {
  id: string;
  classType: string;
  properties: Record<string, any>;
}

export interface Restriction {
  type: 'minCardinality' | 'maxCardinality' | 'exactCardinality' | 'someValuesFrom' | 'allValuesFrom' | 'hasValue';
  property: string;
  value?: any;
}

export interface SerializedOntology {
  classes: OntologyClass[];
  objectProperties: ObjectProperty[];
  datatypeProperties: DatatypeProperty[];
  individuals: Individual[];
  namespaces: Record<string, string>;
  version: number;
}

export interface FieldChange {
  before: any;
  after: any;
}

export interface EntityDiff {
  id: string;
  changes: Record<string, FieldChange>;
}

export interface OntologyDiff {
  versionA: number;
  versionB: number;
  addedClasses: string[];
  removedClasses: string[];
  modifiedClasses: EntityDiff[];
  addedObjectProperties: string[];
  removedObjectProperties: string[];
  modifiedObjectProperties: EntityDiff[];
  addedDatatypeProperties: string[];
  removedDatatypeProperties: string[];
  modifiedDatatypeProperties: EntityDiff[];
  addedIndividuals: string[];
  removedIndividuals: string[];
}

export interface AffectedProperty {
  id: string;
  name: string;
  type: 'object' | 'datatype';
}

export interface ImpactReport {
  classId: string;
  className: string;
  affectedProperties: AffectedProperty[];
  affectedIndividuals: string[];
  subclassIds: string[];
  parentClass?: string;
  directRestrictions: Restriction[];
  warnings: string[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  path: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class OntologyEngine {
  classes: Map<string, OntologyClass> = new Map();
  objectProperties: Map<string, ObjectProperty> = new Map();
  datatypeProperties: Map<string, DatatypeProperty> = new Map();
  individuals: Map<string, Individual> = new Map();
  namespaces: Map<string, string> = new Map();
  version: number = 1;

  constructor() {
    this.namespaces.set('iscarb', 'https://iscarb.edu/ontology#');
    this.namespaces.set('owl', 'http://www.w3.org/2002/07/owl#');
    this.namespaces.set('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
    this.namespaces.set('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
    this.namespaces.set('xsd', 'http://www.w3.org/2001/XMLSchema#');
  }

  addClass(cls: Omit<OntologyClass, 'equivalentClasses' | 'disjointWith' | 'restrictions' | 'annotations' | 'versionInfo'>): OntologyClass {
    if (this.classes.has(cls.id)) {
      throw new Error(`Class '${cls.id}' already exists`);
    }
    if (cls.parentClass && !this.classes.has(cls.parentClass)) {
      throw new Error(`Parent class '${cls.parentClass}' not found`);
    }
    const full: OntologyClass = {
      ...cls,
      equivalentClasses: [],
      disjointWith: [],
      restrictions: [],
      annotations: {},
      versionInfo: `v${this.version}`,
    };
    this.classes.set(cls.id, full);
    return full;
  }

  updateClass(id: string, changes: Partial<Omit<OntologyClass, 'id'>>): OntologyClass {
    const existing = this.classes.get(id);
    if (!existing) throw new Error(`Class '${id}' not found`);
    if (changes.parentClass && changes.parentClass !== existing.parentClass) {
      if (!this.classes.has(changes.parentClass)) {
        throw new Error(`Parent class '${changes.parentClass}' not found`);
      }
    }
    const updated = { ...existing, ...changes, id };
    this.classes.set(id, updated);
    return updated;
  }

  deleteClass(id: string): void {
    if (!this.classes.has(id)) throw new Error(`Class '${id}' not found`);
    this.classes.delete(id);
    for (const [pid, prop] of this.objectProperties) {
      if (prop.domain === id || prop.range === id) {
        this.objectProperties.delete(pid);
      }
    }
    for (const [pid, prop] of this.datatypeProperties) {
      if (prop.domain === id) {
        this.datatypeProperties.delete(pid);
      }
    }
    for (const [iid, ind] of this.individuals) {
      if (ind.classType === id) {
        this.individuals.delete(iid);
      }
    }
  }

  addObjectProperty(prop: ObjectProperty): void {
    if (this.objectProperties.has(prop.id)) {
      throw new Error(`Object property '${prop.id}' already exists`);
    }
    if (!this.classes.has(prop.domain)) throw new Error(`Domain class '${prop.domain}' not found`);
    if (!this.classes.has(prop.range)) throw new Error(`Range class '${prop.range}' not found`);
    this.objectProperties.set(prop.id, prop);
  }

  addDatatypeProperty(prop: DatatypeProperty): void {
    if (this.datatypeProperties.has(prop.id)) {
      throw new Error(`Datatype property '${prop.id}' already exists`);
    }
    if (!this.classes.has(prop.domain)) throw new Error(`Domain class '${prop.domain}' not found`);
    this.datatypeProperties.set(prop.id, prop);
  }

  addIndividual(ind: Individual): void {
    if (this.individuals.has(ind.id)) {
      throw new Error(`Individual '${ind.id}' already exists`);
    }
    if (!this.classes.has(ind.classType)) {
      throw new Error(`Class type '${ind.classType}' not found`);
    }
    this.individuals.set(ind.id, ind);
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const visited = new Set<string>();
    const inStack = new Set<string>();

    const detectCycle = (classId: string): boolean => {
      if (inStack.has(classId)) return true;
      if (visited.has(classId)) return false;
      visited.add(classId);
      inStack.add(classId);
      const cls = this.classes.get(classId);
      if (cls?.parentClass && detectCycle(cls.parentClass)) return true;
      inStack.delete(classId);
      return false;
    };

    for (const [id] of this.classes) {
      visited.clear();
      inStack.clear();
      if (detectCycle(id)) {
        errors.push({ type: 'error', message: `Inheritance cycle detected involving class '${id}'`, path: `class:${id}` });
      }
    }

    for (const [id, prop] of this.objectProperties) {
      if (!this.classes.has(prop.domain)) {
        errors.push({ type: 'error', message: `Object property '${id}' references missing domain class '${prop.domain}'`, path: `objectProperty:${id}:domain` });
      }
      if (!this.classes.has(prop.range)) {
        errors.push({ type: 'error', message: `Object property '${id}' references missing range class '${prop.range}'`, path: `objectProperty:${id}:range` });
      }
      if (prop.subPropertyOf && !this.objectProperties.has(prop.subPropertyOf)) {
        warnings.push({ type: 'warning', message: `Object property '${id}' references missing parent property '${prop.subPropertyOf}'`, path: `objectProperty:${id}:subPropertyOf` });
      }
    }

    for (const [id, prop] of this.datatypeProperties) {
      if (!this.classes.has(prop.domain)) {
        errors.push({ type: 'error', message: `Datatype property '${id}' references missing domain class '${prop.domain}'`, path: `datatypeProperty:${id}:domain` });
      }
    }

    for (const [id, ind] of this.individuals) {
      if (!this.classes.has(ind.classType)) {
        errors.push({ type: 'error', message: `Individual '${id}' references missing class type '${ind.classType}'`, path: `individual:${id}:classType` });
      }
    }

    for (const [id, cls] of this.classes) {
      if (cls.parentClass && !this.classes.has(cls.parentClass)) {
        errors.push({ type: 'error', message: `Class '${id}' references missing parent class '${cls.parentClass}'`, path: `class:${id}:parentClass` });
      }
    }

    const classesWithNoProperties = new Set<string>();
    for (const [id] of this.classes) {
      const hasObjProp = [...this.objectProperties.values()].some(p => p.domain === id || p.range === id);
      const hasDataProp = [...this.datatypeProperties.values()].some(p => p.domain === id);
      if (!hasObjProp && !hasDataProp && this.classes.size > 1) {
        classesWithNoProperties.add(id);
      }
    }
    for (const id of classesWithNoProperties) {
      warnings.push({ type: 'warning', message: `Class '${id}' has no associated properties`, path: `class:${id}` });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  toJSON(): SerializedOntology {
    return {
      classes: Array.from(this.classes.values()),
      objectProperties: Array.from(this.objectProperties.values()),
      datatypeProperties: Array.from(this.datatypeProperties.values()),
      individuals: Array.from(this.individuals.values()),
      namespaces: Object.fromEntries(this.namespaces),
      version: this.version,
    };
  }

  fromJSON(data: SerializedOntology): void {
    this.classes.clear();
    this.objectProperties.clear();
    this.datatypeProperties.clear();
    this.individuals.clear();
    this.namespaces.clear();
    this.version = data.version;

    for (const ns of Object.entries(data.namespaces || {})) {
      this.namespaces.set(ns[0], ns[1]);
    }
    for (const cls of data.classes) {
      this.classes.set(cls.id, cls);
    }
    for (const prop of data.objectProperties) {
      this.objectProperties.set(prop.id, prop);
    }
    for (const prop of data.datatypeProperties) {
      this.datatypeProperties.set(prop.id, prop);
    }
    for (const ind of data.individuals) {
      this.individuals.set(ind.id, ind);
    }
  }

  diff(other: OntologyEngine): OntologyDiff {
    const thisData = this.toJSON();
    const otherData = other.toJSON();

    const thisClassIds = new Set(thisData.classes.map(c => c.id));
    const otherClassIds = new Set(otherData.classes.map(c => c.id));

    const addedClasses = [...otherClassIds].filter(id => !thisClassIds.has(id));
    const removedClasses = [...thisClassIds].filter(id => !otherClassIds.has(id));

    const modifiedClasses: OntologyDiff['modifiedClasses'] = [];
    for (const otherCls of otherData.classes) {
      const thisCls = this.classes.get(otherCls.id);
      if (!thisCls) continue;
      const changes: Record<string, { before: any; after: any }> = {};
      for (const key of Object.keys(otherCls) as (keyof OntologyClass)[]) {
        if (key === 'id') continue;
        const before = (thisCls as any)[key];
        const after = (otherCls as any)[key];
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          changes[key] = { before, after };
        }
      }
      if (Object.keys(changes).length > 0) {
        modifiedClasses.push({ id: otherCls.id, changes });
      }
    }

    const thisObjPropIds = new Set(thisData.objectProperties.map(p => p.id));
    const otherObjPropIds = new Set(otherData.objectProperties.map(p => p.id));
    const addedObjectProperties = [...otherObjPropIds].filter(id => !thisObjPropIds.has(id));
    const removedObjectProperties = [...thisObjPropIds].filter(id => !otherObjPropIds.has(id));

    const modifiedObjectProperties: OntologyDiff['modifiedObjectProperties'] = [];
    for (const otherProp of otherData.objectProperties) {
      const thisProp = this.objectProperties.get(otherProp.id);
      if (!thisProp) continue;
      const changes: Record<string, { before: any; after: any }> = {};
      for (const key of Object.keys(otherProp) as (keyof ObjectProperty)[]) {
        if (key === 'id') continue;
        const before = (thisProp as any)[key];
        const after = (otherProp as any)[key];
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          changes[key] = { before, after };
        }
      }
      if (Object.keys(changes).length > 0) {
        modifiedObjectProperties.push({ id: otherProp.id, changes });
      }
    }

    const thisDtPropIds = new Set(thisData.datatypeProperties.map(p => p.id));
    const otherDtPropIds = new Set(otherData.datatypeProperties.map(p => p.id));
    const addedDatatypeProperties = [...otherDtPropIds].filter(id => !thisDtPropIds.has(id));
    const removedDatatypeProperties = [...thisDtPropIds].filter(id => !otherDtPropIds.has(id));

    const modifiedDatatypeProperties: OntologyDiff['modifiedDatatypeProperties'] = [];
    for (const otherProp of otherData.datatypeProperties) {
      const thisProp = this.datatypeProperties.get(otherProp.id);
      if (!thisProp) continue;
      const changes: Record<string, { before: any; after: any }> = {};
      for (const key of Object.keys(otherProp) as (keyof DatatypeProperty)[]) {
        if (key === 'id') continue;
        const before = (thisProp as any)[key];
        const after = (otherProp as any)[key];
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          changes[key] = { before, after };
        }
      }
      if (Object.keys(changes).length > 0) {
        modifiedDatatypeProperties.push({ id: otherProp.id, changes });
      }
    }

    const thisIndIds = new Set(thisData.individuals.map(i => i.id));
    const otherIndIds = new Set(otherData.individuals.map(i => i.id));
    const addedIndividuals = [...otherIndIds].filter(id => !thisIndIds.has(id));
    const removedIndividuals = [...thisIndIds].filter(id => !otherIndIds.has(id));

    return {
      versionA: this.version,
      versionB: other.version,
      addedClasses,
      removedClasses,
      modifiedClasses,
      addedObjectProperties,
      removedObjectProperties,
      modifiedObjectProperties,
      addedDatatypeProperties,
      removedDatatypeProperties,
      modifiedDatatypeProperties,
      addedIndividuals,
      removedIndividuals,
    };
  }

  impactAnalysis(classId: string): ImpactReport {
    const cls = this.classes.get(classId);
    if (!cls) throw new Error(`Class '${classId}' not found`);

    const affectedProperties: ImpactReport['affectedProperties'] = [];
    for (const [id, prop] of this.objectProperties) {
      if (prop.domain === classId || prop.range === classId) {
        affectedProperties.push({ id, name: prop.name, type: 'object' });
      }
    }
    for (const [id, prop] of this.datatypeProperties) {
      if (prop.domain === classId) {
        affectedProperties.push({ id, name: prop.name, type: 'datatype' });
      }
    }

    const affectedIndividuals: string[] = [];
    for (const [id, ind] of this.individuals) {
      if (ind.classType === classId) {
        affectedIndividuals.push(id);
      }
    }

    const subclassIds: string[] = [];
    for (const [id, c] of this.classes) {
      if (c.parentClass === classId) {
        subclassIds.push(id);
      }
    }

    return {
      classId,
      className: cls.name,
      affectedProperties,
      affectedIndividuals,
      subclassIds,
      parentClass: cls.parentClass,
      directRestrictions: cls.restrictions,
      warnings: affectedProperties.length === 0 && affectedIndividuals.length === 0
        ? ['This class has no properties or individuals — deletion would have minimal impact']
        : [],
    };
  }
}

export function checksumOntology(engine: OntologyEngine): string {
  return createHash('sha256').update(JSON.stringify(engine.toJSON())).digest('hex');
}
