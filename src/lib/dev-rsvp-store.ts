import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { isLateSubmission, type EventResponseInput } from '@/lib/rsvp';

type DevHousehold = {
  id: string;
  code: string;
  householdName: string;
  maxGuests: number;
  localeDefault: string;
};

type DevEvent = {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  sortOrder: number;
  enabled: boolean;
};

type DevRsvp = {
  householdId: string;
  guestName: string | null;
  bringingPlusOne: boolean;
  plusOneName: string | null;
  dietaryNotes: string | null;
  transportMode: string | null;
  karaokeSongsText: string | null;
  messageToCouple: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DevEventResponse = {
  householdId: string;
  eventId: string;
  attending: boolean;
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
};

type DevAuditLog = {
  id: string;
  householdId: string;
  action: string;
  actorType: string;
  payloadJson: unknown;
  createdAt: string;
};

type DevStore = {
  households: DevHousehold[];
  events: DevEvent[];
  rsvps: DevRsvp[];
  eventResponses: DevEventResponse[];
  auditLogs: DevAuditLog[];
};

type DevAdminHousehold = DevHousehold & {
  contactEmail: string | null;
  rsvp: {
    guestName: string | null;
    bringingPlusOne: boolean;
    plusOneName: string | null;
    dietaryNotes: string | null;
    transportMode: string | null;
    karaokeSongsText: string | null;
    messageToCouple: string | null;
    submittedAt: Date | null;
  } | null;
  eventResponses: Array<{
    householdId: string;
    eventId: string;
    attending: boolean;
    attendeeCount: number;
    createdAt: Date;
    updatedAt: Date;
    event: {
      id: string;
      slug: string;
      name: string;
      startsAt: Date;
      sortOrder: number;
    };
  }>;
};

type DevLookupRecord = {
  household: DevHousehold;
  events: DevEvent[];
  existing: {
    guestName: string | null;
    bringingPlusOne: boolean;
    plusOneName: string | null;
    dietaryNotes: string | null;
    transportMode: string | null;
    songRequestsText: string | null;
    messageToCouple: string | null;
    eventResponses: Array<{
      eventId: string;
      attending: boolean;
      attendeeCount: number;
    }>;
  } | null;
};

type SaveGuestRsvpInput = {
  code: string;
  guestName: string;
  bringingPlusOne: boolean;
  plusOneName: string | null;
  dietaryNotes: string | null;
  transportMode: string;
  songRequestsText: string | null;
  messageToCouple: string | null;
  eventResponses: EventResponseInput[];
};

const STORE_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(STORE_DIR, 'dev-rsvp-store.json');

const defaultStore: DevStore = {
  households: [
    {
      id: 'household-demo',
      code: 'DEMO2027',
      householdName: 'Demo Household',
      maxGuests: 2,
      localeDefault: 'en'
    },
    {
      id: 'household-chen',
      code: 'CHEN2027',
      householdName: 'Chen Family',
      maxGuests: 3,
      localeDefault: 'zh-TW'
    },
    {
      id: 'household-lee',
      code: 'LEE2027',
      householdName: 'Lee Household',
      maxGuests: 2,
      localeDefault: 'en'
    },
    {
      id: 'household-wang',
      code: 'WANG2027',
      householdName: 'Wang Family',
      maxGuests: 4,
      localeDefault: 'zh-CN'
    }
  ],
  events: [
    {
      id: 'event-welcome-dinner',
      slug: 'welcome-dinner',
      name: 'Welcome Dinner',
      startsAt: '2027-05-26T18:00:00-07:00',
      sortOrder: 1,
      enabled: true
    },
    {
      id: 'event-wedding-day',
      slug: 'wedding-day',
      name: 'Wedding Day',
      startsAt: '2027-05-27T15:00:00-07:00',
      sortOrder: 2,
      enabled: true
    },
    {
      id: 'event-venue-breakfast',
      slug: 'venue-breakfast',
      name: 'Venue Breakfast',
      startsAt: '2027-05-28T09:00:00-07:00',
      sortOrder: 3,
      enabled: true
    }
  ],
  rsvps: [],
  eventResponses: [],
  auditLogs: []
};

function cloneDefaultStore(): DevStore {
  return JSON.parse(JSON.stringify(defaultStore)) as DevStore;
}

function mergeDefaults(store: Partial<DevStore> | null | undefined): DevStore {
  const merged = cloneDefaultStore();

  if (!store) {
    return merged;
  }

  if (Array.isArray(store.households)) {
    const byCode = new Map(merged.households.map((household) => [household.code, household]));
    for (const household of store.households) {
      byCode.set(household.code, household);
    }
    merged.households = [...byCode.values()];
  }

  if (Array.isArray(store.events)) {
    const byId = new Map(merged.events.map((event) => [event.id, event]));
    for (const event of store.events) {
      byId.set(event.id, event);
    }
    merged.events = [...byId.values()].sort((left, right) => left.sortOrder - right.sortOrder);
  }

  merged.rsvps = Array.isArray(store.rsvps) ? store.rsvps : [];
  merged.eventResponses = Array.isArray(store.eventResponses) ? store.eventResponses : [];
  merged.auditLogs = Array.isArray(store.auditLogs) ? store.auditLogs : [];

  return merged;
}

async function readStore(): Promise<DevStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return mergeDefaults(JSON.parse(raw) as Partial<DevStore>);
  } catch {
    const store = cloneDefaultStore();
    await writeStore(store);
    return store;
  }
}

async function writeStore(store: DevStore) {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

function buildLookupRecord(store: DevStore, household: DevHousehold): DevLookupRecord {
  const rsvp = store.rsvps.find((item) => item.householdId === household.id) ?? null;
  const eventResponses = store.eventResponses
    .filter((item) => item.householdId === household.id)
    .map((item) => ({
      eventId: item.eventId,
      attending: item.attending,
      attendeeCount: item.attendeeCount
    }));

  return {
    household,
    events: store.events.filter((event) => event.enabled).sort((left, right) => left.sortOrder - right.sortOrder),
    existing: rsvp
      ? {
          guestName: rsvp.guestName,
          bringingPlusOne: rsvp.bringingPlusOne,
          plusOneName: rsvp.plusOneName,
          dietaryNotes: rsvp.dietaryNotes,
          transportMode: rsvp.transportMode,
          songRequestsText: rsvp.karaokeSongsText,
          messageToCouple: rsvp.messageToCouple,
          eventResponses
        }
      : null
  };
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function shouldUseDevRsvpStore(error: unknown) {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes('ECONNREFUSED') ||
    message.includes('P1001')
  );
}

export async function lookupGuestInDevStore(code: string): Promise<DevLookupRecord | null> {
  const store = await readStore();
  const household = store.households.find((item) => item.code === code) ?? null;

  if (!household) {
    return null;
  }

  return buildLookupRecord(store, household);
}

export async function saveGuestRsvpInDevStore(input: SaveGuestRsvpInput) {
  const store = await readStore();
  const household = store.households.find((item) => item.code === input.code) ?? null;

  if (!household) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const existingRsvp = store.rsvps.find((item) => item.householdId === household.id) ?? null;

  const nextRsvp: DevRsvp = {
    householdId: household.id,
    guestName: input.guestName,
    bringingPlusOne: input.bringingPlusOne,
    plusOneName: input.plusOneName,
    dietaryNotes: input.dietaryNotes,
    transportMode: input.transportMode,
    karaokeSongsText: input.songRequestsText,
    messageToCouple: input.messageToCouple,
    submittedAt: nowIso,
    createdAt: existingRsvp?.createdAt ?? nowIso,
    updatedAt: nowIso
  };

  store.rsvps = [...store.rsvps.filter((item) => item.householdId !== household.id), nextRsvp];
  store.eventResponses = [
    ...store.eventResponses.filter((item) => item.householdId !== household.id),
    ...input.eventResponses.map((response) => ({
      householdId: household.id,
      eventId: response.eventId,
      attending: response.attending,
      attendeeCount: response.attending ? response.attendeeCount : 0,
      createdAt: nowIso,
      updatedAt: nowIso
    }))
  ];
  store.auditLogs.push({
    id: createId('audit'),
    householdId: household.id,
    action: 'guest.submit',
    actorType: 'guest',
    payloadJson: {
      late: isLateSubmission(),
      guestName: input.guestName,
      bringingPlusOne: input.bringingPlusOne,
      plusOneName: input.plusOneName,
      transportMode: input.transportMode,
      dietaryNotes: input.dietaryNotes,
      songRequestsText: input.songRequestsText,
      messageToCouple: input.messageToCouple,
      eventResponses: input.eventResponses
    },
    createdAt: nowIso
  });

  await writeStore(store);

  return {
    household,
    record: buildLookupRecord(store, household),
    late: isLateSubmission(),
    updatedAt: nowIso
  };
}

export async function getAdminSnapshotFromDevStore() {
  const store = await readStore();
  const enabledEvents = store.events
    .filter((event) => event.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((event) => ({
      ...event,
      startsAt: new Date(event.startsAt)
    }));

  const households: DevAdminHousehold[] = store.households
    .slice()
    .sort((left, right) => left.householdName.localeCompare(right.householdName))
    .map((household) => {
      const rsvp = store.rsvps.find((item) => item.householdId === household.id) ?? null;
      const eventResponses = store.eventResponses
        .filter((item) => item.householdId === household.id)
        .map((response) => {
          const event = store.events.find((item) => item.id === response.eventId);
          if (!event) {
            return null;
          }

          return {
            ...response,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
            event: {
              id: event.id,
              slug: event.slug,
              name: event.name,
              startsAt: new Date(event.startsAt),
              sortOrder: event.sortOrder
            }
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((left, right) => left.event.sortOrder - right.event.sortOrder);

      return {
        ...household,
        contactEmail: null,
        rsvp: rsvp
          ? {
              guestName: rsvp.guestName,
              bringingPlusOne: rsvp.bringingPlusOne,
              plusOneName: rsvp.plusOneName,
              dietaryNotes: rsvp.dietaryNotes,
              transportMode: rsvp.transportMode,
              karaokeSongsText: rsvp.karaokeSongsText,
              messageToCouple: rsvp.messageToCouple,
              submittedAt: rsvp.submittedAt ? new Date(rsvp.submittedAt) : null
            }
          : null,
        eventResponses
      };
    });

  return {
    households,
    events: enabledEvents,
    totalRsvps: store.rsvps.length
  };
}
