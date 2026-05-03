import { Document, Page, Text, View } from "@react-pdf/renderer";
import { PdfCover } from "./pdf-cover";
import { PdfFooter } from "./pdf-footer";
import { PdfHeader } from "./pdf-header";
import { C, styles } from "./pdf-tokens";

const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

const cap = (s: string | null | undefined) =>
  !s ? "—" : s.charAt(0).toUpperCase() + s.slice(1);

const SEV_TONE: Record<string, string> = {
  high: C.riskHigh,
  moderate: C.riskModerate,
  low: C.riskLow,
};

const BUY_SELL_LABEL: Record<string, string> = {
  none: "None on file",
  in_place: "In place",
  needs_review: "Needs review",
  outdated: "Outdated",
};

type Factor = {
  key: string;
  label: string;
  severity: string;
  headline: string;
  explanation: string;
  source_field: string | null;
  source_value: unknown;
  computed_value: unknown;
};

export type RiskReportData = {
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
  overallRisk: string;
  riskImpactLow: number | null;
  riskImpactHigh: number | null;
  factors: Factor[];
  buySellStatus: string;
  equityValueOwned: number | null;
};

export function RiskDocument(props: RiskReportData) {
  const {
    contactName,
    businessName,
    overallRisk,
    riskImpactLow,
    riskImpactHigh,
    factors,
    buySellStatus,
    equityValueOwned,
  } = props;

  return (
    <Document>
      <PdfCover
        reportTitle="Business Risk Assessment"
        contactName={contactName}
        businessName={businessName}
        advisorName={props.advisorName}
        advisorTitle={props.advisorTitle}
        preparedAt={props.preparedAt}
      />

      <Page size="LETTER" style={styles.page}>
        <PdfHeader reportType="Risk" />
        <PdfFooter contactName={contactName} businessName={businessName} />

        <Text style={styles.sectionTitle}>Business risk score</Text>
        <View style={[styles.card, { flexDirection: "row", gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Overall risk</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 }}>
              <View
                style={{
                  width: 4,
                  height: 22,
                  backgroundColor: SEV_TONE[overallRisk] ?? C.riskModerate,
                  borderRadius: 2,
                }}
              />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: C.textPrimary,
                  textTransform: "capitalize",
                }}
              >
                {overallRisk}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Estimated impact on value</Text>
            <Text style={[styles.display, { marginTop: 6 }]}>
              {riskImpactLow ?? "—"}-{riskImpactHigh ?? "—"}%
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Risk factors
        </Text>

        {factors.length === 0 ? (
          <View style={[styles.card, { padding: 18 }]}>
            <Text style={styles.body}>
              Discovery is in progress. Risk factor analysis will populate as
              the advisor verifies discovery answers — each of the eight
              factors is scored from the client&apos;s specific situation.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View
              style={{
                flexDirection: "row",
                paddingBottom: 6,
                borderBottomWidth: 0.5,
                borderBottomColor: C.borderSubtle,
              }}
            >
              <Text style={[styles.eyebrow, { flex: 2 }]}>Factor</Text>
              <Text style={[styles.eyebrow, { flex: 1 }]}>Severity</Text>
              <Text style={[styles.eyebrow, { flex: 3 }]}>
                Recommended action
              </Text>
            </View>
            {factors.map((f, i) => (
              <View
                key={f.key + i}
                style={{
                  flexDirection: "row",
                  paddingVertical: 7,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: C.borderSubtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 9.5,
                    flex: 2,
                    color: C.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  {f.label}
                </Text>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View
                    style={{
                      width: 3,
                      height: 10,
                      backgroundColor: SEV_TONE[f.severity] ?? C.riskModerate,
                      borderRadius: 1.5,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      color: SEV_TONE[f.severity] ?? C.riskModerate,
                      textTransform: "capitalize",
                      fontWeight: 500,
                    }}
                  >
                    {f.severity}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 9,
                    flex: 3,
                    color: C.textSecondary,
                    lineHeight: 1.45,
                  }}
                >
                  {f.headline}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Buy-sell arrangement
        </Text>
        <View style={[styles.card, { flexDirection: "row", gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Status</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 4,
                color: C.textPrimary,
              }}
            >
              {BUY_SELL_LABEL[buySellStatus] ?? cap(buySellStatus)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Value of equity owned</Text>
            <Text style={[styles.display, { marginTop: 4, fontSize: 18 }]}>
              {formatUSDFull(equityValueOwned)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Risk to equity</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 4,
                color: SEV_TONE[overallRisk] ?? C.riskModerate,
                textTransform: "capitalize",
              }}
            >
              {overallRisk}
            </Text>
          </View>
        </View>
        <Text style={[styles.body, { marginTop: 8 }]}>
          An updated buy-sell arrangement protects the value of equity owned
          in the event of death, disability, or dispute. Common funding
          mechanisms include life insurance, disability insurance, or cash
          reserves.
        </Text>
      </Page>
    </Document>
  );
}
