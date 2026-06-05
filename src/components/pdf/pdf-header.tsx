import { Text, View } from "@react-pdf/renderer";
import { C } from "./pdf-tokens";

// Running header on every content page. White-labeled: the left slot
// carries the firm/subentity brand name (NOT a WMGR/product wordmark —
// WMGR appears only as a "Powered by" credit in the cover + footer). The
// right slot names the report module.
export function PdfHeader({
  reportType,
  brandName,
  accentColor,
}: {
  reportType: string;
  brandName?: string | null;
  accentColor?: string | null;
}) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 32,
        left: 54,
        right: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.borderSubtle,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: -0.2,
          color: accentColor || C.textPrimary,
        }}
      >
        {brandName || " "}
      </Text>
      <Text
        style={{
          fontSize: 8,
          color: C.textTertiary,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        {reportType}
      </Text>
    </View>
  );
}
