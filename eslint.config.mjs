import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/^[A-Za-z_]+:(read|create|update|delete|manage)$/i][value=/[A-Z]/]",
          message: "Permissao deve usar lowercase no formato resource:action (ex.: people:create)."
        }
      ]
    }
  }
];

export default config;
