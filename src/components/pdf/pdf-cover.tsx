import { Page, Text, View } from "@react-pdf/renderer";
import { C, styles } from "./pdf-tokens";

export type CoverProps = {
  reportTitle: string;
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
};

export function PdfCover({
  reportTitle,
  contactName,
  businessName,
  advisorName,
  advisorTitle,
  preparedAt,
}: CoverProps) {
  return (
    <Page
      size="LETTER"
      style={{
        backgroundColor: C.bgCard,
        paddingTop: 72,
        paddingBottom: 60,
        paddingHorizontal: 54,
        fontFamily: "DM Sans",
        color: C.textPrimary,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: -0.5,
          color: C.textPrimary,
          marginBottom: 60,
        }}
      >
        WMGR
      </Text>

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

      <View
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: C.borderSubtle,
        }}
      >
        <Text style={styles.eyebrow}>Client</Text>
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
        <Text
          style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}
        >
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

      {/* Pushes the confidentiality block to the bottom. */}
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
          {`This report was prepared by ${advisorName} for the exclusive use of ${contactName} and ${businessName}. This document is confidential and intended solely for the recipient. It may not be reproduced, distributed, or shared without prior written consent.`}
        </Text>
      </View>
    </Page>
  );
}
