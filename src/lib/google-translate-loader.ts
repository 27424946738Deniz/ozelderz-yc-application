const SCRIPT_ID = "google-translate-script";
const ELEMENT_ID = "google_translate_element";
const DEFAULT_TARGET_LANG = "en";

let initStarted = false;
let initCompleted = false;

function getContainer() {
  return document.getElementById(ELEMENT_ID);
}

function isWidgetMounted() {
  return Boolean(getContainer()?.querySelector(".goog-te-gadget"));
}

function setEnglishCookie() {
  if (typeof document === "undefined") return;
  const value = `/tr/${DEFAULT_TARGET_LANG}`;
  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`;
}

function applyEnglish() {
  const select = document.querySelector(
    ".goog-te-combo"
  ) as HTMLSelectElement | null;
  if (!select) return false;
  if (select.value !== DEFAULT_TARGET_LANG) {
    select.value = DEFAULT_TARGET_LANG;
    select.dispatchEvent(new Event("change"));
  }
  return true;
}

export function loadGoogleTranslate() {
  if (typeof window === "undefined") return;

  if (isWidgetMounted()) return;

  if (initCompleted && !isWidgetMounted()) {
    initCompleted = false;
    initStarted = false;
  }

  if (initStarted) return;
  initStarted = true;

  window.googleTranslateElementInit = () => {
    if (initCompleted && isWidgetMounted()) return;

    const container = getContainer();
    const TranslateElement = window.google?.translate?.TranslateElement;
    if (!container || !TranslateElement) {
      initStarted = false;
      return;
    }

    initCompleted = true;

    setEnglishCookie();

    new TranslateElement(
      {
        pageLanguage: "tr",
        includedLanguages: "en,de,ar,ru,fr",
        layout: TranslateElement.InlineLayout.SIMPLE,
      },
      ELEMENT_ID
    );

    if (!applyEnglish()) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (applyEnglish() || attempts > 20) {
          window.clearInterval(timer);
        }
      }, 150);
    }
  };

  if (document.getElementById(SCRIPT_ID)) {
    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
    return;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.onerror = () => {
    initStarted = false;
    initCompleted = false;
  };
  document.body.appendChild(script);
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (
            options: Record<string, unknown>,
            elementId: string
          ): void;
          InlineLayout: { SIMPLE: number; HORIZONTAL: number };
        };
      };
    };
  }
}
