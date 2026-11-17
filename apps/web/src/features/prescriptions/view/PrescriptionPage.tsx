import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { usePrescriptionViewModel } from '../viewmodel/usePrescriptionViewModel';

export function PrescriptionPage() {
  const vm = usePrescriptionViewModel();

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">Preparing the prescription…</p>;
  }
  const { letterhead } = vm;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link
          to={`/patients/${vm.patientId}`}
          className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to the patient
        </Link>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={vm.print} disabled={!vm.canGenerate}>
            <Printer /> Print
          </Button>
          <Button
            onClick={() => void vm.downloadPdf()}
            disabled={!vm.canGenerate || vm.isGenerating}
          >
            <Download /> {vm.isGenerating ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <article className="mx-auto grid w-full max-w-3xl gap-6 rounded-md border bg-white p-10 text-black shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        {letterhead && (
          <header className="flex items-start gap-4 border-b pb-4">
            {letterhead.logoDataUrl ? (
              <img
                src={letterhead.logoDataUrl}
                alt="Logo"
                className="size-16 shrink-0 object-contain"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-bold text-lg text-white">
                {letterhead.initials}
              </span>
            )}
            <div className="grid gap-0.5 text-sm">
              <p className="font-bold text-xl">{letterhead.professionalName}</p>
              <p>
                {letterhead.specialty} · {letterhead.license}
              </p>
              <p className="text-neutral-600">{letterhead.contact}</p>
              {letterhead.offices.map((office) => (
                <p key={office} className="text-neutral-600">
                  {office}
                </p>
              ))}
            </div>
          </header>
        )}

        <section className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-semibold text-lg">Patient: {vm.patientName}</p>
            <p className="text-neutral-600 text-sm">{vm.patientDetail}</p>
          </div>
          <p className="text-sm">{vm.date}</p>
        </section>

        <section className="grid gap-2">
          <p className="font-bold text-lg">Rp/</p>
          <Textarea
            aria-label="Prescription content"
            placeholder="Write the prescription: medication, dose, frequency, duration and indications."
            value={vm.content}
            onChange={(event) => vm.setContent(event.target.value)}
            rows={14}
            className="resize-y border-dashed bg-transparent font-serif text-base print:hidden"
          />
          <p className="hidden whitespace-pre-wrap font-serif text-base print:block">
            {vm.content}
          </p>
        </section>

        {letterhead && (
          <footer className="mt-10 ml-auto w-64 border-neutral-400 border-t pt-2 text-center text-xs">
            <p>{letterhead.professionalName}</p>
            <p>{letterhead.license}</p>
          </footer>
        )}
      </article>
    </div>
  );
}
