import { Entity } from '#core/model/Entity';

interface DiagnosisCatalogEntryProps {
  name: string;
  category: string;
  active: boolean;
}

// Entity
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
