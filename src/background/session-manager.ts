import { db } from '@/storage/db';
import { buildNarrative } from './narrative-builder';
import type { Session } from '@/shared/types';

const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes
const ALARM_NAME = 'session-embed-timer';
const ALARM_INTERVAL_MIN = 5;

let currentSessionId: number | null = null;

export function getCurrentSessionId(): number | null {
  return currentSessionId;
}
let lastEmbeddedNarrative: string | null = null;
let updateChain: Promise<void> = Promise.resolve();

// Callback set by background wiring for embedding sessions
let onFinalizeSession: ((session: Session) => Promise<void>) | null = null;
let onReEmbedSession: ((session: Session) => Promise<void>) | null = null;

export function setSessionCallbacks(callbacks: {
  onFinalize: (session: Session) => Promise<void>;
  onReEmbed: (session: Session) => Promise<void>;
}) {
  onFinalizeSession = callbacks.onFinalize;
  onReEmbedSession = callbacks.onReEmbed;
}

export async function initSessionManager(): Promise<void> {
  // Load most recent session from DB
  const latest = await db.sessions.orderBy('endTime').last();

  if (latest?.id != null) {
    const gap = Date.now() - latest.endTime;
    if (gap <= SESSION_GAP_MS) {
      currentSessionId = latest.id;
      lastEmbeddedNarrative = latest.embeddingId != null ? latest.narrative : null;
      console.log(`[session] Resumed session ${currentSessionId}`);
    }
  }

  // Set up periodic alarm for re-embedding active sessions
  browser.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_INTERVAL_MIN });
}

export function getAlarmName(): string {
  return ALARM_NAME;
}

export async function handleSessionAlarm(): Promise<void> {
  if (currentSessionId == null) return;

  const session = await db.sessions.get(currentSessionId);
  if (!session) return;

  // Only re-embed if narrative changed since last embed
  if (session.narrative === lastEmbeddedNarrative) return;

  if (onReEmbedSession) {
    await onReEmbedSession(session);
    lastEmbeddedNarrative = session.narrative;
  }
}

export function assignSession(eventId: number, timestamp: number): void {
  // Serialize session updates via promise chain
  updateChain = updateChain.then(() => doAssignSession(eventId, timestamp)).catch(err => {
    console.error('[session] Error assigning session:', err);
  });
}

async function doAssignSession(eventId: number, timestamp: number): Promise<void> {
  const event = await db.browsing_events.get(eventId);
  if (!event) return;

  let needsNewSession = currentSessionId == null;

  if (!needsNewSession && currentSessionId != null) {
    const current = await db.sessions.get(currentSessionId);
    if (!current || timestamp - current.endTime > SESSION_GAP_MS) {
      // Finalize old session before creating new one
      if (current && onFinalizeSession) {
        await onFinalizeSession(current);
      }
      needsNewSession = true;
    }
  }

  if (needsNewSession) {
    const newSession: Session = {
      startTime: timestamp,
      endTime: timestamp,
      narrative: buildNarrative([event]),
      eventIds: [eventId],
      domains: [event.domain],
    };
    currentSessionId = (await db.sessions.add(newSession)) as number;
    lastEmbeddedNarrative = null;
    console.log(`[session] Created session ${currentSessionId}`);
  } else {
    // Append to current session
    const session = await db.sessions.get(currentSessionId!);
    if (!session) return;

    session.eventIds.push(eventId);
    session.endTime = timestamp;
    if (!session.domains.includes(event.domain)) {
      session.domains.push(event.domain);
    }

    // Rebuild narrative from all session events
    const events = await db.browsing_events.bulkGet(session.eventIds);
    const validEvents = events.filter((e): e is NonNullable<typeof e> => e != null);
    session.narrative = buildNarrative(validEvents);

    await db.sessions.update(currentSessionId!, {
      eventIds: session.eventIds,
      endTime: session.endTime,
      domains: session.domains,
      narrative: session.narrative,
    });
  }

  // Link event to session
  await db.browsing_events.update(eventId, { sessionId: currentSessionId! });
}
