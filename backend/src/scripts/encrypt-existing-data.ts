import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  encryptAiRequestData,
  encryptReminderData,
  encryptReminderLogData,
  encryptScheduleData
} from "../services/privateData.service";

type FieldMap = Record<string, string | null>;

function hasChanged(before: FieldMap, after: FieldMap) {
  return Object.keys(after).some((key) => before[key] !== after[key]);
}

async function encryptSchedules() {
  const schedules = await prisma.schedule.findMany();
  let updated = 0;

  for (const schedule of schedules) {
    const current = {
      title: schedule.title,
      description: schedule.description,
      notes: schedule.notes,
      linksJson: schedule.linksJson,
      extraInfo: schedule.extraInfo
    };
    const encrypted = encryptScheduleData(current);

    if (!hasChanged(current, encrypted)) {
      continue;
    }

    await prisma.schedule.update({
      where: { id: schedule.id },
      data: encrypted
    });
    updated += 1;
  }

  return updated;
}

async function encryptReminders() {
  const reminders = await prisma.reminder.findMany();
  let updated = 0;

  for (const reminder of reminders) {
    const current = {
      title: reminder.title,
      description: reminder.description,
      notes: reminder.notes,
      linksJson: reminder.linksJson,
      location: reminder.location,
      recurrenceRule: reminder.recurrenceRule
    };
    const encrypted = encryptReminderData(current);

    if (!hasChanged(current, encrypted)) {
      continue;
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: encrypted
    });
    updated += 1;
  }

  return updated;
}

async function encryptReminderLogs() {
  const logs = await prisma.reminderLog.findMany();
  let updated = 0;

  for (const log of logs) {
    const current = {
      note: log.note
    };
    const encrypted = encryptReminderLogData(current);

    if (!hasChanged(current, encrypted)) {
      continue;
    }

    await prisma.reminderLog.update({
      where: { id: log.id },
      data: encrypted
    });
    updated += 1;
  }

  return updated;
}

async function encryptAiRequests() {
  const requests = await prisma.aiRequest.findMany();
  let updated = 0;

  for (const request of requests) {
    const current = {
      prompt: request.prompt,
      imageUrl: request.imageUrl,
      aiResponseJson: request.aiResponseJson
    };
    const encrypted = encryptAiRequestData(current);

    if (!hasChanged(current, encrypted)) {
      continue;
    }

    await prisma.aiRequest.update({
      where: { id: request.id },
      data: encrypted
    });
    updated += 1;
  }

  return updated;
}

async function main() {
  const [schedules, reminders, reminderLogs, aiRequests] = await Promise.all([
    encryptSchedules(),
    encryptReminders(),
    encryptReminderLogs(),
    encryptAiRequests()
  ]);

  console.log("[SECURITY] Criptografia aplicada", {
    schedules,
    reminders,
    reminderLogs,
    aiRequests
  });
}

main()
  .catch((error) => {
    console.error("[SECURITY] Falha ao criptografar dados existentes", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
