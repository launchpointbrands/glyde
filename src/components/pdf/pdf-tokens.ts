import { Font, StyleSheet } from "@react-pdf/renderer";

// DM Sans + DM Mono served from the official googlefonts repo.
// Registered once at module load so every PDF page uses the same fonts.
// Falls back to Helvetica/Courier if a fetch fails.
Font.register({
  family: "DM Sans",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Medium.ttf",
      fontWeight: 500,
    },
    {
      src: "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-SemiBold.ttf",
      fontWeight: 600,
    },
  ],
});

Font.register({
  family: "DM Mono",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Mono/Exports/DMMono-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Mono/Exports/DMMono-Medium.ttf",
      fontWeight: 500,
    },
  ],
});

// Color tokens lifted from DESIGN.md / globals.css. Hex values are
// inlined here because react-pdf has no concept of CSS custom
// properties.
export const C = {
  bgPage: "#F4F6F4",
  bgCard: "#FFFFFF",
  borderSubtle: "#E8EDE8",
  borderDefault: "#D4DDD4",
  textPrimary: "#1A2E1A",
  textSecondary: "#4A6A4A",
  textTertiary: "#7A9A7A",
  textInverse: "#FFFFFF",
  green50: "#F0F7F0",
  green200: "#A8D8A8",
  green400: "#5CA85C",
  green600: "#3D7A3D",
  green800: "#1F4A1F",
  dangerText: "#C0392B",
  warningText: "#B45309",
  successText: "#166534",
  // Risk severity hex (the vivid traffic-light set used on the web Risk page)
  riskHigh: "#EF4444",
  riskModerate: "#F59E0B",
  riskLow: "#22C55E",
};

// Letter, 0.75" margins, light gray-green page background, DM Sans
// body. Numbers should be wrapped in `numStyle` for DM Mono.
export const styles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 60,
    paddingHorizontal: 54,
    fontFamily: "DM Sans",
    fontSize: 10,
    color: C.textPrimary,
    backgroundColor: C.bgPage,
  },
  num: {
    fontFamily: "DM Mono",
  },
  card: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 8,
    color: C.textTertiary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: C.textPrimary,
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    color: C.textSecondary,
    lineHeight: 1.5,
  },
  meta: {
    fontSize: 9,
    color: C.textSecondary,
  },
  display: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: "DM Mono",
    color: C.textPrimary,
  },
  hr: {
    height: 1,
    backgroundColor: C.borderSubtle,
    marginVertical: 10,
  },
});
