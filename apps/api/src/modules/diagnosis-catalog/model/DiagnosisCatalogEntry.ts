import { Entity } from '#core/model/Entity';

interface DiagnosisCatalogEntryProps {
  name: string;
  category: string;
  active: boolean;
}

/**
 * One DSM-5 diagnosis (`CatalogoDiagnostico`). Identified by its ICD-10-CM code.
 * The catalog is read-only for professionals (CU-11, alternative flow of step 1).
 */
export class DiagnosisCatalogEntry extends Entity<DiagnosisCatalogEntryProps> {
  static restore(code: string, props: DiagnosisCatalogEntryProps): DiagnosisCatalogEntry {
    return new DiagnosisCatalogEntry(code, props);
  }

  get code(): string {
    return this.id;
  }

  get name(): string {
    return this.props.name;
  }

  get category(): string {
    return this.props.category;
  }

  get active(): boolean {
    return this.props.active;
  }
}
