import { ValueObject } from '#core/model/ValueObject';

interface AssignedDiagnosisProps {
  code: string;
  name: string;
  assignedAt: Date;
}

// Value Object
export class AssignedDiagnosis extends ValueObject<AssignedDiagnosisProps> {
  static assign(code: string, name: string, at: Date): AssignedDiagnosis {
    return new AssignedDiagnosis({ code, name, assignedAt: at });
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }
}
