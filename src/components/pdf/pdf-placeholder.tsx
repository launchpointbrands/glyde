import { Document, Page, Text, View } from "@react-pdf/renderer";
import { PdfCover } from "./pdf-cover";
import { PdfFooter } from "./pdf-footer";
import { PdfHeader } from "./pdf-header";
import { C, styles } from "./pdf-tokens";

// Stand-in document for reports whose full layout has not landed yet.
// Renders a proper cover + a single content page that names the report
// and notes that the detailed export is in progress.

export function PlaceholderDocument({
  reportTitle,
  contactName,
  businessName,
  advisorName,
  advisorTitle,
  preparedAt,
  reportType,
}: {
  reportTitle: string;
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
  reportType: string;
}) {
  return (
    <Document>
      <PdfCover
        reportTitle={reportTitle}
        contactName={contactName}
        businessName={businessName}
        advisorName={advisorName}
        advisorTitle={advisorTitle}
        preparedAt={preparedAt}
      />

      <Page size="LETTER" style={styles.page}>
        <PdfHeader reportType={reportType} />
        <PdfFooter contactName={contactName} businessName={businessName} />

        <View
          style={[styles.card, { marginTop: 24, padding: 28 }]}
        >
          <Text style={styles.eyebrow}>Coming soon</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: C.textPrimary,
              marginTop: 6,
            }}
          >
            Full {reportTitle.toLowerCase()} export is in progress.
          </Text>
          <Text style={[styles.body, { marginTop: 8 }]}>
            The web dashboard at glyde-alpha.vercel.app shows the live
            version of this report. The fully formatted PDF export is being
            built and will be available shortly.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
