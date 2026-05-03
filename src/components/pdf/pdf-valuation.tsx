import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { PdfCover } from "./pdf-cover";
import { PdfFooter } from "./pdf-footer";
import { PdfHeader } from "./pdf-header";
import { C, styles } from "./pdf-tokens";

const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

const formatUSDShort = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const cap = (s: string | null | undefined) =>
  !s ? "—" : s.charAt(0).toUpperCase() + s.slice(1);

const DEMO_PL = [
  { label: "Revenue", y2024: 5796069, y2023: 4991881, y2022: 4310801 },
  { label: "Cost of goods sold", y2024: 2740936, y2023: 2376306, y2022: 2069369 },
  { label: "Operating expenses", y2024: 1194259, y2023: 900899, y2022: 650545 },
  { label: "Net income", y2024: 1058794, y2023: 916332, y2022: 795846 },
];

const DEMO_BS_ASSETS = [
  { label: "Cash & Cash equivalents", value: 857814 },
  { label: "Accounts receivable", value: 596571 },
  { label: "Other current assets", value: 254798 },
  { label: "Fixed assets & Land", value: 650000 },
  { label: "Other long-term assets", value: 345672 },
];

const DEMO_BS_LIAB = [
  { label: "Accounts payable", value: 114868 },
  { label: "Credit cards & Short-term debt", value: 85837 },
  { label: "Other current liabilities", value: 471217 },
  { label: "Other long-term debt", value: 918922 },
];

export type ValuationReportData = {
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
  ownershipPct: number;
  isDemo: boolean;
  snap: {
    valuation_low: number | null;
    valuation_estimate: number | null;
    valuation_high: number | null;
    equity_value_owned: number | null;
    naics_code: string | null;
    ebitda_multiple: number | null;
    revenue_multiple: number | null;
    revenue_ttm: number | null;
    normalized_ebitda: number | null;
    net_working_capital: number | null;
    interest_bearing_debt: number | null;
    balance_sheet_impact: number | null;
    risk_score: string | null;
    risk_impact_pct_low: number | null;
    risk_impact_pct_high: number | null;
  };
  characteristics: { label: string; value: string }[];
};

export function ValuationDocument(props: ValuationReportData) {
  const { contactName, businessName, snap, ownershipPct, isDemo } = props;

  return (
    <Document>
      <PdfCover
        reportTitle="Business Valuation Report"
        contactName={contactName}
        businessName={businessName}
        advisorName={props.advisorName}
        advisorTitle={props.advisorTitle}
        preparedAt={props.preparedAt}
      />

      {/* Page 2 — hero + methodology + factor cards */}
      <Page size="LETTER" style={styles.page}>
        <PdfHeader reportType="Valuation" />
        <PdfFooter contactName={contactName} businessName={businessName} />

        <Text style={styles.sectionTitle}>Valuation estimates</Text>
        <Text style={styles.body}>
          The value of all equity in the business was estimated based on the
          most recent three years of financials and current business
          characteristics.
        </Text>

        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.eyebrow}>Business valuation range</Text>
          <Text style={[styles.display, { marginTop: 4 }]}>
            {formatUSDShort(snap.valuation_low)} –{" "}
            {formatUSDShort(snap.valuation_high)}
          </Text>
          <ScaleBar />
          <View style={[styles.hr, { marginVertical: 14 }]} />
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Current valuation estimate</Text>
              <Text style={[styles.display, { marginTop: 4 }]}>
                {formatUSDFull(snap.valuation_estimate)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                Value of equity owned ({ownershipPct}%)
              </Text>
              <Text style={[styles.display, { marginTop: 4 }]}>
                {formatUSDFull(snap.equity_value_owned)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Methodology</Text>
        <Text style={styles.body}>
          Three commonly accepted valuation methodologies were referenced and
          aggregated to estimate this business&apos;s value.
        </Text>
        <View style={{ marginTop: 8 }}>
          <Method
            title="Income Approach"
            body="Estimates the present value of future earnings based on market conditions with adjustments for business risk and balance sheet."
          />
          <Method
            title="EBITDA Market Approach"
            body="References comparable transactions within the industry to identify a valuation multiple applied to normalized EBITDA, with risk and balance sheet adjustments."
          />
          <Method
            title="Revenue Market Approach"
            body="References comparable industry transactions to identify a valuation multiple applied to the most recent year of revenue, with risk and balance sheet adjustments."
          />
        </View>

        <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
          <FactorCard title="Revenue & Earnings">
            <Kv k="2024 Revenue" v={formatUSDFull(snap.revenue_ttm)} />
            <Kv
              k="Normalized EBITDA"
              v={formatUSDFull(snap.normalized_ebitda)}
            />
          </FactorCard>
          <FactorCard title="Balance sheet">
            <Kv
              k="Net working capital"
              v={formatUSDFull(snap.net_working_capital)}
            />
            <Kv
              k="Interest-bearing debt"
              v={formatUSDFull(snap.interest_bearing_debt)}
            />
            <Kv
              k="Balance sheet impact"
              v={formatUSDFull(snap.balance_sheet_impact)}
            />
          </FactorCard>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <FactorCard title="Business risk">
            <Kv k="Business risk score" v={cap(snap.risk_score)} />
            <Kv
              k="Impact on value"
              v={`${snap.risk_impact_pct_low ?? 0}-${snap.risk_impact_pct_high ?? 0}%`}
            />
          </FactorCard>
          <FactorCard title="Industry">
            <Kv k="NAICS code" v={snap.naics_code ?? "—"} />
            <Kv
              k="EBITDA multiple"
              v={
                snap.ebitda_multiple
                  ? `${snap.ebitda_multiple.toFixed(2)}x`
                  : "—"
              }
            />
            <Kv
              k="Revenue multiple"
              v={
                snap.revenue_multiple
                  ? `${snap.revenue_multiple.toFixed(2)}x`
                  : "—"
              }
            />
          </FactorCard>
        </View>
      </Page>

      {/* Page 3+ — appendix tables (demo only) and characteristics */}
      <Page size="LETTER" style={styles.page}>
        <PdfHeader reportType="Valuation" />
        <PdfFooter contactName={contactName} businessName={businessName} />

        {isDemo ? (
          <>
            <Text style={styles.sectionTitle}>Profit & Loss data</Text>
            <View style={styles.card}>
              <PlRow
                label=""
                v2024="2024"
                v2023="2023"
                v2022="2022"
                heading
              />
              {DEMO_PL.map((r) => (
                <PlRow
                  key={r.label}
                  label={r.label}
                  v2024={formatUSDFull(r.y2024)}
                  v2023={formatUSDFull(r.y2023)}
                  v2022={formatUSDFull(r.y2022)}
                />
              ))}
              <PlRow
                label="Normalized EBITDA"
                v2024={formatUSDFull(snap.normalized_ebitda)}
                v2023=""
                v2022=""
                bold
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
              Balance sheet data
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.textPrimary,
                  }}
                >
                  Assets
                </Text>
                {DEMO_BS_ASSETS.map((r) => (
                  <BsRow
                    key={r.label}
                    label={r.label}
                    value={formatUSDFull(r.value)}
                  />
                ))}
              </View>
              <View style={[styles.card, { flex: 1 }]}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: C.textPrimary,
                  }}
                >
                  Liabilities
                </Text>
                {DEMO_BS_LIAB.map((r) => (
                  <BsRow
                    key={r.label}
                    label={r.label}
                    value={formatUSDFull(r.value)}
                  />
                ))}
              </View>
            </View>
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Business characteristics
        </Text>
        <View style={styles.card}>
          {props.characteristics.length === 0 ? (
            <Text style={styles.body}>
              Discovery is in progress. Characteristics will populate as the
              advisor verifies answers.
            </Text>
          ) : (
            props.characteristics.map((c, i) => (
              <View
                key={c.label + i}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 5,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: C.borderSubtle,
                }}
              >
                <Text
                  style={{ fontSize: 9.5, color: C.textPrimary, flex: 1 }}
                >
                  {c.label}
                </Text>
                <Text
                  style={{
                    fontSize: 9.5,
                    color: C.textPrimary,
                    fontFamily: "DM Mono",
                  }}
                >
                  {c.value}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}

function ScaleBar() {
  return (
    <View
      style={{
        marginTop: 10,
        height: 6,
        flexDirection: "row",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <View style={{ flex: 1, backgroundColor: C.riskHigh }} />
      <View style={{ flex: 1, backgroundColor: C.riskModerate }} />
      <View style={{ flex: 1, backgroundColor: C.riskLow }} />
    </View>
  );
}

function Method({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ fontSize: 10, fontWeight: 600, color: C.textPrimary }}>
        {title}
      </Text>
      <Text style={[styles.body, { marginTop: 1 }]}>{body}</Text>
    </View>
  );
}

function FactorCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[styles.card, { flex: 1, marginRight: 0, padding: 12 }]}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.textPrimary,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 9, color: C.textPrimary }}>{k}</Text>
      <Text
        style={{ fontSize: 9, color: C.textPrimary, fontFamily: "DM Mono" }}
      >
        {v}
      </Text>
    </View>
  );
}

function PlRow({
  label,
  v2024,
  v2023,
  v2022,
  heading,
  bold,
}: {
  label: string;
  v2024: string;
  v2023: string;
  v2022: string;
  heading?: boolean;
  bold?: boolean;
}) {
  const cellStyle = {
    fontSize: 9,
    flex: 1,
    textAlign: "right" as const,
    fontFamily: "DM Mono",
    color: C.textPrimary,
    fontWeight: (heading || bold ? 600 : 400) as 400 | 600,
  };
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 4,
        borderTopWidth: heading ? 0 : 0.5,
        borderTopColor: C.borderSubtle,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          flex: 2,
          color: C.textPrimary,
          fontWeight: heading || bold ? 600 : 400,
        }}
      >
        {label}
      </Text>
      <Text style={cellStyle}>{v2024}</Text>
      <Text style={cellStyle}>{v2023}</Text>
      <Text style={cellStyle}>{v2022}</Text>
    </View>
  );
}

function BsRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
        borderTopWidth: 0.5,
        borderTopColor: C.borderSubtle,
      }}
    >
      <Text style={{ fontSize: 9, color: C.textPrimary, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{ fontSize: 9, color: C.textPrimary, fontFamily: "DM Mono" }}
      >
        {value}
      </Text>
    </View>
  );
}
