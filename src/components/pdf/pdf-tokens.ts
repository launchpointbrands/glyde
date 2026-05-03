import path from "node:path";
import { Font, StyleSheet } from "@react-pdf/renderer";

// DM Sans + DM Mono bundled locally in public/fonts. Loading from the
// filesystem instead of fetching at runtime — three of the upstream
// raw.githubusercontent URLs we used previously returned 404 (DM Sans
// has no static SemiBold instance, and DM Mono lives in a separate
// repo) and @fontsource ships .woff only, which react-pdf can't read.
//
// pdf-tokens.ts is only ever imported server-side (route handler), so
// process.cwd() resolves to the project root in dev and to /var/task
// in Vercel — both contain the bundled public/fonts directory.
const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "DM Sans",
  fonts: [
    {
      src: path.join(FONTS_DIR, "DMSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(FONTS_DIR, "DMSans-Medium.ttf"),
      fontWeight: 500,
    },
    // DM Sans has no static SemiBold cut. Register Bold under both
    // 600 and 700 so existing fontWeight: 600 callsites resolve to
    // Bold cleanly without a sweep through the components.
    {
      src: path.join(FONTS_DIR, "DMSans-Bold.ttf"),
      fontWeight: 600,
    },
    {
      src: path.join(FONTS_DIR, "DMSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "DM Mono",
  fonts: [
    {
      src: path.join(FONTS_DIR, "DMMono-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(FONTS_DIR, "DMMono-Medium.ttf"),
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
