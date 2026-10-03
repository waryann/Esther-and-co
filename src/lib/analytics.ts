import { db } from "./db";

export const EVENT_NAMES = [
  "page_view",
  "newsletter_signup",
  "reservation_started",
  "service_selected",
  "package_selected",
  "option_selected",
  "date_selected",
  "customer_info_submitted",
  "checkout_started",
  "payment_success",
  "booking_confirmed",
] as const;

export async function recordEvent(name: string, sessionId: string, path: string, props: unknown = null) {
  await db.analyticsEvent.create({
    data: {
      name,
      sessionId: sessionId.slice(0, 64),
      path: path.slice(0, 200),
      props: props ? JSON.stringify(props).slice(0, 500) : "",
    },
  });
}
