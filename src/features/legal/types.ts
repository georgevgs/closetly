export type LegalParagraph = string;

export type LegalSection = {
  heading: string;
  body: LegalParagraph[];
};

export type LegalDocumentContent = {
  title: string;
  effectiveDate: string;
  intro: LegalParagraph[];
  sections: LegalSection[];
};
