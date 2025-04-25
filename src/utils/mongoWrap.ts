import { Model, ModelStatic, WhereOptions } from "@sequelize/core";

export class MongooseLikeWrapper<T extends object> {
  private sequelizeModel: ModelStatic<Model<any, any>>;
  private instance: Model<any, any> | null = null;

  constructor(model: ModelStatic<Model<any, any>>, instance?: Model<any, any>) {
    this.sequelizeModel = model;
    if (instance) this.instance = instance;
  }

  // STATIC METHODS

  static bind<U extends object>(model: ModelStatic<Model<any, any>>) {
    return class BoundWrapper extends MongooseLikeWrapper<U> {
      constructor(instance?: Model<any, any>) {
        super(model, instance);
      }

      static async create(doc: Partial<U>) {
        const instance = await model.create(doc);
        return new BoundWrapper(instance);
      }

      static async find(filter: WhereOptions<U> = {}) {
        const results = await model.findAll({ where: filter });
        return results.map(doc => new BoundWrapper(doc));
      }

      static async findOne(filter: WhereOptions<U> = {}) {
        const result = await model.findOne({ where: filter });
        return result ? new BoundWrapper(result) : null;
      }

      static async findById(id: string | number) {
        const result = await model.findByPk(id);
        return result ? new BoundWrapper(result) : null;
      }

      static async updateOne(filter: WhereOptions<U>, update: Partial<U>) {
        const [count] = await model.update(update, { where: filter });
        return { matchedCount: count, modifiedCount: count };
      }

      static async deleteOne(filter: WhereOptions<U>) {
        const count = await model.destroy({ where: filter });
        return { deletedCount: count };
      }
    };
  }

  // INSTANCE METHODS

  async save(): Promise<this> {
    if (!this.instance) throw new Error('Instance not initialized');
    await this.instance.save();
    return this;
  }

  async remove(): Promise<void> {
    if (!this.instance) throw new Error('Instance not initialized');
    await this.instance.destroy();
  }

  toJSON(): T {
    if (!this.instance) throw new Error('Instance not initialized');
    return this.instance.toJSON() as T;
  }

  get doc(): T {
    return this.toJSON();
  }
}
