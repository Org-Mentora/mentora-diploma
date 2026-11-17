import { randomInt, randomUUID } from 'node:crypto';

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const WAIT_SECONDS = Number(process.env.SMOKE_WAIT_SECONDS ?? 90);

let cookie = '';
let failures = 0;

async function call(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
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
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, body: json, headers: response.headers };
}

async function check(name, run) {
  try {
    await run();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitUntilReady() {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  while (Date.now() < deadline) {
    try {
      const { status } = await call('GET', '/api/health/ready');
      if (status === 200) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`${BASE_URL} was not ready after ${WAIT_SECONDS}s`);
}

console.log(`smoke: ${BASE_URL}`);
await waitUntilReady();

const unique = randomUUID().slice(0, 8);
const email = `smoke.${unique}@mentora.test`;
const password = 'Smoke1234';
const state = {};

await check('web serves the SPA', async () => {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  expect(response.status === 200 && html.includes('<div id="root">'), `status ${response.status}`);
});

await check('API is live and ready', async () => {
  const live = await call('GET', '/api/health/live');
  const ready = await call('GET', '/api/health/ready');
  expect(live.status === 200 && ready.status === 200, `live ${live.status}, ready ${ready.status}`);
  expect(ready.headers.get('x-request-id'), 'missing X-Request-Id');
});

await check('CU-03 register starts the trial', async () => {
  const { status, body } = await call('POST', '/api/auth/register', {
    firstName: 'Smoke',
    lastName: 'Test',
    email,
    phone: '+54 11 5555 0000',
    specialty: 'Psychiatry',
    licenseNumber: `SM-${unique}`,
    password,
  });
  expect(status === 201, `status ${status}`);
  expect(body.subscription?.status === 'trial', `subscription ${body.subscription?.status}`);
});

await check('CU-01 session is restored', async () => {
  const { status } = await call('GET', '/api/auth/me');
  expect(status === 200, `status ${status}`);
});

await check('CU-04 register a patient', async () => {
  const { status, body } = await call('POST', '/api/patients', {
    firstName: 'Paciente',
    lastName: 'Smoke',
    dni: String(randomInt(10_000_000, 99_999_999)),
    phone: '11 5555 1234',
  });
  expect(status === 201, `status ${status}`);
  state.patientId = body.id;
});

await check('CU-05 search finds the patient', async () => {
  const { status, body } = await call('GET', '/api/patients?q=Smoke');
  expect(status === 200, `status ${status}`);
  expect(JSON.stringify(body).includes(state.patientId), 'not found');
});

await check('CU-10 schedule a virtual appointment', async () => {
  const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  startsAt.setUTCMinutes(0, 0, 0);
  const { status, body } = await call('POST', '/api/appointments', {
    patientId: state.patientId,
    startsAt: startsAt.toISOString(),
    durationMinutes: 45,
    type: 'first_visit',
    modality: 'virtual',
  });
  expect(status === 201, `status ${status} ${JSON.stringify(body)}`);
  state.appointmentId = body.id;
});

await check('CU-14 the confirmation was sent by WhatsApp', async () => {
  const { status, body } = await call('GET', `/api/notifications?patientId=${state.patientId}`);
  expect(status === 200, `status ${status}`);
  expect(JSON.stringify(body).includes('appointment_scheduled'), 'no confirmation recorded');
});

await check('CU-15 start the virtual consultation', async () => {
  const { status, body } = await call('POST', '/api/virtual-meetings', {
    patientId: state.patientId,
    appointmentId: state.appointmentId,
  });
  expect(status === 201, `status ${status}`);
  expect(typeof body.joinUrl === 'string' && body.joinUrl.startsWith('https://'), 'no link');
});

await check('CU-09 register a consultation', async () => {
  const { status } = await call(
    'POST',
    `/api/patients/${state.patientId}/clinical-record/consultations`,
    { date: new Date().toISOString(), type: 'virtual', reason: 'Smoke test' },
  );
  expect(status === 201, `status ${status}`);
});

await check('CU-18 subscription is visible', async () => {
  const { status, body } = await call('GET', '/api/subscription');
  expect(status === 200 && body.status === 'trial', `status ${status} ${body?.status}`);
});

await check('logout ends the session', async () => {
  const out = await call('POST', '/api/auth/logout');
  cookie = '';
  const me = await call('GET', '/api/auth/me');
  expect(out.status === 204 && me.status === 401, `logout ${out.status}, me ${me.status}`);
});

if (failures > 0) {
  console.error(`smoke: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('smoke: all checks passed');
