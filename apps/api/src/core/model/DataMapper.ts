// Data Mapper
export interface DataMapper<TEntity, TPersistence> {
  toDomain(record: TPersistence): TEntity;
  toPersistence(entity: TEntity): TPersistence;
}
