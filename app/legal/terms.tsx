import { LegalDocument } from "~/features/legal/components/LegalDocument";
import { termsOfService } from "~/features/legal/content/terms";

export default function TermsScreen() {
  return <LegalDocument content={termsOfService} />;
}
