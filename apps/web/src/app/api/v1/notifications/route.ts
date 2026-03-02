import { NextRequest } from 'next/server';
import { notifications, activityFeed, ok } from '../_mock/data';

export async function GET() {
  const unread = notifications.filter((n) => !n.read).length;
  return ok({ data: [...notifications], unread, activity: activityFeed });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.markAllRead) {
    notifications.forEach((n) => { n.read = true; });
  } else if (body.id) {
    const n = notifications.find((x) => x.id === body.id);
    if (n) n.read = true;
  }
  return ok({ unread: notifications.filter((n) => !n.read).length });
}
