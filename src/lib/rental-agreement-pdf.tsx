import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export type RentalAgreementData = {
  fullName: string;
  equipmentNames: string[];
  addonNames: string[];
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  rentalFeeLabel: string;
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
  const equipmentLabel = data.equipmentNames.length > 0 ? data.equipmentNames.join(", ") : "________________";
  const addonsLabel = data.addonNames.length > 0 ? data.addonNames.join(", ") : "None";

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
        <Text style={styles.paragraph}>Equipment Rented: {equipmentLabel}</Text>
        <Text style={styles.paragraph}>Accessories Included: {addonsLabel}</Text>
        <Text style={styles.paragraph}>
          The Renter confirms that all equipment and accessories listed above were received
          complete, clean, and in good working condition.
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
        <Text style={styles.paragraph}>Security Deposit: ₱________________</Text>
        <Text style={styles.paragraph}>
          Payments shall be made through the approved payment methods of The Memory Club.
        </Text>
        <Text style={styles.paragraph}>
          The security deposit shall be refunded within 24 hours after the equipment has been
          returned, inspected, and confirmed to be complete and in satisfactory condition, less
          any applicable deductions for damages, late fees, or other outstanding charges.
        </Text>

        <Text style={styles.heading}>4. RENTER&apos;S RESPONSIBILITIES</Text>
        <Text style={styles.paragraph}>The Renter agrees to:</Text>
        <Text style={styles.listItem}>• Handle the equipment with reasonable care at all times.</Text>
        <Text style={styles.listItem}>
          • Keep the equipment safe from loss, theft, water damage, sand damage, accidental
          drops, impact, misuse, or any other form of damage.
        </Text>
        <Text style={styles.listItem}>
          • Return all rented equipment and accessories complete and in the same condition as
          received, except for normal wear and tear.
        </Text>
        <Text style={styles.listItem}>
          • Immediately notify The Memory Club of any damage, malfunction, loss, or theft
          involving the equipment.
        </Text>
        <Text style={styles.listItem}>
          • Not lend, transfer, sublease, or allow any person other than the Renter to use the
          rented equipment without the prior written consent of The Memory Club. The Renter
          remains fully responsible for the equipment throughout the rental period, regardless of
          who is using it.
        </Text>
        <Text style={styles.listItem}>• Not modify, dismantle, or attempt to repair the equipment.</Text>
        <Text style={styles.paragraph}>
          For documentation purposes, The Memory Club may provide photos or a video recording
          showing the condition of the equipment prior to release.
        </Text>

        <Text style={styles.heading}>5. LATE RETURNS</Text>
        <Text style={styles.paragraph}>The equipment must be returned on the agreed return date and time.</Text>
        <Text style={styles.paragraph}>Late returns shall incur the following charges:</Text>
        <Text style={styles.listItem}>• ₱200 per hour of delay.</Text>
        <Text style={styles.listItem}>
          • ₱1,000 per full day for every day the equipment remains unreturned beyond the agreed
          return date.
        </Text>
        <Text style={styles.paragraph}>Late fees may be deducted from the security deposit.</Text>
        <Text style={styles.paragraph}>
          Failure to return the equipment within twenty-four (24) hours without prior
          communication may be considered a breach of this Agreement and may result in legal
          action and recovery of all applicable costs.
        </Text>

        <Text style={styles.heading}>6. DAMAGE, LOSS &amp; LIABILITY</Text>
        <Text style={styles.paragraph}>
          The Renter assumes full responsibility for the rented equipment from the time it is
          received until it is returned and accepted by The Memory Club.
        </Text>
        <Text style={styles.paragraph}>In the event of damage, loss, or theft:</Text>
        <Text style={styles.listItem}>
          • The Renter shall be responsible for the full cost of repair or replacement, depending
          on the extent of the damage.
        </Text>
        <Text style={styles.listItem}>
          • All inspections, repair decisions, and replacement determinations shall be made
          solely by The Memory Club.
        </Text>
        <Text style={styles.listItem}>
          • The Renter shall not repair or attempt to repair the equipment through any
          third-party technician or service center without the prior written approval of The
          Memory Club. Any unauthorized repair or modification shall be treated as additional
          damage, and the Renter shall remain liable for all resulting costs.
        </Text>
        <Text style={styles.listItem}>
          • If the equipment is declared beyond economical repair, lost, or stolen, the Renter
          agrees to pay the full replacement cost of a brand-new equivalent unit based on its
          current market value.
        </Text>
        <Text style={styles.listItem}>
          • The security deposit may be partially or fully forfeited depending on the extent of
          the damage or outstanding obligations.
        </Text>
        <Text style={styles.listItem}>
          • If the equipment becomes unavailable for confirmed bookings due to damage caused
          during the rental period, the Renter may also be held responsible for the resulting
          loss of rental income.
        </Text>

        <Text style={styles.heading}>7. BREACH OF AGREEMENT</Text>
        <Text style={styles.paragraph}>
          Failure to comply with any provision of this Agreement shall constitute a breach of
          contract.
        </Text>
        <Text style={styles.paragraph}>Upon breach, The Memory Club reserves the right to:</Text>
        <Text style={styles.listItem}>• Recover the rented equipment immediately;</Text>
        <Text style={styles.listItem}>
          • Charge all unpaid rental fees, late fees, repair costs, or replacement costs;
        </Text>
        <Text style={styles.listItem}>• Retain all or part of the security deposit where applicable; and</Text>
        <Text style={styles.listItem}>
          • Pursue any legal remedies available under the laws of the Republic of the
          Philippines.
        </Text>

        <Text style={styles.heading}>8. GOVERNING LAW</Text>
        <Text style={styles.paragraph}>
          This Agreement shall be governed by and interpreted in accordance with the laws of the
          Republic of the Philippines.
        </Text>

        <Text style={styles.heading}>9. FORCE MAJEURE</Text>
        <Text style={styles.paragraph}>
          Neither party shall be held liable for delays or failure to perform their obligations
          under this Agreement when caused by events beyond their reasonable control, including
          but not limited to natural disasters, typhoons, floods, earthquakes, government
          restrictions, or other unforeseen emergencies.
        </Text>
        <Text style={styles.paragraph}>
          The Renter must notify The Memory Club as soon as reasonably possible if such an event
          affects the return of the equipment. Any extension of the rental period or waiver of
          applicable fees shall be solely at the discretion of The Memory Club and must be
          confirmed in writing.
        </Text>

        <Text style={styles.heading}>10. ACKNOWLEDGMENT</Text>
        <Text style={styles.paragraph}>By signing below, the Renter confirms that:</Text>
        <Text style={styles.listItem}>• They have carefully read and fully understood this Agreement.</Text>
        <Text style={styles.listItem}>
          • They agree to comply with all the terms and conditions stated herein.
        </Text>
        <Text style={styles.listItem}>
          • They acknowledge receipt of the rented equipment and accessories in good working
          condition.
        </Text>
        <Text style={styles.listItem}>
          • They accept full responsibility for the rented equipment throughout the entire
          rental period.
        </Text>
        <Text style={styles.listItem}>
          • They understand that failure to comply with this Agreement may result in additional
          charges and legal action where necessary.
        </Text>

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
