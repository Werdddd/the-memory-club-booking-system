// Single source of truth for the static clauses of the Camera Rental
// Agreement. Rendered both in the rental form preview (rental-form.tsx) and
// in the signed PDF (rental-agreement-pdf.tsx), so the two can never drift.
// Sections 1–3 (Rental Details, Rental Period, Payment) contain booking
// data and are rendered by each consumer directly. Section numbers are
// hardcoded because clauses cross-reference each other ("Section 8").

export type AgreementBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type AgreementSection = { title: string; blocks: AgreementBlock[] };

export type AgreementItem = { name: string; serialNumber: string | null };

const BLANK = "________________";

export function formatAgreementItem(item: AgreementItem, requireSerial: boolean): string {
  if (item.serialNumber) return `${item.name} (Serial No.: ${item.serialNumber})`;
  return requireSerial ? `${item.name} (Serial No.: ${BLANK})` : item.name;
}

export const PAYMENT_TERMS: string[] = [
  "Payments shall be made through the approved payment methods of The Memory Club.",
  "A reservation fee (down payment) equivalent to fifty percent (50%) of the total rental fee is required to secure the booking. The reservation fee is non-refundable, as provided in Section 11.",
  "The security deposit shall be refunded within twenty-four (24) hours after the equipment has been returned, upon completion of the inspection period under Section 8 and confirmation that the equipment is complete and in satisfactory condition, less any applicable deductions for damages, late fees, or other outstanding charges.",
];

export const RENTAL_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    title: "4. RENTER'S RESPONSIBILITIES",
    blocks: [
      { type: "p", text: "The Renter agrees to:" },
      {
        type: "ul",
        items: [
          "Handle the equipment with reasonable care at all times.",
          "Keep the equipment safe from loss, theft, water damage, sand damage, accidental drops, impact, misuse, or any other form of damage.",
          "Return all rented equipment and accessories complete and in the same condition as received, except for normal wear and tear.",
          "Immediately notify The Memory Club of any damage, malfunction, loss, or theft involving the equipment.",
          "Not lend, transfer, sublease, or allow any person other than the Renter to use the rented equipment without the prior written consent of The Memory Club. The Renter remains fully responsible for the equipment throughout the rental period, regardless of who is using it.",
          "Not modify, dismantle, or attempt to repair the equipment.",
        ],
      },
      {
        type: "p",
        text: "For documentation purposes, The Memory Club may provide photos or a video recording showing the condition of the equipment prior to release. This does not replace the Renter's own documentation required under Section 6.",
      },
    ],
  },
  {
    title: "5. EQUIPMENT RELEASE & DELIVERY",
    blocks: [
      {
        type: "p",
        text: "The equipment shall be released only to the verified Renter named in this Agreement, whether by personal pickup or by delivery, unless The Memory Club has approved in advance its release to another person.",
      },
      {
        type: "p",
        text: "If the Renter chooses delivery instead of personal pickup, the following terms shall apply:",
      },
      {
        type: "ul",
        items: [
          "The Memory Club shall book the courier for both delivery and return exclusively through Grab Express. No other courier or delivery service shall be used.",
          "Personal delivery by The Memory Club may be arranged only if time and availability permit, and is not guaranteed.",
          "All delivery and return fees shall be shouldered by the Renter.",
          "The Renter must personally receive the equipment and remain reachable throughout the delivery.",
        ],
      },
    ],
  },
  {
    title: "6. CONDITION DOCUMENTATION UPON RECEIPT",
    blocks: [
      {
        type: "p",
        text: "Upon receiving the equipment, the Renter must immediately inspect it and document its condition by taking:",
      },
      {
        type: "ul",
        items: [
          "Clear photos and videos of the camera, including the body, screen, and lens, and of all included accessories;",
          "Video proof that the equipment powers on and is functioning properly; and",
          "Clear photos or videos of any existing scratches, dents, defects, missing accessories, or other concerns.",
        ],
      },
      {
        type: "p",
        text: "All documentation must be completed and sent to The Memory Club within one (1) hour from the time the equipment is received, and before the equipment is used. Any existing issue must be clearly documented and reported within this period.",
      },
      {
        type: "p",
        text: "Failure to submit the required documentation within the one (1) hour period may affect the assessment of any damage discovered upon the equipment's return.",
      },
    ],
  },
  {
    title: "7. LATE RETURNS",
    blocks: [
      { type: "p", text: "The equipment must be returned on the agreed return date and time." },
      { type: "p", text: "Late returns shall incur the following charges:" },
      {
        type: "ul",
        items: [
          "₱200 per hour of delay.",
          "₱1,000 per full day for every day the equipment remains unreturned beyond the agreed return date.",
        ],
      },
      { type: "p", text: "Late fees may be deducted from the security deposit." },
      {
        type: "p",
        text: "Failure to return the equipment within twenty-four (24) hours without prior communication may be considered a breach of this Agreement and may result in legal action and recovery of all applicable costs.",
      },
    ],
  },
  {
    title: "8. RETURN INSPECTION & SECURITY DEPOSIT",
    blocks: [
      {
        type: "ul",
        items: [
          "Inspection Period: The Memory Club shall be given at least six (6) hours from the time the equipment is returned to thoroughly inspect and assess its condition and functionality.",
          "Security Deposit Refund: The security deposit shall be processed for return only after the inspection period is completed, provided that no damage, missing accessories, or malfunctions attributable to the Renter are found.",
          "Damage Charges: Any damage, defect, or malfunction found during the inspection period that is attributable to the Renter's handling or use of the equipment shall be charged at the corresponding repair or replacement cost. Such charges may be deducted from the security deposit, and any amount exceeding the deposit shall remain payable by the Renter.",
          "Honesty and Accountability: The Renter must disclose any damage, accident, or technical issue immediately. Any intentional concealment of damage, dishonesty, misuse, or failure to disclose incidents involving the equipment may result in further liability and appropriate legal action, including the filing of a formal complaint where warranted.",
        ],
      },
    ],
  },
  {
    title: "9. DAMAGE, LOSS & LIABILITY",
    blocks: [
      {
        type: "p",
        text: "The Renter assumes full responsibility for the rented equipment from the time it is received until it is returned and accepted by The Memory Club.",
      },
      { type: "p", text: "In the event of damage, loss, or theft:" },
      {
        type: "ul",
        items: [
          "The Renter shall be responsible for the full cost of repair or replacement, depending on the extent of the damage.",
          "All inspections, repair decisions, and replacement determinations shall be made solely by The Memory Club.",
          "The Renter shall not repair or attempt to repair the equipment through any third-party technician or service center without the prior written approval of The Memory Club. Any unauthorized repair or modification shall be treated as additional damage, and the Renter shall remain liable for all resulting costs.",
          "If the equipment is declared beyond economical repair, lost, or stolen, the Renter agrees to pay the full replacement cost of a brand-new equivalent unit based on its current market value.",
          "The security deposit may be partially or fully forfeited depending on the extent of the damage or outstanding obligations.",
          "If the equipment becomes unavailable for confirmed bookings due to damage caused during the rental period, the Renter may also be held responsible for the resulting loss of rental income.",
        ],
      },
    ],
  },
  {
    title: "10. LENS PROTECTION",
    blocks: [
      {
        type: "p",
        text: "The Renter shall ensure that the camera is properly handled, stored, and transported throughout the rental period. The camera must not be placed inside bags, pouches, or compartments that are too tight or restrictive, as excessive pressure may damage the lens mechanism.",
      },
      {
        type: "p",
        text: "Any lens damage resulting from improper storage, handling, transportation, or negligence shall be the Renter's responsibility. The estimated repair cost for lens damage is ₱30,000. If the damage renders the camera beyond repair or requires complete unit replacement, the Renter shall be liable for the full replacement cost as provided in Section 9.",
      },
      {
        type: "p",
        text: "All damages shall be subject to inspection and assessment by The Memory Club, and the Renter agrees to shoulder the corresponding repair or replacement expenses for damages attributable to their handling or negligence.",
      },
    ],
  },
  {
    title: "11. CANCELLATION POLICY",
    blocks: [
      {
        type: "p",
        text: "A strict no-cancellation policy shall apply, except in cases of verified emergencies supported by valid proof or documentation.",
      },
      {
        type: "ul",
        items: [
          "The fifty percent (50%) reservation fee (down payment) is strictly NON-REFUNDABLE.",
          "If the Renter has fully paid the rental fee and cancels due to a verified emergency at least seven (7) days before the scheduled pickup date, The Memory Club shall refund fifty percent (50%) of the total rental fee and retain the reservation fee.",
          "If the Renter has fully paid the rental fee and cancels due to a verified emergency less than twenty-four (24) hours before the scheduled pickup date, The Memory Club shall retain the reservation fee and an additional thirty percent (30%) of the total rental fee as reasonable cancellation compensation, and refund the remaining twenty percent (20%).",
          "Any security deposit paid shall be refunded in full, provided the equipment has not yet been released.",
          "If The Memory Club cancels the rental due to emergencies or circumstances beyond its reasonable control, all payments received from the Renter shall be refunded in full.",
        ],
      },
    ],
  },
  {
    title: "12. BREACH OF AGREEMENT",
    blocks: [
      {
        type: "p",
        text: "Failure to comply with any provision of this Agreement shall constitute a breach of contract.",
      },
      { type: "p", text: "Upon breach, The Memory Club reserves the right to:" },
      {
        type: "ul",
        items: [
          "Recover the rented equipment immediately;",
          "Charge all unpaid rental fees, late fees, repair costs, or replacement costs;",
          "Retain all or part of the security deposit where applicable; and",
          "Pursue any legal remedies available under the laws of the Republic of the Philippines.",
        ],
      },
    ],
  },
  {
    title: "13. GOVERNING LAW",
    blocks: [
      {
        type: "p",
        text: "This Agreement shall be governed by and interpreted in accordance with the laws of the Republic of the Philippines.",
      },
    ],
  },
  {
    title: "14. FORCE MAJEURE",
    blocks: [
      {
        type: "p",
        text: "Neither party shall be held liable for delays or failure to perform their obligations under this Agreement when caused by events beyond their reasonable control, including but not limited to natural disasters, typhoons, floods, earthquakes, government restrictions, or other unforeseen emergencies.",
      },
      {
        type: "p",
        text: "The Renter must notify The Memory Club as soon as reasonably possible if such an event affects the return of the equipment. Any extension of the rental period or waiver of applicable fees shall be solely at the discretion of The Memory Club and must be confirmed in writing.",
      },
    ],
  },
  {
    title: "15. ACKNOWLEDGMENT",
    blocks: [
      { type: "p", text: "By signing below, the Renter confirms that:" },
      {
        type: "ul",
        items: [
          "They have carefully read and fully understood this Agreement.",
          "They agree to comply with all the terms and conditions stated herein.",
          "They will verify upon receipt that the equipment and serial numbers listed in Section 1 match the units received.",
          "They acknowledge receipt of the rented equipment and accessories in good working condition, subject to any issues documented and reported under Section 6.",
          "They accept full responsibility for the rented equipment throughout the entire rental period.",
          "They understand that failure to comply with this Agreement may result in additional charges and legal action where necessary.",
        ],
      },
    ],
  },
];
