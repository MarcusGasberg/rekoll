import type { SiteExtractor, ExtractorResult, InteractionSpec } from './types';

function getAsin(url: URL): string | null {
  const dpMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})/);
  if (dpMatch) return dpMatch[1];
  const gpMatch = url.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/);
  if (gpMatch) return gpMatch[1];
  return null;
}

function getProductTitle(doc: Document): string {
  return doc.getElementById('productTitle')?.textContent?.trim() ?? doc.title;
}

function getPrice(doc: Document): string {
  return (
    doc.querySelector('span.a-price .a-offscreen')?.textContent?.trim() ?? ''
  );
}

function getRating(doc: Document): string {
  return (
    doc
      .querySelector('#acrPopover .a-icon-alt')
      ?.textContent?.trim() ?? ''
  );
}

export const amazonExtractor: SiteExtractor = {
  extractOnLoad(doc: Document, url: URL): ExtractorResult | null {
    // Order confirmation page
    if (url.pathname.includes('/gp/buy/thankyou/')) {
      const orderNumber =
        doc.querySelector('.a-alert-content bdi')?.textContent?.trim() ?? '';
      return {
        eventType: 'purchase',
        title: `Amazon Order Confirmed${orderNumber ? `: ${orderNumber}` : ''}`,
        textContent: `Purchase completed on Amazon. Order number: ${orderNumber}`,
        metadata: { orderNumber },
      };
    }

    // Product pages
    const asin = getAsin(url);
    if (!asin) return null;

    const title = getProductTitle(doc);
    const price = getPrice(doc);
    const rating = getRating(doc);

    return {
      eventType: 'page_visit',
      title,
      textContent: `Amazon product: ${title}. Price: ${price}. Rating: ${rating}`.slice(
        0,
        2000,
      ),
      metadata: { asin, price, rating },
    };
  },

  getInteractionSpecs(): InteractionSpec[] {
    return [
      {
        selector: '#add-to-cart-button, [name="submit.add-to-cart"]',
        eventType: 'purchase',
        label: 'Amazon Add to Cart',
        extractMetadata(_el, doc) {
          const url = new URL(window.location.href);
          const asin = getAsin(url);
          const productTitle = getProductTitle(doc);
          if (!asin) return null;
          return { asin, productTitle, action: 'add_to_cart' };
        },
      },
    ];
  },
};
