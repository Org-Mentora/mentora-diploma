import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Schema } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DataMapper } from '#core/model/DataMapper';
import { Entity } from '#core/model/Entity';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import {
  type MongoDocument,
  MongooseRepository,
} from '#infrastructure/database/MongooseRepository';

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
  constructor() {
    super(NoteModel, new NoteMapper());
  }
}

describe('MongooseRepository adapter', () => {
  let mongo: MongoMemoryServer;
  const connection = MongoConnection.getInstance();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connection.connect(mongo.getUri());
  });

  afterAll(async () => {
    await connection.disconnect();
    await mongo.stop();
  });

  it('saves, finds, updates and deletes entities through the mapper', async () => {
    const repository = new MongooseNoteRepository();
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
});
