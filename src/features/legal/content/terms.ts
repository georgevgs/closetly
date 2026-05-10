import type { LegalDocumentContent } from "../types";
import {
  APP_NAME,
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  OPERATOR_NAME,
} from "./constants";

export const termsOfService: LegalDocumentContent = {
  title: "Terms of Service",
  effectiveDate: EFFECTIVE_DATE,
  intro: [
    `Welcome to ${APP_NAME}. These Terms of Service ("Terms") govern your use of the ${APP_NAME} mobile application and related services (the "Service"), provided by ${OPERATOR_NAME}, an individual developer ("we", "us").`,
    "By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
  ],
  sections: [
    {
      heading: "Eligibility",
      body: [
        "You must be at least 13 years old (or the equivalent minimum age in your jurisdiction) to use the Service. By using the Service, you represent that you meet this requirement.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "You are responsible for the activity that happens on your account and for keeping your login email and access to your inbox secure. Notify us immediately if you suspect unauthorized use.",
        "You agree to provide accurate information and to keep it up to date.",
      ],
    },
    {
      heading: "Your content",
      body: [
        'You retain all rights to the photos, labels, and other content you add to the Service ("Your Content"). You are responsible for Your Content and for ensuring you have the right to upload it.',
        "By uploading Your Content, you grant us a limited, worldwide, non-exclusive, royalty-free license to host, store, process, and display Your Content solely so we can operate the Service for you (for example, syncing your closet across your devices and generating outfit suggestions). This license ends when you delete the content or your account.",
        "We do not use Your Content to train machine-learning models or to build advertising profiles.",
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "You agree not to: (a) upload content that is unlawful, infringing, or that you do not have the right to share; (b) attempt to access another user's account or data; (c) interfere with the Service, probe it for vulnerabilities, or scrape it; (d) reverse-engineer the Service except to the extent permitted by law; (e) use the Service to transmit malware or for any unlawful purpose.",
      ],
    },
    {
      heading: "Outfit suggestions",
      body: [
        `${APP_NAME} generates outfit suggestions based on your closet, the weather, and your past wear history. Suggestions are provided for convenience only and are not guarantees of suitability for any occasion or weather condition. Use your judgment.`,
      ],
    },
    {
      heading: "Third-party services",
      body: [
        "The Service relies on third-party providers, including Supabase (hosting, authentication, storage) and Open-Meteo (weather data). Your use of those providers' services through the app is also subject to their terms.",
        "We are not responsible for third-party services we do not control.",
      ],
    },
    {
      heading: "Changes to the Service",
      body: [
        "The Service is offered on a best-effort basis by an individual developer. We may add, change, or remove features. We may also suspend or stop offering the Service at any time. Where reasonable, we will give notice in advance.",
      ],
    },
    {
      heading: "Termination",
      body: [
        `You can stop using the Service at any time. To delete your account and your data, contact us at ${CONTACT_EMAIL}.`,
        "We may suspend or terminate your access if you breach these Terms or if we are required to do so by law. Where reasonable, we will give notice and an opportunity to remedy the breach.",
      ],
    },
    {
      heading: "Disclaimer",
      body: [
        'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components.',
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the fullest extent permitted by law, we will not be liable for any indirect, incidental, consequential, special, or punitive damages, or for any loss of data, profits, or goodwill, arising out of or relating to your use of the Service. For any direct damages, our aggregate liability is limited to the greater of (a) the amount you paid us for the Service in the 12 months before the event giving rise to liability and (b) USD 50.",
        "Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for fraud, gross negligence, or any rights you have as a consumer under mandatory local law.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These Terms are governed by the laws of your country of residence. Disputes will be resolved in the courts of your country of residence. Nothing in these Terms limits any rights you have under mandatory consumer protection law.",
      ],
    },
    {
      heading: "Changes to these Terms",
      body: [
        "We may update these Terms from time to time. When we make material changes, we will update the effective date and, where appropriate, notify you in the app. Continued use of the Service after the changes take effect constitutes acceptance of the updated Terms.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Questions about these Terms: ${CONTACT_EMAIL}.`,
      ],
    },
  ],
};
