import type { LegalDocumentContent } from "../types";
import {
  APP_NAME,
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  OPERATOR_NAME,
} from "./constants";

export const privacyPolicy: LegalDocumentContent = {
  title: "Privacy Policy",
  effectiveDate: EFFECTIVE_DATE,
  intro: [
    `${APP_NAME} is built and operated by ${OPERATOR_NAME}, an individual developer ("we", "us"). This Privacy Policy explains what information we collect through the ${APP_NAME} mobile application, how we use it, and the rights you have over your data.`,
    `${APP_NAME} is designed to keep your wardrobe data private to your account. We do not sell your data and we do not use it to build advertising profiles.`,
  ],
  sections: [
    {
      heading: "Information you provide",
      body: [
        "Account: when you sign in, we collect your email address so we can send a one-time login code and identify your account. We do not store passwords.",
        "Closet content: photos of clothing items you choose to add, plus the labels you assign (category, color, season, formality, warmth, pattern, style, notes). These are stored in a private cloud storage bucket scoped to your account.",
        "Outfits, trips, wear log, and favorites: information you create while using the app, including which items you wore on which days and how you rated outfits.",
      ],
    },
    {
      heading: "Information collected automatically",
      body: [
        "Device location (when you grant permission): we read approximate latitude and longitude on demand so we can fetch the local weather forecast for outfit suggestions. The location is sent to a weather provider (Open-Meteo) and is not stored on our servers in association with your account.",
        `Image attributes derived on your device: when you add an item, ${APP_NAME} analyzes the photo on your device to extract dominant colors and (optionally) remove the background. These computations happen locally on your phone.`,
        "Diagnostic data: basic crash and error information that helps us keep the app working. This data is not used to identify you personally.",
      ],
    },
    {
      heading: "How we use information",
      body: [
        "To provide the core service: store your closet, generate outfit suggestions, plan trips, and track wear history.",
        "To authenticate you and keep your session secure.",
        "To improve the app, fix bugs, and prevent abuse.",
      ],
    },
    {
      heading: "Service providers",
      body: [
        "Supabase: we use Supabase for authentication, database, and private storage. Your data is stored in Supabase infrastructure under access policies that restrict reads and writes to your account.",
        "Open-Meteo: we send approximate coordinates to fetch weather forecasts. No account identifier is sent.",
        "Apple and Google: when you install the app from their stores, their platforms may collect information per their own privacy policies.",
      ],
    },
    {
      heading: "Data retention",
      body: [
        "We keep your account data for as long as your account exists. You can delete individual items, outfits, or trips at any time from inside the app.",
        `If you would like to delete your account and all associated data, contact us at ${CONTACT_EMAIL}. We will delete your data within 30 days of receiving the request, unless we are required to retain it for legal reasons.`,
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Depending on where you live, you may have the right to access, correct, port, or delete the personal data we hold about you, and to object to or restrict certain processing. If you are in the European Economic Area or the United Kingdom, you also have the right to lodge a complaint with your local data protection authority.",
        `To exercise any of these rights, email us at ${CONTACT_EMAIL}. We may need to verify your identity before acting on a request.`,
      ],
    },
    {
      heading: "Children",
      body: [
        `${APP_NAME} is not directed to children under 13 (or the equivalent minimum age in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can delete it.`,
      ],
    },
    {
      heading: "Security",
      body: [
        "We use industry-standard safeguards including TLS for data in transit and access policies that scope reads and writes to your account. No system is perfectly secure; if you believe your account has been compromised, contact us immediately.",
      ],
    },
    {
      heading: "Data controller",
      body: [
        `For the purposes of applicable data protection law, the data controller is ${OPERATOR_NAME}, acting as an individual. You can reach the controller at ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: "Changes to this policy",
      body: [
        "We may update this Privacy Policy from time to time. When we make material changes, we will update the effective date above and, where appropriate, notify you in the app.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Questions or requests about this policy: ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};
