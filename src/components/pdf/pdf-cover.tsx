import { Image, Page, Text, View } from "@react-pdf/renderer";
import { C, styles } from "./pdf-tokens";

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
      {/* Brand lockup — entity/subentity logo, or its name. No WMGR logo. */}
      {branding.logoUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          src={branding.logoUrl}
          style={{ height: 40, maxWidth: 220, objectFit: "contain", marginBottom: 52 }}
        />
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
