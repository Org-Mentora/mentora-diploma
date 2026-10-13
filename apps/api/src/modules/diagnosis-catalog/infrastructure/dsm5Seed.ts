/**
 * Initial DSM-5 catalog (ICD-10-CM codes as listed in DSM-5-TR). It is a curated subset of the
 * diagnoses most used in outpatient psychiatry; extend it here and it is upserted at boot.
 */
export interface Dsm5SeedEntry {
  code: string;
  name: string;
  category: string;
}

const NEURODEVELOPMENTAL = 'Neurodevelopmental disorders';
const PSYCHOTIC = 'Schizophrenia spectrum and other psychotic disorders';
const BIPOLAR = 'Bipolar and related disorders';
const DEPRESSIVE = 'Depressive disorders';
const ANXIETY = 'Anxiety disorders';
const OBSESSIVE = 'Obsessive-compulsive and related disorders';
const TRAUMA = 'Trauma- and stressor-related disorders';
const SOMATIC = 'Somatic symptom and related disorders';
const EATING = 'Feeding and eating disorders';
const SLEEP = 'Sleep-wake disorders';
const SUBSTANCE = 'Substance-related and addictive disorders';
const PERSONALITY = 'Personality disorders';

export const DSM5_SEED: readonly Dsm5SeedEntry[] = [
  { code: 'F84.0', name: 'Autism spectrum disorder', category: NEURODEVELOPMENTAL },
  {
    code: 'F90.0',
    name: 'Attention-deficit/hyperactivity disorder, predominantly inattentive presentation',
    category: NEURODEVELOPMENTAL,
  },
  {
    code: 'F90.1',
    name: 'Attention-deficit/hyperactivity disorder, predominantly hyperactive/impulsive presentation',
    category: NEURODEVELOPMENTAL,
  },
  {
    code: 'F90.2',
    name: 'Attention-deficit/hyperactivity disorder, combined presentation',
    category: NEURODEVELOPMENTAL,
  },
  { code: 'F20.9', name: 'Schizophrenia', category: PSYCHOTIC },
  { code: 'F20.81', name: 'Schizophreniform disorder', category: PSYCHOTIC },
  { code: 'F22', name: 'Delusional disorder', category: PSYCHOTIC },
  { code: 'F23', name: 'Brief psychotic disorder', category: PSYCHOTIC },
  { code: 'F25.0', name: 'Schizoaffective disorder, bipolar type', category: PSYCHOTIC },
  { code: 'F25.1', name: 'Schizoaffective disorder, depressive type', category: PSYCHOTIC },
  {
    code: 'F31.11',
    name: 'Bipolar I disorder, current or most recent episode manic, mild',
    category: BIPOLAR,
  },
  {
    code: 'F31.31',
    name: 'Bipolar I disorder, current or most recent episode depressed, mild',
    category: BIPOLAR,
  },
  { code: 'F31.81', name: 'Bipolar II disorder', category: BIPOLAR },
  { code: 'F34.0', name: 'Cyclothymic disorder', category: BIPOLAR },
  { code: 'F32.0', name: 'Major depressive disorder, single episode, mild', category: DEPRESSIVE },
  {
    code: 'F32.1',
    name: 'Major depressive disorder, single episode, moderate',
    category: DEPRESSIVE,
  },
  {
    code: 'F32.2',
    name: 'Major depressive disorder, single episode, severe',
    category: DEPRESSIVE,
  },
  {
    code: 'F33.0',
    name: 'Major depressive disorder, recurrent episode, mild',
    category: DEPRESSIVE,
  },
  {
    code: 'F33.1',
    name: 'Major depressive disorder, recurrent episode, moderate',
    category: DEPRESSIVE,
  },
  { code: 'F34.1', name: 'Persistent depressive disorder (dysthymia)', category: DEPRESSIVE },
  { code: 'F32.81', name: 'Premenstrual dysphoric disorder', category: DEPRESSIVE },
  { code: 'F93.0', name: 'Separation anxiety disorder', category: ANXIETY },
  { code: 'F94.0', name: 'Selective mutism', category: ANXIETY },
  { code: 'F40.218', name: 'Specific phobia, animal', category: ANXIETY },
  { code: 'F40.10', name: 'Social anxiety disorder', category: ANXIETY },
  { code: 'F41.0', name: 'Panic disorder', category: ANXIETY },
  { code: 'F40.00', name: 'Agoraphobia', category: ANXIETY },
  { code: 'F41.1', name: 'Generalized anxiety disorder', category: ANXIETY },
  { code: 'F42.2', name: 'Obsessive-compulsive disorder', category: OBSESSIVE },
  { code: 'F45.22', name: 'Body dysmorphic disorder', category: OBSESSIVE },
  { code: 'F42.3', name: 'Hoarding disorder', category: OBSESSIVE },
  { code: 'F63.3', name: 'Trichotillomania (hair-pulling disorder)', category: OBSESSIVE },
  { code: 'F43.10', name: 'Posttraumatic stress disorder', category: TRAUMA },
  { code: 'F43.0', name: 'Acute stress disorder', category: TRAUMA },
  { code: 'F43.21', name: 'Adjustment disorder with depressed mood', category: TRAUMA },
  { code: 'F43.22', name: 'Adjustment disorder with anxiety', category: TRAUMA },
  {
    code: 'F43.23',
    name: 'Adjustment disorder with mixed anxiety and depressed mood',
    category: TRAUMA,
  },
  { code: 'F45.1', name: 'Somatic symptom disorder', category: SOMATIC },
  { code: 'F45.21', name: 'Illness anxiety disorder', category: SOMATIC },
  { code: 'F50.01', name: 'Anorexia nervosa, restricting type', category: EATING },
  { code: 'F50.2', name: 'Bulimia nervosa', category: EATING },
  { code: 'F50.81', name: 'Binge-eating disorder', category: EATING },
  { code: 'F51.01', name: 'Insomnia disorder', category: SLEEP },
  { code: 'F51.11', name: 'Hypersomnolence disorder', category: SLEEP },
  { code: 'F10.20', name: 'Alcohol use disorder, moderate', category: SUBSTANCE },
  { code: 'F12.20', name: 'Cannabis use disorder, moderate', category: SUBSTANCE },
  { code: 'F17.200', name: 'Tobacco use disorder, moderate', category: SUBSTANCE },
  { code: 'F60.0', name: 'Paranoid personality disorder', category: PERSONALITY },
  { code: 'F60.2', name: 'Antisocial personality disorder', category: PERSONALITY },
  { code: 'F60.3', name: 'Borderline personality disorder', category: PERSONALITY },
  { code: 'F60.5', name: 'Obsessive-compulsive personality disorder', category: PERSONALITY },
  { code: 'F60.6', name: 'Avoidant personality disorder', category: PERSONALITY },
  { code: 'F60.81', name: 'Narcissistic personality disorder', category: PERSONALITY },
];
