import { DocumentNode } from "graphql";

const documents: { [hash: string]: DocumentNode | undefined } = Object.create(null);

export default documents;
