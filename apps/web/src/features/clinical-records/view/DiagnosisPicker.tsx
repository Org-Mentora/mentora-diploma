import { X } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { DiagnosisSearch } from '../viewmodel/useNewConsultationViewModel';

export function DiagnosisPicker({ search }: { search: DiagnosisSearch }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-2">
      <Label htmlFor="diagnosis-search">{t('clinical.diagnosis.label')}</Label>
      {search.selected && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {search.selected.code} · {search.selected.name}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('clinical.diagnosis.remove')}
            onClick={search.clear}
          >
            <X />
          </Button>
        </div>
      )}
      <Input
        id="diagnosis-search"
        placeholder={
          search.selected ? t('clinical.diagnosis.replace') : t('clinical.diagnosis.search')
        }
        value={search.term}
        onChange={(event) => search.setTerm(event.target.value)}
        autoComplete="off"
      />
      {search.hint && <p className="text-muted-foreground text-xs">{search.hint}</p>}
      {search.options.length > 0 && search.term.trim().length >= 2 && (
        <ul
          className="max-h-56 overflow-y-auto rounded-md border"
          aria-label={t('clinical.diagnosis.results')}
        >
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
