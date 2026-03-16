import type { EventType } from '@/shared/types';

export interface ExtractorResult {
  eventType: EventType;
  title: string;
  textContent: string;
  metadata: Record<string, unknown>;
}

export interface SiteExtractor {
  extractOnLoad(doc: Document, url: URL): ExtractorResult | null;
  getInteractionSpecs?(): InteractionSpec[];
  setupSpaListener?(onNavigate: () => void): (() => void) | void;
}

export interface InteractionSpec {
  selector: string;
  eventType: EventType;
  extractMetadata: (
    el: Element,
    doc: Document,
  ) => Record<string, unknown> | null;
  label?: string;
}
