import { randomUUID } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Schema } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DataMapper } from '#core/model/DataMapper';
import { Entity } from '#core/model/Entity';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import {
  type MongoDocument,
  MongooseRepository,
} from '#infrastructure/database/MongooseRepository';
import { MongoTransactionManager } from '#infrastructure/database/MongoTransactionManager';
import { TransactionContext } from '#infrastructure/database/TransactionContext';
import { MongoJobLock } from '#infrastructure/scheduling/MongoJobLock';

class Note extends Entity<{ text: string }> {
  static create(text: string, id: string = randomUUID()): Note {
    return new Note(id, { text });
  }

  get text(): string {
    return this.props.text;
  }
}

interface NoteDocument extends MongoDocument {
  text: string;
}

class NoteMapper implements DataMapper<Note, NoteDocument> {
  toDomain(record: NoteDocument): Note {
    return Note.create(record.text, record._id);
  }

  toPersistence(entity: Note): NoteDocument {
    return { _id: entity.id, text: entity.text };
  }
}

const NoteModel = mongoose.model<NoteDocument>(
  'Note',
  new Schema<NoteDocument>({ _id: { type: String, required: true }, text: String }),
);

class MongooseNoteRepository extends MongooseRepository<Note, NoteDocument> {
  constructor(context: TransactionContext) {
    super(NoteModel, new NoteMapper(), context);
  }
}

describe('MongooseRepository adapter', () => {
  let mongo: MongoMemoryReplSet;
  const connection = MongoConnection.getInstance();
  const context = new TransactionContext();
  const transactions = new MongoTransactionManager(connection, context);
  const repository = new MongooseNoteRepository(context);

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await connection.connect(mongo.getUri());
    await NoteModel.createCollection();
  });

  afterAll(async () => {
    await connection.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await NoteModel.deleteMany({});
  });

  it('saves, finds, updates and deletes entities through the mapper', async () => {
    const note = Note.create('first');

    await repository.save(note);
    expect((await repository.findById(note.id))?.text).toBe('first');

    await repository.save(Note.create('edited', note.id));
    expect((await repository.findAll()).map((n) => n.text)).toEqual(['edited']);

    expect(await repository.delete(note.id)).toBe(true);
    expect(await repository.findById(note.id)).toBeNull();
  });

  it('pings the database through the connection singleton', async () => {
    expect(await connection.ping()).toBeGreaterThanOrEqual(0);
  });

  describe('transactions (ADR-0025)', () => {
    it('commits every write of the unit of work and returns its result', async () => {
      const result = await transactions.run(async () => {
        await repository.save(Note.create('a'));
        await repository.save(Note.create('b'));
        return 'done';
      });

      expect(result).toBe('done');
      expect((await repository.findAll()).map((n) => n.text).sort()).toEqual(['a', 'b']);
    });

    it('rolls back every write when the unit of work throws', async () => {
      const failure = transactions.run(async () => {
        await repository.save(Note.create('lost'));
        throw new Error('boom');
      });

      await expect(failure).rejects.toThrow('boom');
      expect(await repository.findAll()).toEqual([]);
    });

    it('sees its own writes inside, hides them outside until commit', async () => {
      const note = Note.create('pending');
      let seenOutside: unknown;

      await transactions.run(async () => {
        await repository.save(note);
        expect((await repository.findById(note.id))?.text).toBe('pending');
        seenOutside = await NoteModel.findById(note.id).lean();
      });

      expect(seenOutside).toBeNull();
      expect((await repository.findById(note.id))?.text).toBe('pending');
    });

    it('joins the outer transaction when runs are nested', async () => {
      const failure = transactions.run(async () => {
        await transactions.run(() => repository.save(Note.create('inner')));
        throw new Error('outer fails');
      });

      await expect(failure).rejects.toThrow('outer fails');
      expect(await repository.findAll()).toEqual([]);
    });

    it('exposes the session only while a transaction runs', async () => {
      expect(context.isActive).toBe(false);
      await transactions.run(async () => {
        expect(context.session?.inTransaction()).toBe(true);
      });
      expect(context.session).toBeNull();
    });
  });

  it('MongoJobLock lets one instance run a job until it releases it or the lease ends', async () => {
    const first = new MongoJobLock();
    const second = new MongoJobLock();

    expect(await first.acquire('job-a', 60_000)).toBe(true);
    expect(await second.acquire('job-a', 60_000)).toBe(false);
    expect(await first.acquire('job-a', 60_000)).toBe(true);

    await first.release('job-a');
    expect(await second.acquire('job-a', 60_000)).toBe(true);

    expect(await first.acquire('job-b', 1)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(await second.acquire('job-b', 60_000)).toBe(true);
  });
});
