import { Circle, Line, Page, Path, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { C, styles } from "./pdf-tokens";

// Brand marks rendered as native react-pdf vectors (Svg), NOT raster
// <Image> — react-pdf 4.x double-draws raster images on a page, so a
// vector lockup (mark + name) is both reliable and crisp. Matched to the
// brands set up in Settings → Organization & branding.
function brandMark(name: string, color: string): ReactElement | null {
  const key = (name || "").toLowerCase();
  const box = { width: 34, height: 41 } as const;
  if (key.includes("meridian")) {
    return (
      <Svg viewBox="0 0 124 150" style={box}>
        <Circle cx="62" cy="75" r="50" stroke={color} strokeWidth="6" fill="none" />
        <Line x1="18" y1="56" x2="106" y2="56" stroke={color} strokeWidth="5" />
        <Line x1="12" y1="75" x2="112" y2="75" stroke={color} strokeWidth="5" />
        <Line x1="18" y1="94" x2="106" y2="94" stroke={color} strokeWidth="5" />
        <Path d="M62 25 C 34 50, 34 100, 62 125" stroke={color} strokeWidth="5" fill="none" />
        <Path d="M62 25 C 90 50, 90 100, 62 125" stroke={color} strokeWidth="5" fill="none" />
      </Svg>
    );
  }
  if (key.includes("summit")) {
    return (
      <Svg viewBox="0 0 124 150" style={box}>
        <Path d="M12 122 L46 44 L70 86 L88 56 L116 122 Z" fill={color} />
        <Path d="M46 44 L54 62 L38 62 Z" fill="#FFFFFF" />
      </Svg>
    );
  }
  if (key.includes("harbor")) {
    return (
      <Svg viewBox="0 0 124 150" style={box}>
        <Path d="M62 20 L76 60 L118 75 L76 90 L62 130 L48 90 L6 75 L48 60 Z" fill={color} />
        <Circle cx="62" cy="75" r="9" fill="#FFFFFF" />
      </Svg>
    );
  }
  return null;
}

// Branding resolved for a report. Phase 1 sources this from the firm
// (entity); Phase 2 will prefer the advisor's subentity when present.
// There is intentionally NO WMGR logo on the report — WMGR appears only as
// a "Powered by" credit in the page footer.
export type ReportBranding = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  disclosure: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export type CoverProps = {
  reportTitle: string;
  description: string;
  branding: ReportBranding;
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
};

export function PdfCover({
  reportTitle,
  description,
  branding,
  contactName,
  businessName,
  advisorName,
  advisorTitle,
  preparedAt,
}: CoverProps) {
  const accent = branding.primaryColor || C.green400;
  const mark = brandMark(branding.name, accent);
  const disclosure =
    branding.disclosure ||
    `This report was prepared by ${advisorName} for the exclusive use of ${contactName} and ${businessName}. This document is confidential and intended solely for the recipient. It may not be reproduced, distributed, or shared without prior written consent.`;

  return (
    <Page
      size="LETTER"
      style={{
        backgroundColor: C.bgCard,
        paddingTop: 72,
        paddingBottom: 48,
        paddingHorizontal: 54,
        fontFamily: "DM Sans",
        color: C.textPrimary,
      }}
    >
      {/* Brand lockup — vector mark + name (no WMGR logo, no raster image). */}
      {mark ? (
        <View
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 46 }}
        >
          {mark}
          <Text
            style={{
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: accent,
              marginLeft: 11,
            }}
          >
            {branding.name}
          </Text>
        </View>
      ) : (
        <Text
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.3,
            color: accent,
            marginBottom: 52,
          }}
        >
          {branding.name || " "}
        </Text>
      )}

      {/* Brand accent rule */}
      <View
        style={{ height: 3, width: 44, backgroundColor: accent, marginBottom: 14 }}
      />

      <Text style={styles.eyebrow}>Confidential report</Text>
      <Text
        style={{
          fontSize: 32,
          fontWeight: 600,
          marginTop: 8,
          color: C.textPrimary,
        }}
      >
        {reportTitle}
      </Text>

      {/* Standard description — what this report is / for. Not client-specific. */}
      <View style={{ marginTop: 16, maxWidth: 400 }}>
        <Text style={{ fontSize: 10.5, color: C.textSecondary, lineHeight: 1.6 }}>
          {description}
        </Text>
      </View>

      <View
        style={{
          marginTop: 36,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: C.borderSubtle,
        }}
      >
        <Text style={styles.eyebrow}>Prepared for</Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginTop: 4,
            color: C.textPrimary,
          }}
        >
          {contactName}
        </Text>
        <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
          {businessName}
        </Text>
      </View>

      <View
        style={{
          marginTop: 24,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Prepared by</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 500,
              marginTop: 4,
              color: C.textPrimary,
            }}
          >
            {advisorName}
          </Text>
          {advisorTitle ? (
            <Text style={{ fontSize: 10, color: C.textSecondary, marginTop: 2 }}>
              {advisorTitle}
            </Text>
          ) : null}
          {branding.name ? (
            <Text style={{ fontSize: 10, color: C.textSecondary, marginTop: 2 }}>
              {branding.name}
            </Text>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Date prepared</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 500,
              marginTop: 4,
              color: C.textPrimary,
            }}
          >
            {preparedAt}
          </Text>
        </View>
      </View>

      {/* Pushes the disclosure block to the bottom. */}
      <View style={{ flexGrow: 1 }} />

      <View
        style={{
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: C.borderSubtle,
        }}
      >
        <Text style={styles.eyebrow}>Confidentiality notice</Text>
        <Text
          style={{
            fontSize: 8.5,
            color: C.textSecondary,
            marginTop: 6,
            lineHeight: 1.55,
          }}
        >
          {disclosure}
        </Text>
        <Text style={{ fontSize: 8, color: C.textTertiary, marginTop: 12 }}>
          Powered by WMGR
        </Text>
      </View>
    </Page>
  );
}
