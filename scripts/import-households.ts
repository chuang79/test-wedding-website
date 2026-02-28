import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randomCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

type CsvRow = {
  householdName: string;
  maxGuests: number;
  contactEmail: string | null;
  localeDefault: string;
  notes: string | null;
};

function parseCsv(content: string): CsvRow[] {
  const [headerLine, ...lines] = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headers = headerLine.split(',').map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return {
      householdName: row.householdName,
      maxGuests: Number(row.maxGuests || '1'),
      contactEmail: row.contactEmail || null,
      localeDefault: row.localeDefault || 'en',
      notes: row.notes || null
    };
  });
}

async function createUniqueCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = randomCode(8);
    const existing = await prisma.household.findUnique({ where: { code: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique invite code after multiple attempts.');
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error('Usage: npm run import:households -- path/to/households.csv');
  }

  const absolutePath = path.resolve(process.cwd(), inputPath);
  const content = await fs.readFile(absolutePath, 'utf8');
  const rows = parseCsv(content);

  for (const row of rows) {
    if (!row.householdName) {
      continue;
    }

    const code = await createUniqueCode();

    await prisma.household.create({
      data: {
        code,
        householdName: row.householdName,
        maxGuests: row.maxGuests,
        contactEmail: row.contactEmail,
        localeDefault: row.localeDefault,
        notes: row.notes
      }
    });

    console.log(`${row.householdName}: ${code}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
