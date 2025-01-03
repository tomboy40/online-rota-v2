import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { db, schema } from "~/utils/db.server";
import { eq } from "drizzle-orm";

export async function loader({ params }: LoaderFunctionArgs) {
  const calendar = await db.query.calendar.findFirst({
    where: eq(schema.calendar.id, params.id || '')
  });

  if (!calendar) {
    throw new Response("Calendar not found", { status: 404 });
  }

  return json({
    calendar: {
      ...calendar,
    }
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const appName = formData.get("appName");
  const icalLink = formData.get("icalLink");

  // Validate inputs
  if (!appName || !icalLink) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  // Update calendar using the original ID from params
  await db.update(schema.calendar)
    .set({
      name: appName.toString(),
      icalLink: icalLink.toString()
    })
    .where(eq(schema.calendar.id, params.id || ''));

  return json({ success: true });
} 