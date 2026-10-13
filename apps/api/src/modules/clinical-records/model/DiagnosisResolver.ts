export interface ResolvedDiagnosis {
  code: string;
  name: string;
}

/** Owned by this Model, implemented over the DSM-5 catalog module (ADR-0022). */
export abstract class DiagnosisResolver {
  /** The active catalog entry for `code`, or `null` when it is unknown. */
  abstract resolve(code: string): Promise<ResolvedDiagnosis | null>;
}
