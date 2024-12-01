import { ReactNode } from "react";

export const Html = (props: { children: ReactNode }) => <html lang="ja">{props.children}</html>;

export const Title = ({ children }: { children: string | string[] }) => {
  document.title = typeof children === "string" ? children : children.join(" ");
  return null;
};

export const Body = (props: { children: ReactNode }) => (
  <body>
    <div id="_">{props.children}</div>
  </body>
);
