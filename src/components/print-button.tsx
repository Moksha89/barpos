export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <>
      <button
        className="no-print mt-5 min-h-10 w-full rounded-xl bg-stone-950 font-bold text-white"
        data-barpos-print="true"
        type="button"
      >
        {label}
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (() => {
              if (window.__barposPrintHandlerBound) return;
              window.__barposPrintHandlerBound = true;
              const printReceipt = () => {
                window.focus();
                setTimeout(() => window.print(), 50);
              };
              document.addEventListener("click", (event) => {
                const button = event.target.closest("[data-barpos-print]");
                if (!button) return;
                event.preventDefault();
                printReceipt();
              });
              if (new URLSearchParams(window.location.search).get("print") === "1") {
                setTimeout(printReceipt, 500);
              }
            })();
          `,
        }}
      />
    </>
  );
}
