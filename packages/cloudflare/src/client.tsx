import Router, { match } from "@mo36924/react-router";
import { hydrateRoot } from "react-dom/client";

// packages/react-components/src/Body.tsx
declare const _: HTMLElement;

const pathname = location.pathname;

try {
  // @ts-expect-error preload lazy component
  match(pathname)[0]();
} catch (e: any) {
  e.then(() => hydrateRoot(_, <Router pathname={pathname} />));
}
