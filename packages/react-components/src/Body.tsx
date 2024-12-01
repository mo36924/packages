import { ReactNode } from "react";

const Body = (props: { children: ReactNode }) => (
  <body>
    <div id="_">{props.children}</div>
  </body>
);

export default Body;
