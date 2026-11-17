const BASE_URL = (process.env.SEED_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.DEMO_EMAIL ?? 'demo@mentora.test';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234';
const ENABLED = (process.env.SEED_DEMO_DATA ?? 'true') !== 'false';
const WAIT_SECONDS = Number(process.env.SEED_WAIT_SECONDS ?? 120);
const UTC_OFFSET_HOURS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

let cookie = '';

async function call(method, path, body) {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function must(expected, method, path, body) {
  const result = await call(method, path, body);
  if (result.status !== expected) {
    throw new Error(`${method} ${path} → ${result.status} ${JSON.stringify(result.body)}`);
  }
  return result.body;
}

async function waitUntilReady() {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  while (Date.now() < deadline) {
    try {
      if ((await call('GET', '/health/ready')).status === 200) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`${BASE_URL} was not ready after ${WAIT_SECONDS}s`);
}

function daysAgo(days, hour = 10) {
  const date = new Date(Date.now() - days * DAY_MS);
  date.setUTCHours(hour + UTC_OFFSET_HOURS, 0, 0, 0);
  return date.toISOString();
}

function inDays(days, hour, minute = 0) {
  const date = new Date(Date.now() + days * DAY_MS);
  date.setUTCHours(hour + UTC_OFFSET_HOURS, minute, 0, 0);
  return date.toISOString();
}

const professional = {
  firstName: 'Laura',
  lastName: 'Gómez',
  email: EMAIL,
  phone: '+54 11 5555 0100',
  specialty: 'Clinical Psychology',
  licenseNumber: 'MN-48213',
  password: PASSWORD,
  offices: ['Av. Santa Fe 1234, 3° B, CABA', 'Av. Cabildo 2500, 1° A, CABA'],
};

const patients = [
  {
    key: 'juan',
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '30123456',
    birthDate: '1985-03-12',
    gender: 'Male',
    phone: '11 5555 1234',
    email: 'juan.perez@example.com',
    address: 'Av. Corrientes 3200, CABA',
    healthInsurance: 'OSDE',
    memberNumber: '61-123456-01',
    familyContact: { name: 'María Pérez (sister)', phone: '11 5555 9876' },
    allergies: ['Penicillin'],
    observations: 'Prefers morning appointments.',
  },
  {
    key: 'lucia',
    firstName: 'Lucía',
    lastName: 'Fernández',
    dni: '33222111',
    birthDate: '1992-07-04',
    gender: 'Female',
    phone: '11 5555 2345',
    email: 'lucia.fernandez@example.com',
    healthInsurance: 'Swiss Medical',
    memberNumber: '80-554433',
  },
  {
    key: 'martin',
    firstName: 'Martín',
    lastName: 'Rodríguez',
    dni: '28111222',
    birthDate: '1979-11-30',
    gender: 'Male',
    phone: '11 5555 3456',
    healthInsurance: 'Galeno',
    memberNumber: 'G-998877',
    debt: 15000,
    observations: 'Pending payment of two sessions.',
  },
  {
    key: 'sofia',
    firstName: 'Sofía',
    lastName: 'Martínez',
    dni: '40123987',
    birthDate: '2001-01-15',
    gender: 'Female',
    email: 'sofia.martinez@example.com',
    observations: 'No phone: messages fall back to email.',
  },
  {
    key: 'diego',
    firstName: 'Diego',
    lastName: 'López',
    dni: '25987654',
    birthDate: '1970-05-20',
    gender: 'Male',
    phone: '11 5555 4567',
    healthInsurance: 'PAMI',
  },
  {
    key: 'valentina',
    firstName: 'Valentina',
    lastName: 'García',
    dni: '38555444',
    birthDate: '1995-09-09',
    gender: 'Female',
    phone: '11 5555 5678',
    email: 'valentina.garcia@example.com',
  },
  {
    key: 'carlos',
    firstName: 'Carlos',
    lastName: 'Sánchez',
    dni: '31444555',
    birthDate: '1988-02-02',
    gender: 'Male',
    phone: '11 5555 6789',
    healthInsurance: 'Medifé',
    allergies: ['Ibuprofen', 'Latex'],
  },
  { key: 'ana', firstName: 'Ana', lastName: 'Romero', dni: '42111999', phone: '11 5555 7890' },
];

const sertraline = {
  name: 'Sertraline',
  dose: '50 mg',
  frequency: 'Once a day, morning',
  duration: '90 days',
  indications: 'Take after breakfast.',
};

const consultations = {
  juan: [
    {
      date: daysAgo(60),
      type: 'in_person',
      reason: 'Persistent worry and trouble sleeping',
      observations: 'Excessive worry about work for 8 months. Muscle tension.',
      diagnosisCode: 'F41.1',
    },
    {
      date: daysAgo(30),
      type: 'in_person',
      reason: 'Follow-up',
      evolution: 'Partial improvement with breathing exercises. Starts medication.',
      diagnosisCode: 'F41.1',
      medications: [sertraline],
    },
    {
      date: daysAgo(7),
      type: 'virtual',
      reason: 'Medication control',
      evolution: 'Good tolerance. Sleeps 7 hours. Keeps the dose.',
      medications: [sertraline],
    },
  ],
  lucia: [
    {
      date: daysAgo(45, 11),
      type: 'in_person',
      reason: 'Low mood and loss of interest',
      observations: 'Symptoms for 3 months after a job loss.',
      diagnosisCode: 'F32.1',
    },
    {
      date: daysAgo(14, 11),
      type: 'virtual',
      reason: 'Follow-up',
      evolution: 'Resumed physical activity. Mood slightly better.',
      diagnosisCode: 'F32.1',
      medications: [
        {
          name: 'Escitalopram',
          dose: '10 mg',
          frequency: 'Once a day',
          duration: '60 days',
          indications: null,
        },
      ],
    },
  ],
  martin: [
    {
      date: daysAgo(20, 15),
      type: 'in_person',
      reason: 'Nightmares after a car accident',
      observations: 'Avoids driving. Hypervigilance.',
      diagnosisCode: 'F43.10',
    },
  ],
  carlos: [
    {
      date: daysAgo(10, 16),
      type: 'in_person',
      reason: 'Intrusive thoughts and checking rituals',
      diagnosisCode: 'F42.2',
      medications: [
        {
          name: 'Fluoxetine',
          dose: '20 mg',
          frequency: 'Once a day',
          duration: '90 days',
          indications: 'Avoid ibuprofen (allergy).',
        },
      ],
    },
  ],
  diego: [
    {
      date: daysAgo(90, 9),
      type: 'in_person',
      reason: 'Adjustment after retirement',
      evolution: 'Goals reached. Discharged.',
      diagnosisCode: 'F43.21',
    },
  ],
};

const appointments = [
  {
    patient: 'juan',
    startsAt: inDays(1, 10),
    durationMinutes: 45,
    type: 'follow_up',
    modality: 'in_person',
  },
  {
    patient: 'lucia',
    startsAt: inDays(1, 11),
    durationMinutes: 45,
    type: 'control',
    modality: 'virtual',
  },
  {
    patient: 'martin',
    startsAt: inDays(2, 15),
    durationMinutes: 60,
    type: 'follow_up',
    modality: 'in_person',
  },
  {
    patient: 'sofia',
    startsAt: inDays(3, 9),
    durationMinutes: 60,
    type: 'first_visit',
    modality: 'virtual',
  },
  {
    patient: 'valentina',
    startsAt: inDays(5, 16),
    durationMinutes: 60,
    type: 'first_visit',
    modality: 'in_person',
  },
  {
    patient: 'carlos',
    startsAt: inDays(7, 10, 30),
    durationMinutes: 30,
    type: 'medication',
    modality: 'in_person',
    notes: 'Bring the latest blood test.',
  },
  {
    patient: 'ana',
    startsAt: inDays(4, 12),
    durationMinutes: 45,
    type: 'first_visit',
    modality: 'in_person',
    cancel: true,
  },
];

async function seed() {
  if (!ENABLED) {
    console.log('seed: SEED_DEMO_DATA=false, nothing to do');
    return;
  }
  console.log(`seed: ${BASE_URL}`);
  await waitUntilReady();

  const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (login.status === 200) {
    console.log(`seed: ${EMAIL} already exists, demo data is in place`);
    return;
  }
  const registered = await call('POST', '/auth/register', professional);
  if (registered.status === 409) {
    console.log(`seed: ${EMAIL} is registered with another password, skipping`);
    return;
  }
  if (registered.status !== 201) {
    throw new Error(`register → ${registered.status} ${JSON.stringify(registered.body)}`);
  }

  const ids = {};
  for (const { key, ...data } of patients) {
    ids[key] = (await must(201, 'POST', '/patients', data)).id;
  }

  let consultationCount = 0;
  for (const [key, list] of Object.entries(consultations)) {
    for (const consultation of list) {
      await must(201, 'POST', `/patients/${ids[key]}/clinical-record/consultations`, consultation);
      consultationCount += 1;
    }
  }
  await must(200, 'PATCH', `/patients/${ids.diego}/status`, { status: 'discharged' });

  let virtualAppointment = null;
  for (const { patient, cancel, ...slot } of appointments) {
    const created = await must(201, 'POST', '/appointments', { patientId: ids[patient], ...slot });
    if (cancel) {
      await must(200, 'POST', `/appointments/${created.id}/cancel`);
    }
    if (patient === 'lucia') {
      virtualAppointment = created;
    }
  }
  await must(201, 'POST', '/virtual-meetings', {
    patientId: ids.lucia,
    appointmentId: virtualAppointment.id,
  });

  await must(200, 'GET', `/patients/${ids.juan}/clinical-record`);
  await must(201, 'POST', '/subscription/payment-methods', {
    holderName: 'Laura Gómez',
    cardNumber: '4242 4242 4242 4242',
    expMonth: 12,
    expYear: new Date().getUTCFullYear() + 3,
    cvc: '123',
    makeDefault: true,
  });
  await must(200, 'PUT', '/subscription/plan', { planId: 'monthly' });

  console.log(
    `seed: ${patients.length} patients, ${consultationCount} consultations, ` +
      `${appointments.length} appointments (1 cancelled), 1 virtual meeting, 1 card`,
  );
  console.log(`seed: log in with ${EMAIL} / ${PASSWORD}`);
}

try {
  await seed();
} catch (error) {
  console.error(`seed: failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
