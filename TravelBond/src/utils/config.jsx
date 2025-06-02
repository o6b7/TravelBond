export const COLORS = {
  identity: "#39aaa4",
  hover: "#308f8b",
  active: "#22716d",
  success: "#28a745",
  danger: "#dc3545",
};

// Define CSS variables
export const CSS_VARIABLES = `
  :root {
    --hover-color: ${COLORS.hover};
    --identity-color: ${COLORS.identity};
    --active-color: ${COLORS.active};
    --success-color: ${COLORS.success};
    --danger-color: ${COLORS.danger};
  }
`;