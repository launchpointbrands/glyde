import { Page, Text, View } from "@react-pdf/renderer";
import type { ReportBranding } from "./pdf-cover";
import { PdfFooter } from "./pdf-footer";
import { PdfHeader } from "./pdf-header";
import { C, styles } from "./pdf-tokens";

// Standard disclosures page appended as the LAST page of every report.
// Mirrors the format + legal tone of the RISR sample reports' disclosure
// pages, adapted to our context: reports are prepared by the advisor's
// firm (the white-label brand) on the WMGR platform, are directional and
// not a certified appraisal, and depend on client-supplied data. The
// {BRAND} token is the resolved firm/subentity name.
function standardDisclaimer(brand: string): string {
  const B = (brand || "the preparing firm").toUpperCase();
  return `CLIENT ACKNOWLEDGES THAT THE VALUATIONS, RISK ASSESSMENTS, WEALTH PROJECTIONS, AND OTHER REPORTS GENERATED THROUGH THIS SERVICE ARE NECESSARILY SUBJECTIVE IN NATURE AND ARE PROVIDED SOLELY FOR INFORMATIONAL AND PLANNING PURPOSES. THE INFORMATION CONTAINED IN THIS REPORT DOES NOT CONSTITUTE A CERTIFIED VALUATION, A FORMAL APPRAISAL, OR AN OFFER OR SOLICITATION TO BUY OR SELL ANY BUSINESS, SECURITY, OR OWNERSHIP INTEREST. ALL ESTIMATES ARE DIRECTIONAL AND ARE DERIVED FROM INFORMATION SUPPLIED BY THE CLIENT TOGETHER WITH THIRD-PARTY INDUSTRY REFERENCE DATA. CLIENT ACKNOWLEDGES THAT THE QUALITY AND ACCURACY OF THE INFORMATION AND MATERIALS PROVIDED BY THE CLIENT WILL DIRECTLY IMPACT THE ACCURACY OF ANY VALUATIONS OR ASSESSMENTS PERFORMED, AND CLIENT HEREBY RELEASES ${B} AND WMGR FROM ALL LIABILITY ASSOCIATED WITH, AND WILL HOLD THEM HARMLESS FROM ANY CLAIMS RESULTING FROM, THE CLIENT MATERIALS AND ANY INACCURACIES CONTAINED THEREIN. THIS REPORT IS NOT INTENDED TO SERVE AS LEGAL, TAX, ACCOUNTING, OR INVESTMENT ADVICE, AND CLIENT SHOULD CONSULT QUALIFIED PROFESSIONALS BEFORE MAKING ANY DECISION BASED UPON THE INFORMATION CONTAINED HEREIN. PAST PERFORMANCE AND PROJECTED OUTCOMES ARE NOT GUARANTEES OF FUTURE RESULTS.`;
}

export function PdfDisclosures({
  contactName,
  businessName,
  branding,
}: {
  contactName: string;
  businessName: string;
  branding: ReportBranding;
}) {
  return (
    <Page size="LETTER" style={styles.page}>
      <PdfHeader
        reportType="Disclosures"
        brandName={branding.name}
        accentColor={branding.primaryColor}
      />
      <PdfFooter contactName={contactName} businessName={businessName} />

      <Text style={styles.sectionTitle}>Disclosures</Text>

      {/* Firm-specific disclosure (e.g. RIA language) when provided. */}
      {branding.disclosure ? (
        <Text style={[styles.body, { marginBottom: 14 }]}>
          {branding.disclosure}
        </Text>
      ) : null}

      {/* Standard legal disclaimer — RISR-style all-caps block. */}
      <View style={[styles.card, { padding: 18 }]}>
        <Text
          style={{
            fontSize: 8.5,
            lineHeight: 1.65,
            letterSpacing: 0.2,
            textAlign: "justify",
            color: C.textSecondary,
          }}
        >
          {standardDisclaimer(branding.name)}
        </Text>
      </View>

      <Text style={{ fontSize: 8, color: C.textTertiary, marginTop: 14 }}>
        Prepared by {branding.name || "your advisor"} · Powered by WMGR
      </Text>
    </Page>
  );
}
