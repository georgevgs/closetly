import { LegalDocument } from "~/features/legal/components/LegalDocument";
import { privacyPolicy } from "~/features/legal/content/privacy";

export default function PrivacyScreen() {
  return <LegalDocument content={privacyPolicy} />;
}
