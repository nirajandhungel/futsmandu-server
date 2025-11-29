import {Model, Document, FilterQuery, UpdateQuery, QueryOptions, ClientSession} from 'mongoose';

// BaseRepository providing generic CRUD operations
export class BaseRepository<T extends Document> {
    constructor(protected model: Model<T>) {}

    // Create a new document
    async create(data: Partial<T>, session?: ClientSession): Promise<T> {
        if (session) {
            return this.model.create([data], { session }).then(docs => docs[0]);
        }
        return this.model.create(data);
    }
    // Find a document by ID
    async findById(id: string, select?: string, session?: ClientSession): Promise<T | null> {
        const query = this.model.findById(id);
        if (select) query.select(select);
        if (session) query.session(session);
        return query.exec();
    }

    // Find a single document by filter
    async findOne(filter: FilterQuery<T>, select?: string, session?: ClientSession): Promise<T | null> {
        const query = this.model.findOne(filter);
        if (select) query.select(select);
        if (session) query.session(session);
        return query.exec();
    }

    // Find multiple documents by filter
    async find(filter: FilterQuery<T> ={}, select?: string, session?: ClientSession): Promise<T[]> {
        const query = this.model.find(filter);
        if (select) query.select(select);
        if (session) query.session(session);
        return query.exec();
    }

    // Update a document by ID
    async updateById(
        id: string, 
        update: UpdateQuery<T>, 
        options?: QueryOptions & { session?: ClientSession }): Promise<T | null> {
        return this.model.findByIdAndUpdate(id, update, { 
            new: true,
            runValidators: true,
            ...options });
    }

    // update a document
    async updateOne(
        filter: FilterQuery<T>, 
        update: UpdateQuery<T>, 
        options?: QueryOptions): Promise<T | null> {
        return this.model.findOneAndUpdate(filter, update, {
            new: true,
            runValidators: true,
            ...options });
    }

    // Delete documents by ID
    async deleteById(id: string): Promise<T | null> {
        return this.model.findByIdAndDelete(id);
    }

    // delete one document by filter
    async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
        return this.model.findOneAndDelete(filter);
    }

    // Count documents by filter
    async count(filter: FilterQuery<T> = {}): Promise<number> {
        return this.model.countDocuments(filter);
    }

    // check if document exists
    async exists(filter: FilterQuery<T>): Promise<boolean> {
        const count = await this.model.countDocuments(filter).limit(1);
        return count > 0;
    }
}