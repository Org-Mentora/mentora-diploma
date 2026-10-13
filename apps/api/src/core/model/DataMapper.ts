/** Translates between a domain entity and its persistence representation. */
export interface DataMapper<TEntity, TPersistence> {
  toDomain(record: TPersistence): TEntity;
  toPersistence(entity: TEntity): TPersistence;
}
