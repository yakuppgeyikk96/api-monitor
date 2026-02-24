import { and, isNull, type SQL, type SQLWrapper } from "drizzle-orm";

export function withActive<T extends { deletedAt: SQLWrapper }>(
  table: T,
  ...conditions: (SQL | undefined)[]
): SQL {
  return and(...conditions, isNull(table.deletedAt))!;
}
