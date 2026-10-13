import { X } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { DiagnosisSearch } from '../viewmodel/useNewConsultationViewModel';

/** CU-11 steps 2-7: search the read-only DSM-5 catalog and pick one diagnosis. */
export function DiagnosisPicker({ search }: { search: DiagnosisSearch }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="diagnosis-search">Diagnosis (DSM-5, optional)</Label>
      {search.selected && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {search.selected.code} · {search.selected.name}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove diagnosis"
            onClick={search.clear}
          >
            <X />
          </Button>
        </div>
      )}
      <Input
        id="diagnosis-search"
        placeholder={search.selected ? 'Search to replace the diagnosis' : 'Search by name or code'}
        value={search.term}
        onChange={(event) => search.setTerm(event.target.value)}
        autoComplete="off"
      />
      {search.hint && <p className="text-muted-foreground text-xs">{search.hint}</p>}
      {search.options.length > 0 && search.term.trim().length >= 2 && (
        <ul className="max-h-56 overflow-y-auto rounded-md border" aria-label="Diagnosis results">
          {search.options.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => search.select(option)}
              >
                <span className="font-medium">{option.label}</span>
                <span className="block text-muted-foreground text-xs">{option.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
