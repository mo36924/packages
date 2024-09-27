export const customScalarTypeNames = ["Date", "JSON"] as const;

export const customScalars = customScalarTypeNames.map((name) => `scalar ${name}\n`).join("");

export type CustomScalarTypeName = (typeof customScalarTypeNames)[number];

export const isCustomScalarTypeName = (type: string): type is CustomScalarTypeName =>
  customScalarTypeNames.includes(type as CustomScalarTypeName);

export const scalarTypeNames = ["ID", "Int", "Float", "String", "Boolean", ...customScalarTypeNames] as const;

export type ScalarTypeName = (typeof scalarTypeNames)[number];

export const isScalarTypeName = (name: string): name is ScalarTypeName => scalarTypeNames.includes(name as any);

export const primaryKeyTypeName = "String" satisfies ScalarTypeName;
