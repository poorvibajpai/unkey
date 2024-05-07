import { relations } from "drizzle-orm";
import { datetime, index, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { embeddedSecret } from "./util/embedded_secret";
import { workspaces } from "./workspaces";

export const secrets = mysqlTable(
  "secrets",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    ...embeddedSecret,
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
    comment: varchar("comment", { length: 256 }),
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
    uniqueNamePerWorkspace: uniqueIndex("unique_workspace_id_name_idx").on(
      table.workspaceId,
      table.name,
    ),
  }),
);

export const secretsRelations = relations(secrets, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [secrets.workspaceId],
    references: [workspaces.id],
  }),
}));
