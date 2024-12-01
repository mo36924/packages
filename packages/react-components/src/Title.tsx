import { Children, ReactNode } from "react";

const Title = ({ children }: { children?: ReactNode }) => {
  document.title = Children.toArray(children).join(" ");
  return null;
};

export default Title;
