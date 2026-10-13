import mongoose, { Schema } from 'mongoose';

export interface DiagnosisCatalogDocument {
  /** ICD-10-CM code, e.g. `F41.1`. */
  _id: string;
  name: string;
  category: string;
  active: boolean;
}

const schema = new Schema<DiagnosisCatalogDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    active: { type: Boolean, default: true },
  },
  { versionKey: false },
);

export const DiagnosisCatalogModel = mongoose.model<DiagnosisCatalogDocument>(
  'DiagnosisCatalogEntry',
  schema,
  'diagnosis_catalog',
);
