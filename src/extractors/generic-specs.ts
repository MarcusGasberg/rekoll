import type { InteractionSpec } from './types';

export const genericSpecs: InteractionSpec[] = [
  {
    selector:
      '[aria-label*="like" i], [aria-label*="heart" i], [aria-label*="favorite" i]',
    eventType: 'like',
    label: 'Generic Like',
    extractMetadata(_el, doc) {
      return { pageTitle: doc.title, action: 'like' };
    },
  },
  {
    selector: '[aria-label*="add to cart" i], [data-action="add-to-cart"]',
    eventType: 'purchase',
    label: 'Generic Add to Cart',
    extractMetadata(_el, doc) {
      return { pageTitle: doc.title, action: 'add_to_cart' };
    },
  },
];
