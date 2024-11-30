import { FC, ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";

declare const _: HTMLElement;

export const hydrate = (
  match: (pathname: string) => [FC | null] | [FC, Record<string, string>],
  Router: (props: { pathname: string }) => ReactNode,
) => {
  const pathname = location.pathname;

  try {
    // @ts-expect-error preload lazy component
    match(pathname)[0]();
  } catch (e: any) {
    e.then(() => hydrateRoot(_, <Router pathname={pathname} />));
  }
};
