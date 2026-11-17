export interface ResolvedDiagnosis {
  code: string;
  name: string;
}

export abstract class DiagnosisResolver {
  abstract resolve(code: string): Promise<ResolvedDiagnosis | null>;
}
