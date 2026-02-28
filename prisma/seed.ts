import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const events = [
  {
    slug: 'welcome-dinner',
    name: 'Welcome Dinner',
    startsAt: new Date('2027-05-26T18:00:00-07:00'),
    sortOrder: 1
  },
  {
    slug: 'wedding-day',
    name: 'Wedding Day',
    startsAt: new Date('2027-05-27T15:00:00-07:00'),
    sortOrder: 2
  },
  {
    slug: 'venue-breakfast',
    name: 'Venue Breakfast',
    startsAt: new Date('2027-05-28T09:00:00-07:00'),
    sortOrder: 3
  }
];

async function main() {
  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: event,
      create: event
    });
  }

  await prisma.household.upsert({
    where: { code: 'DEMO2027' },
    update: {
      householdName: 'Demo Household',
      maxGuests: 2,
      localeDefault: 'en'
    },
    create: {
      code: 'DEMO2027',
      householdName: 'Demo Household',
      maxGuests: 2,
      localeDefault: 'en'
    }
  });
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
