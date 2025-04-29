import { Repository, FindOptionsWhere, FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';

type RelationKeys<T> = {
  [K in keyof T]: T[K] extends object ? K : never
}[keyof T];

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never
}[keyof T];

export default class MongooseLikeWrapper<T extends object, Paths = {}> {
  private repository: Repository<T>;
  private entity: T | null = null;
  private _populatePaths: string[] = [];
  private _filter?: FindOptionsWhere<T>;
  private __id?: string | number;
  private _single?: boolean;
  private _sort?: Record<string, "ASC" | "DESC">;
  private _skip?: number;
  private _take?: number;

  constructor(repository: Repository<T>, entity?: T) {
    this.repository = repository;
    if (entity) this.entity = entity;
  }

  static bind<U extends object>(repository: Repository<U>) {
    const wrapperClass = class BoundWrapper extends MongooseLikeWrapper<U> {
      constructor(entity?: U) {
        super(repository, entity);
      }

      static async create(doc: DeepPartial<U>) {
        const created = repository.create(doc);
        const saved = await repository.save(created);
        return new BoundWrapper(saved);
      }

      static find(filter: FindOptionsWhere<U> = {}) {
        const query = new BoundWrapper();
        query._filter = filter;
        return query;
      }

      static findOne(filter: FindOptionsWhere<U> = {}) {
        const query = new BoundWrapper();
        query._filter = filter;
        query._single = true;
        return query;
      }

      static findById(id: string | number) {
        const query = new BoundWrapper();
        query.__id = id;
        query._single = true;
        return query;
      }

      static async updateMany() { } // WILL NOT BE IMPLEMENTED

      static async updateOne(filter: FindOptionsWhere<U>, update: U | { $inc: Partial<Record<NumericKeys<U>, number>> }) {
        const entity = await repository.findOne(filter);
        if (!entity) {
          return { matchedCount: 0, modifiedCount: 0 }
        }
        let newUpdate: Partial<U> = {};
        if ("$inc" in update) {
          for (const key in update.$inc) {
            if (typeof entity[key] === "number")
              newUpdate[key] = entity[key] + update.$inc[key];
          }
        } else {
          newUpdate = update;
        }
        const result = await repository.update(entity, newUpdate as U);
        return { matchedCount: result.affected ?? 0, modifiedCount: result.affected ?? 0 };
      }

      static async deleteOne(filter: FindOptionsWhere<U>) {
        const result = await repository.delete(filter);
        return { deletedCount: result.affected ?? 0 };
      }
    };
    return wrapperClass;
  }

  async save(): Promise<this> {
    if (!this.entity) throw new Error('Entity not initialized');
    this.entity = await this.repository.save(this.entity);
    return this;
  }

  async remove(): Promise<void> {
    if (!this.entity) throw new Error('Entity not initialized');
    await this.repository.remove(this.entity);
  }

  sort(sortFields: Partial<Record<keyof T, 1 | -1>>): this {
    const order: Partial<Record<keyof T, 'ASC' | 'DESC'>> = {};
    for (const key in sortFields) {
      order[key] = sortFields[key] === 1 ? 'ASC' : 'DESC';
    }
    this._sort = order;
    return this;
  }

  skip(count: number): this {
    this._skip = count;
    return this;
  }

  limit(count: number): this {
    this._take = count;
    return this;
  }

  populate<P extends Partial<Record<keyof T, any>>>(path: RelationKeys<T> | string, _subpaths?: string | string[]) {
    this._populatePaths.push(path as string);
    return this as MongooseLikeWrapper<T, Paths & P>;
  }

  lean(): this {
    return this;
  }

  async exec(): Promise<any> {
    const relations = this._populatePaths;
    const order = this._sort;
    const skip = this._skip;
    const take = this._take;

    if (this.__id !== undefined) {
      const found = await this.repository.findOne({ where: { _id: this.__id } as any, relations });
      return found ? new (this.constructor as any)(found) : null;
    } else if (this._single) {
      const found = await this.repository.findOne({ where: this._filter, relations } as FindOneOptions<T>);
      return found ? new (this.constructor as any)(found) : null;
    } else {
      const found = await this.repository.find({ where: this._filter, relations, order, skip, take } as FindManyOptions<T>);
      return found.map((doc: T) => new (this.constructor as any)(doc));
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  toJSON(): T {
    if (!this.entity) throw new Error('Entity not initialized');
    return this.entity;
  }

  get doc(): T {
    return this.toJSON();
  }
}

