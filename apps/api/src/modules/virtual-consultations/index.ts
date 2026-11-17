export type { VirtualMeetingDto } from './contracts/virtual-consultations.contracts';
export { GoogleMeetLinkProvider } from './infrastructure/GoogleMeetLinkProvider';
export { JitsiMeetingLinkProvider } from './infrastructure/JitsiMeetingLinkProvider';
export type { MeetingLinkProvider } from './model/ports';
export {
  VirtualConsultationsModule,
  type VirtualConsultationsModuleDependencies,
} from './VirtualConsultationsModule';
