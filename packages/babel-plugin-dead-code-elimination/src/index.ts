import { declare } from "@babel/helper-plugin-utils";
import { deadCodeElimination } from "babel-dead-code-elimination";

export default declare(() => ({
  name: "babel-plugin-dead-code-elimination",
  visitor: {
    ConditionalExpression: {
      exit(path) {
        const { confident, value } = path.get("test").evaluate();

        if (!confident) {
          return;
        }

        const { consequent, alternate } = path.node;

        if (value) {
          path.replaceWith(consequent);
        } else {
          path.replaceWith(alternate);
        }
      },
    },
    IfStatement: {
      exit(path) {
        const { confident, value } = path.get("test").evaluate();

        if (!confident) {
          return;
        }

        const { consequent, alternate } = path.node;

        if (value) {
          path.replaceWith(consequent);
        } else {
          if (alternate) {
            path.replaceWith(alternate);
          } else {
            path.remove();
          }
        }
      },
    },
  },
  post(file) {
    deadCodeElimination({ ...file.ast, errors: [] });
  },
}));
