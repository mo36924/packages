import { FC } from "react";

export const match: (pathname: string) => [FC | null] | [FC, Record<string, string>] = () => [null];

const Router: FC<{ pathname: string }> = () => null;

export default Router;
