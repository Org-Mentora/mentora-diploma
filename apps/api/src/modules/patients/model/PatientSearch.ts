/**
 * Search semantics of CU-05: case- and accent-insensitive, every term must match the name,
 * surname or DNI. Persistence adapters index `PatientSearch.indexText(...)`.
 */
export class PatientSearch {
  static normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  static terms(query: string | undefined): string[] {
    if (!query) {
      return [];
    }
    return PatientSearch.normalize(query)
      .replace(/[.\s]+/g, ' ')
      .split(' ')
      .filter((term) => term.length > 0);
  }

  static indexText(firstName: string, lastName: string, dni: string): string {
    return PatientSearch.normalize(`${firstName} ${lastName} ${dni}`);
  }
}
