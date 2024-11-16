import { declare } from "@babel/helper-plugin-utils";
import { deadCodeElimination } from "babel-dead-code-elimination";
import minifyDeadCodeElimination from "babel-plugin-minify-dead-code-elimination";

export default declare((api) => ({
  ...minifyDeadCodeElimination(api),
  name: "babel-plugin-dead-code-elimination",
  post(file) {
    deadCodeElimination({ ...file.ast, errors: [] });
  },
}));
