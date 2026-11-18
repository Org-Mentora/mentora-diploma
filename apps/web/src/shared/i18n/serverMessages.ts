import type { Language } from './i18n';

const ES: Record<string, string> = {
  'If the email belongs to an account, we sent it a 6-digit code. It expires in 15 minutes.':
    'Si el email pertenece a una cuenta, le enviamos un código de 6 dígitos. Vence en 15 minutos.',
  'Invalid cursor': 'La página pedida ya no es válida. Volvé a cargar la lista.',
  'A patient with this DNI is already registered': 'Ya hay un paciente registrado con este DNI',
  'A payment with this reference is already registered':
    'Ya hay un pago registrado con esta referencia',
  'Add at least one time range before enabling online booking':
    'Agregá al menos un rango horario antes de habilitar la reserva online',
  'Allow at least one modality': 'Permití al menos una modalidad',
  'Appointments cannot be scheduled in the past': 'No se pueden agendar turnos en el pasado',
  'Authentication is required': 'Tenés que iniciar sesión',
  'Choose a plan before registering a payment': 'Elegí un plan antes de registrar un pago',
  'DNI must have 7 or 8 digits': 'El DNI tiene 7 u 8 dígitos',
  'Dates use the YYYY-MM-DD format': 'Las fechas usan el formato AAAA-MM-DD',
  'Debt cannot be negative': 'La deuda no puede ser negativa',
  'Each time range must fit at least one slot':
    'Cada rango horario tiene que tener lugar para al menos un turno',
  'Expiry month must be between 1 and 12': 'El mes de vencimiento va de 1 a 12',
  'Family contact needs both a name and a phone': 'El contacto familiar necesita nombre y teléfono',
  'Fees must be positive amounts': 'Los honorarios deben ser montos positivos',
  'First and last name are required': 'El nombre y el apellido son obligatorios',
  'Invalid email or password': 'Email o contraseña incorrectos',
  'Leave a phone number or an email to confirm the appointment':
    'Dejá un teléfono o un email para confirmar el turno',
  'Months use the YYYY-MM format': 'Los meses usan el formato AAAA-MM',
  'Only virtual appointments have a video call': 'Solo los turnos virtuales tienen videollamada',
  'Patients can book between 1 and 90 days ahead':
    'Los pacientes pueden reservar entre 1 y 90 días antes',
  'Payment method not found': 'No se encontró el medio de pago',
  'Register a payment method before enabling automatic debit':
    'Registrá un medio de pago antes de activar el débito automático',
  'Register a payment method to activate the plan':
    'Registrá un medio de pago para activar el plan',
  'Request validation failed': 'Revisá los datos ingresados',
  'The appointment was cancelled': 'El turno fue cancelado',
  'The card holder name is required': 'El nombre del titular es obligatorio',
  'The card is expired': 'La tarjeta está vencida',
  'The card number is not valid': 'El número de tarjeta no es válido',
  'The consultation reason is required': 'El motivo de consulta es obligatorio',
  'The current password is incorrect': 'La contraseña actual es incorrecta',
  'The email is not valid': 'El email no es válido',
  'The fee must be a positive amount': 'El honorario debe ser un monto positivo',
  'The minimum notice must be between 0 and 168 hours':
    'La anticipación mínima va de 0 a 168 horas',
  'The payment date cannot be in the future': 'La fecha de pago no puede ser futura',
  'The payment provider is not available. Try again in a few minutes.':
    'El proveedor de pagos no está disponible. Probá de nuevo en unos minutos.',
  'The requested time already passed; the request expired':
    'El horario pedido ya pasó; la solicitud venció',
  'The security code is not valid': 'El código de seguridad no es válido',
  'The selected time overlaps another appointment': 'El horario se superpone con otro turno',
  'The slot must last between 15 and 240 minutes': 'El turno debe durar entre 15 y 240 minutos',
  'The subscription is already cancelled': 'La suscripción ya está cancelada',
  'The video call is already being started. Try again.':
    'La videollamada ya se está creando. Probá de nuevo.',
  'This appointment was cancelled and can no longer be changed':
    'Este turno fue cancelado y ya no se puede modificar',
  'This email is already registered. Log in or use another email.':
    'Este email ya está registrado. Iniciá sesión o usá otro email.',
  'This is the only card used for automatic debit. Renewals will not be charged until you add another one.':
    'Es la única tarjeta del débito automático. Las renovaciones no se cobrarán hasta que agregues otra.',
  'This license number is already registered.': 'Esta matrícula ya está registrada.',
  'This modality is not available': 'Esta modalidad no está disponible',
  'This time is no longer available. Choose another one.':
    'Este horario ya no está disponible. Elegí otro.',
  'Time ranges of the same day cannot overlap':
    'Los rangos horarios del mismo día no pueden superponerse',
  'Times use the HH:mm format': 'Los horarios usan el formato HH:mm',
  'Too many attempts. Wait a few minutes and try again.':
    'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'You already have pending requests. Wait until the professional answers them.':
    'Ya tenés solicitudes pendientes. Esperá a que el profesional las responda.',
  'You are not allowed to perform this action': 'No tenés permiso para hacer esta acción',
  'Your account no longer exists': 'Tu cuenta ya no existe',
  'Your password was changed. Log in again.': 'Tu contraseña cambió. Iniciá sesión de nuevo.',
  'Your session is invalid or has expired': 'Tu sesión no es válida o venció',
  'Your subscription is not active. Choose a plan to continue.':
    'Tu suscripción no está activa. Elegí un plan para continuar.',
  '`to` must be after `from`': 'El fin debe ser posterior al inicio',
  '`to` must not be before `from`': 'El fin no puede ser anterior al inicio',
};

const PATTERNS: [RegExp, (m: RegExpExecArray) => string][] = [
  [
    /^This request was already (\w+)$/,
    (m) => `Esta solicitud ya fue ${STATUS[m[1] ?? ''] ?? m[1]}`,
  ],
  [
    /^The range cannot exceed (\d+) (days|months)$/,
    (m) => `El rango no puede superar ${m[1]} ${m[2] === 'days' ? 'días' : 'meses'}`,
  ],
  [/^Patient is already (\w+)$/, () => 'El paciente ya tiene ese estado'],
  [/^The payment was declined: (.*)$/, (m) => `El pago fue rechazado: ${m[1]}`],
  [/^(.*) '.*' was not found$/, () => 'No se encontró lo que buscabas'],
];

const STATUS: Record<string, string> = {
  accepted: 'aceptada',
  rejected: 'rechazada',
  expired: 'vencida',
};

export function translateServerMessage(message: string, language: Language): string {
  if (language !== 'es') {
    return message;
  }
  const exact = ES[message];
  if (exact) {
    return exact;
  }
  for (const [pattern, render] of PATTERNS) {
    const match = pattern.exec(message);
    if (match) {
      return render(match);
    }
  }
  return message;
}
