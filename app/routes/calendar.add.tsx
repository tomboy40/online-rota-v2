import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { schema } from "../../drizzle";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }

  const formData = await request.formData();
  const appId = formData.get("appId");
  const appName = formData.get("appName");
  const icalLink = formData.get("icalLink");

  if (!appId || !appName || !icalLink) {
    throw new Error("Missing required fields");
  }

  await db.insert(schema.calendar).values({
    id: appId as string,
    name: appName as string,
    icalLink: icalLink as string,
  });

  return redirect("/calendar/week");
}