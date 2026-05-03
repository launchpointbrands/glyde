import {
  Circle,
  Document,
  Page,
  Path,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { PdfCover } from "./pdf-cover";
import { PdfFooter } from "./pdf-footer";
import { PdfHeader } from "./pdf-header";
import { C, styles } from "./pdf-tokens";

const PATH_TITLE: Record<string, string> = {
  family: "Transition to family",
  internal: "Internal transition",
  third_party: "Third-party sale",
  esop: "ESOP",
};

const PRIORITY_LABEL: Record<string, string> = {
  maintain_family_ownership:
    "Maintain control over the timing and terms of the exit",
  preserve_operating_culture:
    "Preserve the business mission, values, and culture",
  optimize_tax_for_transition: "Maximize the financial value of the exit",
};

export type SuccessionReportData = {
  contactName: string;
  businessName: string;
  advisorName: string;
  advisorTitle: string;
  preparedAt: string;
  selectedPath: string | null;
  priorities: string[];
  personalScore: number;
  businessScore: number;
  overallScore: number;
  personalItems: { label: string; is_complete: boolean }[];
  businessItems: { label: string; is_complete: boolean }[];
};

export function SuccessionDocument(props: SuccessionReportData) {
  const {
    contactName,
    businessName,
    selectedPath,
    priorities,
    personalScore,
    businessScore,
    overallScore,
    personalItems,
    businessItems,
  } = props;

  const pathTitle =
    (selectedPath && PATH_TITLE[selectedPath]) ?? "Transition";

  return (
    <Document>
      <PdfCover
        reportTitle={`Succession Plan: ${pathTitle}`}
        contactName={contactName}
        businessName={businessName}
        advisorName={props.advisorName}
        advisorTitle={props.advisorTitle}
        preparedAt={props.preparedAt}
      />

      <Page size="LETTER" style={styles.page}>
        <PdfHeader reportType="Succession" />
        <PdfFooter contactName={contactName} businessName={businessName} />

        <Text style={styles.sectionTitle}>Your priorities</Text>
        <Text style={styles.body}>
          Clarity on what matters most during a future exit guides the
          development of transition plans and aligns them to those
          priorities.
        </Text>
        <View style={[styles.card, { marginTop: 8 }]}>
          {priorities.length === 0 ? (
            <Text style={styles.body}>
              Priorities will be set during the discovery conversation.
            </Text>
          ) : (
            priorities.map((p) => (
              <View
                key={p}
                style={{ flexDirection: "row", marginVertical: 3 }}
              >
                <Text
                  style={{ fontSize: 10, color: C.green600, marginRight: 6 }}
                >
                  •
                </Text>
                <Text style={[styles.body, { flex: 1 }]}>
                  {PRIORITY_LABEL[p] ?? humanize(p)}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Succession & exit readiness
        </Text>
        <View
          style={[
            styles.card,
            { flexDirection: "row", gap: 12, alignItems: "center" },
          ]}
        >
          <ScoreBlock label="Overall" score={overallScore} size={70} />
          <ScoreBlock label="Personal" score={personalScore} size={50} />
          <ScoreBlock label="Business" score={businessScore} size={50} />
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>
              Personal readiness reflects emotional and financial
              preparation for an exit. Business readiness reflects how
              well the business itself is prepared to be transferred.
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Personal readiness</Text>
            <Checklist items={personalItems} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Business readiness</Text>
            <Checklist items={businessItems} />
          </View>
        </View>
      </Page>
    </Document>
  );
}

function ScoreBlock({
  label,
  score,
  size,
}: {
  label: string;
  score: number;
  size: number;
}) {
  const stroke = size * 0.12;
  const r = size / 2 - stroke / 2;
  const cx = size / 2;
  const cy = size / 2;
  const clamped = Math.max(0, Math.min(100, score));

  // Render the progress arc as an SVG <Path> using A (arc) commands.
  // Avoids dashoffset, which @react-pdf/renderer's Circle types don't
  // accept. Starts at the top (12 o'clock) and sweeps clockwise.
  const arcPath = describeArc(cx, cy, r, clamped);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={C.borderSubtle}
            strokeWidth={stroke}
            fill="transparent"
          />
          {clamped > 0 && clamped < 100 ? (
            <Path
              d={arcPath}
              stroke={C.green400}
              strokeWidth={stroke}
              fill="transparent"
              strokeLinecap="round"
            />
          ) : null}
          {clamped >= 100 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={C.green400}
              strokeWidth={stroke}
              fill="transparent"
            />
          ) : null}
        </Svg>
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: size * 0.28,
              fontWeight: 600,
              color: C.textPrimary,
              fontFamily: "DM Mono",
            }}
          >
            {score}
          </Text>
        </View>
      </View>
      <Text
        style={{
          fontSize: 8,
          color: C.textTertiary,
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Build an SVG arc path going clockwise from 12 o'clock for `pct` of
// the way around the circle (0..100).
function describeArc(cx: number, cy: number, r: number, pct: number): string {
  const sweepRad = (pct / 100) * 2 * Math.PI;
  // Start at the top: angle = -π/2 from center, but expressed as
  // (cx, cy - r). Then sweep clockwise.
  const startX = cx;
  const startY = cy - r;
  const endAngle = -Math.PI / 2 + sweepRad;
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArc = pct > 50 ? 1 : 0;
  return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
}

function Checklist({
  items,
}: {
  items: { label: string; is_complete: boolean }[];
}) {
  return (
    <View style={[styles.card, { padding: 12 }]}>
      {items.length === 0 ? (
        <Text style={styles.body}>No items.</Text>
      ) : (
        items.map((it, i) => (
          <View
            key={it.label + i}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              paddingVertical: 4,
              borderTopWidth: i === 0 ? 0 : 0.5,
              borderTopColor: C.borderSubtle,
            }}
          >
            <View
              style={{
                width: 11,
                height: 11,
                borderRadius: 2.5,
                borderWidth: 1,
                borderColor: it.is_complete ? C.green400 : C.borderDefault,
                backgroundColor: it.is_complete ? C.green400 : "transparent",
                marginRight: 7,
                marginTop: 1.5,
              }}
            />
            <Text
              style={{
                fontSize: 9,
                flex: 1,
                color: it.is_complete ? C.textTertiary : C.textPrimary,
                textDecoration: it.is_complete ? "line-through" : "none",
              }}
            >
              {it.label}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
