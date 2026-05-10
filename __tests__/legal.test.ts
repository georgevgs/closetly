import { describe, expect, test } from "bun:test";

import {
  APP_NAME,
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  OPERATOR_NAME,
} from "~/features/legal/content/constants";
import { privacyPolicy } from "~/features/legal/content/privacy";
import { termsOfService } from "~/features/legal/content/terms";
import type { LegalDocumentContent } from "~/features/legal/types";

const allParagraphs = (document: LegalDocumentContent): string[] => {
  const sectionParagraphs = document.sections.flatMap((section) => section.body);
  return [...document.intro, ...sectionParagraphs];
};

describe("legal constants", () => {
  test("support email is set to support@vagdas.eu", () => {
    expect(CONTACT_EMAIL).toBe("support@vagdas.eu");
  });

  test("operator name is filled in (no placeholder)", () => {
    expect(OPERATOR_NAME.length).toBeGreaterThan(0);
    expect(OPERATOR_NAME).not.toMatch(/REPLACE_WITH/);
  });

  test("effective date is ISO YYYY-MM-DD", () => {
    expect(EFFECTIVE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("privacy policy", () => {
  test("has the expected title", () => {
    expect(privacyPolicy.title).toBe("Privacy Policy");
  });

  test("introduces the operator and the app", () => {
    const intro = privacyPolicy.intro.join(" ");
    expect(intro).toContain(OPERATOR_NAME);
    expect(intro).toContain(APP_NAME);
  });

  test("contains the contact email at least once", () => {
    const occurrences = allParagraphs(privacyPolicy).filter((paragraph) =>
      paragraph.includes(CONTACT_EMAIL),
    );
    expect(occurrences.length).toBeGreaterThan(0);
  });

  test("has no unfilled placeholders", () => {
    for (const paragraph of allParagraphs(privacyPolicy)) {
      expect(paragraph).not.toMatch(/REPLACE_WITH/);
    }
  });
});

describe("terms of service", () => {
  test("has the expected title", () => {
    expect(termsOfService.title).toBe("Terms of Service");
  });

  test("identifies the operator as an individual developer", () => {
    const intro = termsOfService.intro.join(" ");
    expect(intro).toContain(OPERATOR_NAME);
    expect(intro.toLowerCase()).toContain("individual developer");
  });

  test("has no unfilled placeholders", () => {
    for (const paragraph of allParagraphs(termsOfService)) {
      expect(paragraph).not.toMatch(/REPLACE_WITH/);
    }
  });

  test("does not reference a corporate entity by leftover constant name", () => {
    for (const paragraph of allParagraphs(termsOfService)) {
      expect(paragraph).not.toContain("COMPANY_NAME");
      expect(paragraph).not.toContain("GOVERNING_JURISDICTION");
    }
  });
});
