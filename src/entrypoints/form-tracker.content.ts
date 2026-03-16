export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  world: 'MAIN',

  main() {
    const TIMEOUT_MS = 5000;
    let pendingForm: { action: string; id: string; timestamp: number } | null =
      null;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    function clearPending() {
      pendingForm = null;
      if (pendingTimer !== null) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
    }

    function dispatchSuccess(detail: Record<string, unknown>) {
      document.dispatchEvent(
        new CustomEvent('__bcc_form_success', { detail }),
      );
    }

    function buildDetail(form: { action: string; id: string }) {
      return {
        formAction: form.action,
        formId: form.id,
        pageTitle: document.title,
        pageUrl: location.href,
        timestamp: Date.now(),
      };
    }

    function handleResponse(ok: boolean, method: string) {
      if (!pendingForm) return;
      if (!['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) return;
      const form = pendingForm;
      clearPending();
      if (ok) {
        dispatchSuccess(buildDetail(form));
      }
    }

    // --- Listen for native submit events (capture phase) ---
    document.addEventListener(
      'submit',
      (event: SubmitEvent) => {
        const form = event.target as HTMLFormElement;
        const formInfo = {
          action: form.action ?? '',
          id: form.id ?? '',
        };

        // Use microtask to check if JS called preventDefault
        queueMicrotask(() => {
          if (event.defaultPrevented) {
            // AJAX form — wait for fetch/XHR response
            clearPending();
            pendingForm = {
              ...formInfo,
              timestamp: Date.now(),
            };
            pendingTimer = setTimeout(clearPending, TIMEOUT_MS);
          } else {
            // Traditional navigation form — client validation passed, log immediately
            dispatchSuccess(buildDetail(formInfo));
          }
        });
      },
      true,
    );

    // --- Wrap fetch ---
    const originalFetch = window.fetch;
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      const response = await originalFetch.apply(this, args);

      if (pendingForm) {
        const req = args[0];
        let method = 'GET';
        if (req instanceof Request) {
          method = req.method;
        } else if (args[1]?.method) {
          method = args[1].method;
        }
        handleResponse(response.ok, method);
      }

      return response;
    };

    // --- Wrap XMLHttpRequest ---
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      method: string,
      ...rest: unknown[]
    ) {
      (this as XMLHttpRequest & { __bccMethod: string }).__bccMethod = method;
      return (originalOpen as Function).call(this, method, ...rest);
    };

    XMLHttpRequest.prototype.send = function (
      ...args: Parameters<XMLHttpRequest['send']>
    ) {
      if (pendingForm) {
        this.addEventListener('load', () => {
          const ok = this.status >= 200 && this.status < 300;
          const method =
            (this as XMLHttpRequest & { __bccMethod?: string }).__bccMethod ??
            'GET';
          handleResponse(ok, method);
        });
        this.addEventListener('error', () => {
          clearPending();
        });
      }
      return originalSend.apply(this, args);
    };
  },
});
