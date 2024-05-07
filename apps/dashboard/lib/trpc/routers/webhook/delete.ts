import { db, eq, schema } from "@/lib/db";
import { ingestAuditLogs } from "@/lib/tinybird";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { auth, t } from "../../trpc";

export const deleteWebhook = t.procedure
  .use(auth)
  .input(
    z.object({
      webhookId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const ws = await db.query.workspaces.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.tenantId, ctx.tenant.id), isNull(table.deletedAt)),
      with: {
        webhooks: {
          where: (table, { eq }) => eq(table.id, input.webhookId),
        },
      },
    });
    if (!ws) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "workspace not found",
      });
    }

    if (ws.webhooks.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "webhook not found",
      });
    }

    await db.delete(schema.webhooks).where(eq(schema.webhooks.id, input.webhookId));

    await ingestAuditLogs({
      workspaceId: ws.id,
      actor: { type: "user", id: ctx.user.id },
      event: "webhook.delete",
      description: `Deleted ${input.webhookId}`,
      resources: [{ type: "webhook", id: input.webhookId }],
      context: {
        location: ctx.audit.location,
        userAgent: ctx.audit.userAgent,
      },
    });

    return;
  });
