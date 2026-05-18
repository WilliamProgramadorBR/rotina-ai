import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { prisma } from "../lib/prisma";

type Row = Record<string, unknown>;

type CopyStep = {
  table: string;
  model: string;
  dateFields: string[];
};

const copySteps: CopyStep[] = [
  { table: "User", model: "user", dateFields: ["acceptedPrivacyAt", "createdAt", "updatedAt"] },
  { table: "CollaborationGroup", model: "collaborationGroup", dateFields: ["createdAt", "updatedAt"] },
  { table: "Schedule", model: "schedule", dateFields: ["createdAt", "updatedAt"] },
  { table: "Reminder", model: "reminder", dateFields: ["startAt", "endAt", "createdAt", "updatedAt"] },
  { table: "ReminderLog", model: "reminderLog", dateFields: ["createdAt"] },
  { table: "ReminderComment", model: "reminderComment", dateFields: ["createdAt", "updatedAt"] },
  { table: "PasswordResetToken", model: "passwordResetToken", dateFields: ["expiresAt", "usedAt", "createdAt"] },
  { table: "AlarmLog", model: "alarmLog", dateFields: ["alarmTime", "createdAt"] },
  { table: "AiRequest", model: "aiRequest", dateFields: ["createdAt"] },
  { table: "CollaborationMember", model: "collaborationMember", dateFields: ["joinedAt"] },
  { table: "CollaborationInvite", model: "collaborationInvite", dateFields: ["createdAt", "updatedAt", "acceptedAt"] },
  { table: "CollaborationMessage", model: "collaborationMessage", dateFields: ["createdAt", "updatedAt"] },
  { table: "CollaborationPresence", model: "collaborationPresence", dateFields: ["lastSeenAt", "createdAt", "updatedAt"] }
];

const resetModels = [
  "collaborationPresence",
  "collaborationMessage",
  "collaborationInvite",
  "collaborationMember",
  "reminderComment",
  "reminderLog",
  "alarmLog",
  "aiRequest",
  "passwordResetToken",
  "reminder",
  "schedule",
  "collaborationGroup",
  "user"
];

function assertMysqlTarget() {
  const databaseUrl = process.env.DATABASE_URL || "";

  if (!databaseUrl.startsWith("mysql://") && !databaseUrl.startsWith("mariadb://")) {
    throw new Error("DATABASE_URL precisa apontar para MySQL/MariaDB antes da migracao.");
  }
}

function toDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(typeof value === "number" ? value : String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data invalida encontrada durante migracao: ${String(value)}`);
  }

  return date;
}

function normalizeRow(row: Row, dateFields: string[]) {
  const normalized = { ...row };

  for (const field of dateFields) {
    if (field in normalized) {
      normalized[field] = toDate(normalized[field]);
    }
  }

  return normalized;
}

function chunkRows<T>(rows: T[], size = 500) {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

async function resetTargetDatabase() {
  console.log("Limpando tabelas MySQL de destino...");

  for (const model of resetModels) {
    await (prisma as any)[model].deleteMany();
  }
}

async function copyTable(sqlite: Database.Database, existingTables: Set<string>, step: CopyStep) {
  if (!existingTables.has(step.table)) {
    console.log(`Pulando ${step.table}: tabela nao existe no SQLite.`);
    return;
  }

  const rows = sqlite
    .prepare(`SELECT * FROM "${step.table}"`)
    .all()
    .map((row) => normalizeRow(row as Row, step.dateFields));

  if (rows.length === 0) {
    console.log(`${step.table}: 0 registros.`);
    return;
  }

  for (const chunk of chunkRows(rows)) {
    await (prisma as any)[step.model].createMany({
      data: chunk,
      skipDuplicates: true
    });
  }

  console.log(`${step.table}: ${rows.length} registros migrados.`);
}

async function main() {
  assertMysqlTarget();

  const shouldResetTarget = process.argv.includes("--reset-target");
  const sqlitePath = path.resolve(process.cwd(), process.env.SQLITE_DATABASE_PATH || "./dev.db");

  if (!existsSync(sqlitePath)) {
    throw new Error(`Banco SQLite nao encontrado em ${sqlitePath}.`);
  }

  const sqlite = new Database(sqlitePath, {
    readonly: true,
    fileMustExist: true
  });

  try {
    const existingTables = new Set(
      sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row: any) => String(row.name))
    );

    if (shouldResetTarget) {
      await resetTargetDatabase();
    }

    for (const step of copySteps) {
      await copyTable(sqlite, existingTables, step);
    }

    console.log("Migracao SQLite -> MySQL concluida.");
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
