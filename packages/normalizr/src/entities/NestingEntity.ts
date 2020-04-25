import Entity from './Entity';
import * as schema from '../schema';
import { AbstractInstanceType, NormalizedEntity } from '../types';

export default abstract class NestingEntity extends Entity {
  static denormalize<T extends typeof Entity>(
    this: T,
    entity: NormalizedEntity<T>,
    unvisit: schema.UnvisitFunction,
    denormalizedEntityCache?: AbstractInstanceType<T>,
  ): [AbstractInstanceType<T>, boolean] {
    const denormEntity: AbstractInstanceType<T> = {} as any;
    let found = true;
    const depList: any[] = [];
    // tracks dependencies to determine if we should recompute output
    let entitiesUnchanged =
      denormalizedEntityCache !== undefined &&
      entity === denormalizedEntityCache[baseComparisonKey];
    Object.keys(this.schema).forEach(key => {
      const schema = this.schema[key];
      const [value, foundItem] = unvisit(entity[key], schema);
      entitiesUnchanged =
        entitiesUnchanged && denormalizedEntityCache[key] === value;
      if (!foundItem) {
        found = false;
      }
      if (Object.hasOwnProperty.call(entity, key)) {
        denormEntity[key] = value;
        depList.push(value);
      }
    });
    if (!entitiesUnchanged) {
      // TODO: set this in actual cache
      denormalizedEntityCache = this.fromJS(denormEntity);
    }
    return [denormalizedEntityCache as any, found];
  }
}
