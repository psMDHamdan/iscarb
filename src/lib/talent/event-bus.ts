/**
 * Tiny synchronous event bus for the talent collaboration domain (Task 3c).
 * ===========================================================================
 * The brief asks that notification triggering be event-driven — services
 * PUBLISH a `candidate.submitted` event and other systems (email, employer
 * inbox) SUBSCRIBE without tight coupling. This is an in-process, dependency-
 * free bus; a production deployment can bridge these events to the persisted
 * OutboxEvent table / a message broker at the subscriber layer.
 * ===========================================================================
 */

export interface TalentEvents {
  "candidate.submitted": {
    jobId: string;
    employerId: string;
    studentId: string;
    recruiterId: string;
    matchScore: number | null;
    notifyEmployer: boolean;
  };
  "job.posted": {
    jobId: string;
    employerId: string;
    title: string;
    focusAreas: string[];
  };
  "employer.feedback": {
    jobId: string;
    submissionId: string;
    recruiterId: string;
    rating?: number;
  };
}

export type TalentEventName = keyof TalentEvents;

type Handler<K extends TalentEventName> = (
  payload: TalentEvents[K],
) => void | Promise<void>;

export class TalentEventBus {
  private handlers: { [K in TalentEventName]?: Set<Handler<K>> } = {};

  on<K extends TalentEventName>(event: K, handler: Handler<K>): () => void {
    const set = (this.handlers[event] ??= new Set()) as Set<Handler<K>>;
    set.add(handler);
    return () => set.delete(handler);
  }

  /** Publish; awaits all handlers. A throwing subscriber never breaks publish. */
  async emit<K extends TalentEventName>(
    event: K,
    payload: TalentEvents[K],
  ): Promise<void> {
    const set = this.handlers[event] as Set<Handler<K>> | undefined;
    if (!set || set.size === 0) return;
    await Promise.all(
      [...set].map(async (h) => {
        try {
          await h(payload);
        } catch {
          // Subscriber isolation: one failing subscriber must not fail others
          // or the publishing operation (submission still succeeds).
        }
      }),
    );
  }
}

/** Shared process-wide bus instance. */
export const talentEvents = new TalentEventBus();
