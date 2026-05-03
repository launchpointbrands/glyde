import { Text, View } from "@react-pdf/renderer";
import { C } from "./pdf-tokens";

export function PdfFooter({
  contactName,
  businessName,
}: {
  contactName: string;
  businessName: string;
}) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 28,
        left: 54,
        right: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: C.borderSubtle,
      }}
    >
      <Text style={{ fontSize: 8, color: C.textTertiary, flex: 1 }}>
        GlydePath · Confidential
      </Text>
      <Text
        style={{
          fontSize: 8,
          color: C.textTertiary,
          flex: 2,
          textAlign: "center",
        }}
      >
        {contactName} · {businessName}
      </Text>
      <Text
        style={{
          fontSize: 8,
          color: C.textTertiary,
          flex: 1,
          textAlign: "right",
          fontFamily: "DM Mono",
        }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}
