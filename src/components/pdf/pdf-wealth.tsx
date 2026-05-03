import { Document, Page, Text, View } from "@react-pdf/renderer";
import { PdfCover } from "./pdf-cover";
import { PdfFooter } from "./pdf-footer";
import { PdfHeader } from "./pdf-header";
import { C, styles } from "./pdf-tokens";

const formatUSDShort = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

const formatPct = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n * 100)}%`;

const cap = (s: string | null | undefined) =>
  !s ? "—" : s.charAt(0).toUpperCase() + s.slice(1);

export type WealthReportData = {
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
  netProceedsTarget: number | null;
  goalValuation: number | null;
  goalEbitda: number | null;
  exitYear: number | null;
  targetAge: number | null;
  yearsToExit: number | null;
  historicAvgRevenueGrowth: number | null;
  goalRevenueGrowth: number | null;
  currentRisk: string | null;
  goalRisk: string | null;
  currentValuation: number | null;
  normalizedEbitda: number | null;
  historicSeries: { year: number; value: number }[];
};

export function WealthDocument(props: WealthReportData) {
  const {
    contactName,
    businessName,
    netProceedsTarget,
    goalValuation,
    goalEbitda,
    exitYear,
    targetAge,
    yearsToExit,
    currentValuation,
    normalizedEbitda,
    historicSeries,
  } = props;

  const maxBar = Math.max(
    currentValuation ?? 0,
    goalValuation ?? 0,
    netProceedsTarget ?? 0,
    1,
  );

  const ebitdaMax = Math.max(
    ...historicSeries.map((s) => s.value),
    goalEbitda ?? 0,
    1,
  );

  return (
    <Document>
      <PdfCover
        reportTitle="Business Wealth Blueprint"
        contactName={contactName}
        businessName={businessName}
        advisorName={props.advisorName}
        advisorTitle={props.advisorTitle}
        preparedAt={props.preparedAt}
      />

      <Page size="LETTER" style={styles.page}>
        <PdfHeader reportType="Wealth" />
        <PdfFooter contactName={contactName} businessName={businessName} />

        <Text style={styles.sectionTitle}>Wealth goals</Text>
        <Text style={styles.body}>
          Knowing how the business fits into the long-term financial plan
          starts with knowing what it needs to be worth and how to get
          there.
        </Text>

        <View style={[styles.card, { marginTop: 10 }]}>
          <Bullet>
            Need <B>{formatUSDShort(netProceedsTarget)}</B> in net proceeds
            to fund goals
          </Bullet>
          <Bullet>
            Want to exit in <B>{yearsToExit ?? "—"} years</B> at age{" "}
            <B>{targetAge ?? "—"}</B>
          </Bullet>
          <Bullet>
            Business needs to be worth <B>{formatUSDShort(goalValuation)}</B>{" "}
            by <B>{exitYear ?? "—"}</B>
          </Bullet>
          <Bullet>
            Business EBITDA needs to reach <B>{formatUSDShort(goalEbitda)}</B>
          </Bullet>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Liquidity goals
        </Text>
        <View style={styles.card}>
          <Bar
            label="Current business valuation (est.)"
            value={currentValuation ?? 0}
            maxBar={maxBar}
          />
          <Bar
            label="Goal business valuation"
            value={goalValuation ?? 0}
            maxBar={maxBar}
          />
          <Bar
            label="Net proceeds needed to fund goals"
            value={netProceedsTarget ?? 0}
            maxBar={maxBar}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          EBITDA: historic vs. goal
        </Text>
        <View style={[styles.card, { padding: 18 }]}>
          <EbitdaChart
            series={historicSeries}
            goalYear={exitYear}
            goalValue={goalEbitda ?? 0}
            max={ebitdaMax}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Business KPIs
        </Text>
        <View style={[styles.card, { flexDirection: "row", gap: 12 }]}>
          <KpiBlock title="Earnings (EBITDA)">
            <KpiRow
              label="Current"
              value={formatUSDFull(normalizedEbitda)}
            />
            <KpiRow label="Goal" value={formatUSDFull(goalEbitda)} />
          </KpiBlock>
          <KpiBlock title="Annual revenue growth">
            <KpiRow
              label="Historic avg"
              value={formatPct(props.historicAvgRevenueGrowth)}
            />
            <KpiRow
              label="Goal"
              value={formatPct(props.goalRevenueGrowth)}
            />
          </KpiBlock>
          <KpiBlock title="Business risk score">
            <KpiRow label="Current" value={cap(props.currentRisk)} />
            <KpiRow label="Goal" value={cap(props.goalRisk)} />
          </KpiBlock>
        </View>
      </Page>
    </Document>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontWeight: 600,
        color: C.textPrimary,
        fontFamily: "DM Mono",
      }}
    >
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", marginVertical: 3 }}>
      <Text style={{ fontSize: 10, color: C.green600, marginRight: 6 }}>
        •
      </Text>
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

function Bar({
  label,
  value,
  maxBar,
}: {
  label: string;
  value: number;
  maxBar: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / maxBar) * 100));
  return (
    <View style={{ marginVertical: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <Text style={{ fontSize: 9.5, color: C.textSecondary }}>{label}</Text>
        <Text
          style={{
            fontSize: 9.5,
            fontWeight: 500,
            color: C.textPrimary,
            fontFamily: "DM Mono",
          }}
        >
          {formatUSDShort(value)}
        </Text>
      </View>
      <View
        style={{
          height: 14,
          backgroundColor: C.bgPage,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: C.green400,
          }}
        />
      </View>
    </View>
  );
}

function EbitdaChart({
  series,
  goalYear,
  goalValue,
  max,
}: {
  series: { year: number; value: number }[];
  goalYear: number | null;
  goalValue: number;
  max: number;
}) {
  const bars = [
    ...series.map((s) => ({ year: s.year, value: s.value, isGoal: false })),
  ];
  if (goalYear) bars.push({ year: goalYear, value: goalValue, isGoal: true });

  const chartHeight = 140;

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: chartHeight,
          gap: 12,
        }}
      >
        {bars.map((b) => {
          const h = Math.max(2, (b.value / max) * (chartHeight - 18));
          return (
            <View
              key={`${b.year}-${b.isGoal}`}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-end",
                height: chartHeight,
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  color: C.textPrimary,
                  fontFamily: "DM Mono",
                  marginBottom: 3,
                }}
              >
                {formatUSDShort(b.value)}
              </Text>
              <View
                style={{
                  width: "100%",
                  height: h,
                  backgroundColor: b.isGoal ? C.green400 : C.green200,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            </View>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: "row",
          marginTop: 6,
          gap: 12,
        }}
      >
        {bars.map((b) => (
          <Text
            key={`${b.year}-label`}
            style={{
              flex: 1,
              fontSize: 8,
              textAlign: "center",
              color: C.textSecondary,
              fontFamily: "DM Mono",
            }}
          >
            {b.isGoal ? `Goal ${b.year}` : b.year}
          </Text>
        ))}
      </View>
    </View>
  );
}

function KpiBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 10,
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

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2,
      }}
    >
      <Text style={{ fontSize: 9, color: C.textSecondary }}>{label}</Text>
      <Text
        style={{ fontSize: 9, color: C.textPrimary, fontFamily: "DM Mono" }}
      >
        {value}
      </Text>
    </View>
  );
}
