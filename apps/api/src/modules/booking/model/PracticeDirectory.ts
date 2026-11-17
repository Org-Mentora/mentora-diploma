export interface PracticeProfile {
  fullName: string;
  specialty: string;
  offices: readonly string[];
}

export abstract class PracticeDirectory {
  abstract profile(professionalId: string): Promise<PracticeProfile | null>;
  abstract hasAccess(professionalId: string): Promise<boolean>;
}
