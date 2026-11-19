import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  PAYMENT_TERMS,
  RENTAL_AGREEMENT_SECTIONS,
  formatAgreementItem,
  type AgreementItem,
} from "@/lib/rental-agreement-terms";

export type RentalAgreementData = {
  fullName: string;
  equipment: AgreementItem[];
  addons: AgreementItem[];
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  rentalFeeLabel: string;
  reservationFeeLabel: string;
  securityDepositLabel: string;
  agreementDate: string;
  signature:
    | { method: "typed"; text: string }
    | { method: "drawn"; dataUri: string };
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.4,
  },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "center" },
  subtitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  heading: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 4 },
  listItem: { marginBottom: 3, paddingLeft: 10 },
  signatureBlock: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    borderTopStyle: "solid",
  },
  signatureHeading: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  signatureImage: { width: 160, height: 60, marginVertical: 6, objectFit: "contain" },
  signatureTypedText: { fontSize: 16, fontFamily: "Times-Italic", marginVertical: 8 },
});

function RentalAgreementDocument({ data }: { data: RentalAgreementData }) {
  return (
    <Document title="The Memory Club - Camera Rental Agreement">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>THE MEMORY CLUB</Text>
        <Text style={styles.subtitle}>CAMERA RENTAL AGREEMENT</Text>

        <Text style={styles.paragraph}>
          This Camera Rental Agreement (&quot;Agreement&quot;) is entered into between The
          Memory Club (&quot;Lessor&quot;) and the Renter (&quot;Renter&quot;). By signing this
          Agreement, the Renter acknowledges that they have read, understood, and agreed to all
          the terms and conditions stated herein.
        </Text>

        <Text style={styles.heading}>1. RENTAL DETAILS</Text>
        <Text style={styles.paragraph}>Equipment Rented:</Text>
        {data.equipment.length > 0 ? (
          data.equipment.map((item, i) => (
            <Text key={i} style={styles.listItem}>
              • {formatAgreementItem(item, true)}
            </Text>
          ))
        ) : (
          <Text style={styles.listItem}>________________</Text>
        )}
        <Text style={styles.paragraph}>Accessories Included:</Text>
        {data.addons.length > 0 ? (
          data.addons.map((item, i) => (
            <Text key={i} style={styles.listItem}>
              • {formatAgreementItem(item, false)}
            </Text>
          ))
        ) : (
          <Text style={styles.listItem}>None</Text>
        )}
        <Text style={styles.paragraph}>
          The serial numbers listed above identify the specific units released to the Renter.
          The Renter shall return the same units bearing the same serial numbers.
        </Text>

        <Text style={styles.heading}>2. RENTAL PERIOD</Text>
        <Text style={styles.paragraph}>Pickup Date: {data.pickupDate}</Text>
        <Text style={styles.paragraph}>Pickup Time: {data.pickupTime}</Text>
        <Text style={styles.paragraph}>Return Date: {data.returnDate}</Text>
        <Text style={styles.paragraph}>Return Time: {data.returnTime}</Text>
        <Text style={styles.paragraph}>
          The Renter agrees to return the equipment on or before the agreed return date and time.
        </Text>

        <Text style={styles.heading}>3. PAYMENT</Text>
        <Text style={styles.paragraph}>Rental Fee: {data.rentalFeeLabel}</Text>
        <Text style={styles.paragraph}>
          Reservation Fee (50% Down Payment): {data.reservationFeeLabel}
        </Text>
        <Text style={styles.paragraph}>Security Deposit: {data.securityDepositLabel}</Text>
        {PAYMENT_TERMS.map((text, i) => (
          <Text key={i} style={styles.paragraph}>
            {text}
          </Text>
        ))}

        {RENTAL_AGREEMENT_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.heading}>{section.title}</Text>
            {section.blocks.map((block, i) =>
              block.type === "p" ? (
                <Text key={i} style={styles.paragraph}>
                  {block.text}
                </Text>
              ) : (
                <View key={i}>
                  {block.items.map((item, j) => (
                    <Text key={j} style={styles.listItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )
            )}
          </View>
        ))}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureHeading}>SIGNATURE</Text>
          <Text style={styles.paragraph}>RENTER</Text>
          <Text style={styles.paragraph}>Name: {data.fullName}</Text>
          <Text style={styles.paragraph}>Signature:</Text>
          {data.signature.method === "typed" ? (
            <Text style={styles.signatureTypedText}>{data.signature.text}</Text>
          ) : (
            <PdfImage src={data.signature.dataUri} style={styles.signatureImage} />
          )}
          <Text style={styles.paragraph}>Date: {data.agreementDate}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderRentalAgreementPdf(data: RentalAgreementData): Promise<Buffer> {
  return renderToBuffer(<RentalAgreementDocument data={data} />);
}
