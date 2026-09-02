import fs from "node:fs/promises";
import { auth } from "@/auth";
import { getAttachmentForAccess } from "@/lib/attachments-queries";
import { resolveAttachmentPath } from "@/lib/attachments";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/attachments/[id]">,
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;
  const attachment = await getAttachmentForAccess(session, id);
  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(resolveAttachmentPath(attachment.storagePath));
  } catch {
    return new Response("File missing on disk", { status: 404 });
  }

  // Images render inline (so <img> previews work); everything else forces a
  // download. Either way the browser's `download` attribute on same-origin
  // links can still force-save an inline-served image.
  const disposition = attachment.mimeType.startsWith("image/")
    ? "inline"
    : "attachment";
  const asciiFallback = attachment.filename.replace(/[^\x20-\x7E]/g, "_");

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Content-Disposition": `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
