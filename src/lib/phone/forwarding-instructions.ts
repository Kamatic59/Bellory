/**
 * What the shop owner physically has to do so their phone reaches Bellory.
 *
 * Nothing in the product works until this happens, and it happens on a keypad,
 * not in our app. The dial codes differ by how the line is carried, so we ask
 * two plain questions (is it a cell, a landline, or an internet phone / and do
 * you want us to catch only the calls you miss) and print the exact string.
 *
 * "No answer" is what a small shop actually wants: they pick up when they're
 * free, and Bellory catches the rest. Unconditional sends every call to us.
 */

export type LineType = "mobile" | "landline" | "voip" | "unknown";
export type ForwardingType = "no_answer" | "unconditional" | "none";

export type ForwardingInstructions = {
  /** What to punch into the phone, Bellory's number already filled in. */
  dialString: string | null;
  /** How to switch it back off. */
  cancelString: string | null;
  /** How to check whether it's currently on. */
  statusString: string | null;
  heading: string;
  steps: string[];
  warnings: string[];
};

function formatUsNumber(e164: string): string {
  const digits = e164.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length !== 10) return e164;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function tenDigits(e164: string): string {
  return e164.replace(/\D/g, "").replace(/^1/, "");
}

/**
 * @param belloryNumber E.164, e.g. +13853401808
 * @param ringSeconds how long their own phone rings before we pick up. Must be
 *   under the carrier's voicemail timeout or voicemail wins and we never ring.
 */
export function getForwardingInstructions({
  lineType,
  forwardingType,
  belloryNumber,
  ringSeconds = 15,
}: {
  lineType: LineType;
  forwardingType: ForwardingType;
  belloryNumber: string;
  ringSeconds?: number;
}): ForwardingInstructions {
  const pretty = formatUsNumber(belloryNumber);
  const ten = tenDigits(belloryNumber);

  if (forwardingType === "none") {
    return {
      dialString: null,
      cancelString: null,
      statusString: null,
      heading: "No forwarding — customers dial the Bellory number directly",
      steps: [
        `Put ${pretty} on the website, Google listing, truck and business cards.`,
        "Nothing to set up on the existing phone. Every call to the new number reaches Bellory.",
      ],
      warnings: [
        "Calls to the shop's old number still ring the old way — Bellory never sees them.",
      ],
    };
  }

  const catchAll = forwardingType === "unconditional";

  if (lineType === "voip") {
    return {
      dialString: null,
      cancelString: null,
      statusString: null,
      heading: "Internet phone — set this in the provider's website, not on the handset",
      steps: [
        "Sign in to the phone provider (RingCentral, Ooma, Google Voice, Vonage, Spectrum Business, Grasshopper, etc).",
        catchAll
          ? "Find Call Forwarding and send all calls to the number below."
          : `Find Call Forwarding and add ${pretty} as the last step in the ring order, after the shop's own phones.`,
        `Forward to: ${pretty}`,
        "Save, then call the shop's number from another phone to check Bellory answers.",
      ],
      warnings: [
        "Star codes dialled on the handset are ignored by most internet phone systems — it has to be done in their portal.",
        !catchAll ? "If the system has a 'ring time' or 'no answer after' setting, set it shorter than voicemail so Bellory picks up instead of voicemail." : "",
      ].filter(Boolean),
    };
  }

  if (lineType === "landline") {
    return {
      dialString: catchAll ? `*72 ${ten}` : `*92 ${ten}`,
      cancelString: catchAll ? "*73" : "*93",
      statusString: null,
      heading: catchAll ? "Landline — forward every call" : "Landline — forward only the calls nobody answers",
      steps: [
        "Pick up the shop's phone and listen for a dial tone.",
        catchAll ? `Dial *72 then ${ten}.` : `Dial *92 then ${ten}.`,
        "Wait for the confirmation tone or stutter dial tone, then hang up.",
        "Call the shop's number from another phone to check Bellory answers.",
      ],
      warnings: [
        "Busy / no-answer forwarding often has to be switched on by the phone company first — if the code doesn't take, call the carrier and ask them to enable 'Call Forward Don't Answer'.",
        `To turn it back off later, dial ${catchAll ? "*73" : "*93"}.`,
      ],
    };
  }

  // Mobile (and unknown, which is overwhelmingly a cell in this trade).
  if (catchAll) {
    return {
      dialString: `**21*${ten}#`,
      cancelString: "##21#",
      statusString: "*#21#",
      heading: "Cell phone — forward every call",
      steps: [
        "Open the phone keypad, like you're dialling a number.",
        `Type **21*${ten}# and press call.`,
        "A confirmation appears on screen. That's it.",
        "Call the shop's number from another phone to check Bellory answers.",
      ],
      warnings: [
        "This sends 100% of calls to Bellory — the shop's phone will stop ringing.",
        "Verizon phones use a different code: dial *72 then the number, and press call.",
        "To turn it off later, dial ##21#.",
      ],
    };
  }

  return {
    dialString: `**61*${ten}**${ringSeconds}#`,
    cancelString: "##61#",
    statusString: "*#61#",
    heading: "Cell phone — Bellory catches only the calls you don't answer",
    steps: [
      "Open the phone keypad, like you're dialling a number.",
      `Type **61*${ten}**${ringSeconds}# and press call.`,
      `A confirmation appears on screen. The phone now rings for about ${ringSeconds} seconds, and if nobody picks up, Bellory answers.`,
      "Call the shop's number from another phone, let it ring, and check Bellory answers.",
    ],
    warnings: [
      "Do NOT use the Call Forwarding switch in iPhone Settings — that one sends every call to Bellory. The keypad code above is the one that only catches missed calls.",
      `Keep the ring time (${ringSeconds} seconds) shorter than the carrier's voicemail pickup, or voicemail answers first and Bellory never rings.`,
      "Verizon phones use *71 then the number instead.",
      "To turn it off later, dial ##61#.",
    ],
  };
}

/** A plain-text version the admin can paste into a text message to the owner. */
export function forwardingInstructionsAsText(instructions: ForwardingInstructions): string {
  const lines = [instructions.heading, ""];
  instructions.steps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  if (instructions.warnings.length > 0) {
    lines.push("", "Worth knowing:");
    instructions.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }
  return lines.join("\n");
}
