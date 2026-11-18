import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import { RateLimiter, type RateLimitRule } from '#infrastructure/http/RateLimiter';
import {
  AcceptBookingRequestSchema,
  type AvailableSlotsDto,
  AvailableSlotsQuerySchema,
  type BookingReceiptDto,
  type BookingRequestDto,
  type BookingRequestPageDto,
  type BookingSettingsDto,
  CreateBookingRequestSchema,
  ListBookingRequestsQuerySchema,
  type PublicBookingPageDto,
  RejectBookingRequestSchema,
  RequestIdParamsSchema,
  SlugParamsSchema,
  UpdateBookingSettingsRequestSchema,
} from '../contracts/booking.contracts';
import type { BookingPresenterFactory } from '../presenter/BookingPresenterFactory';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const RULES = {
  requestsPerIp: {
    name: 'booking-request-ip',
    limit: 5,
    windowMs: HOUR_MS,
    key: RateLimiter.byIp,
  },
  readsPerIp: {
    name: 'booking-read-ip',
    limit: 120,
    windowMs: 15 * MINUTE_MS,
    key: RateLimiter.byIp,
  },
} satisfies Record<string, RateLimitRule>;

export class BookingRoutes {
  constructor(
    private readonly presenters: BookingPresenterFactory,
    private readonly guard: AuthGuard,
    private readonly limiter: RateLimiter,
  ) {}

  build(): Router {
    const router = Router();
    const reads = this.limiter.limit(RULES.readsPerIp);
    const owner = this.guard.requireActiveSubscription;

    router.get('/public/:slug', reads, async (req, res) => {
      const view = new JsonHttpView<PublicBookingPageDto>(new ExpressResponderAdapter(res));
      const { slug } = InputParser.parse(SlugParamsSchema, req.params);
      await this.presenters.getPublicBookingPage(view).present(slug);
    });

    router.get('/public/:slug/slots', reads, async (req, res) => {
      const view = new JsonHttpView<AvailableSlotsDto>(new ExpressResponderAdapter(res));
      const { slug } = InputParser.parse(SlugParamsSchema, req.params);
      const query = InputParser.parse(AvailableSlotsQuerySchema, req.query);
      await this.presenters.getAvailableSlots(view).present({ slug, ...query });
    });

    router.post(
      '/public/:slug/requests',
      this.limiter.limit(RULES.requestsPerIp),
      async (req, res) => {
        const view = new JsonHttpView<BookingReceiptDto>(new ExpressResponderAdapter(res), 201);
        const { slug } = InputParser.parse(SlugParamsSchema, req.params);
        const data = InputParser.parse(CreateBookingRequestSchema, req.body);
        await this.presenters.createBookingRequest(view).present({ slug, data });
      },
    );

    router.get('/settings', owner, async (_req, res) => {
      const view = new JsonHttpView<BookingSettingsDto>(new ExpressResponderAdapter(res));
      await this.presenters.getBookingSettings(view).present(ActorReader.from(res));
    });

    router.put('/settings', owner, async (req, res) => {
      const view = new JsonHttpView<BookingSettingsDto>(new ExpressResponderAdapter(res));
      const data = InputParser.parse(UpdateBookingSettingsRequestSchema, req.body);
      await this.presenters
        .updateBookingSettings(view)
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/requests', owner, async (req, res) => {
      const view = new JsonHttpView<BookingRequestPageDto>(new ExpressResponderAdapter(res));
      const query = InputParser.parse(ListBookingRequestsQuerySchema, req.query);
      await this.presenters
        .listBookingRequests(view)
        .present({ actor: ActorReader.from(res), ...query });
    });

    router.post('/requests/:id/accept', owner, async (req, res) => {
      const view = new JsonHttpView<BookingRequestDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(RequestIdParamsSchema, req.params);
      const data = InputParser.parse(AcceptBookingRequestSchema, req.body);
      await this.presenters
        .acceptBookingRequest(view)
        .present({ actor: ActorReader.from(res), requestId: id, data });
    });

    router.post('/requests/:id/reject', owner, async (req, res) => {
      const view = new JsonHttpView<BookingRequestDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(RequestIdParamsSchema, req.params);
      const data = InputParser.parse(RejectBookingRequestSchema, req.body ?? {});
      await this.presenters
        .rejectBookingRequest(view)
        .present({ actor: ActorReader.from(res), requestId: id, data });
    });

    return router;
  }
}
