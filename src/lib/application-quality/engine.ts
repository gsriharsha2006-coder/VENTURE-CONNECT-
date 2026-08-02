import type {
  ApplicationAnswerValue,
  ApplicationDraft,
  ApplicationQualityResult,
  EligibilityResult,
  EligibilityRules,
  QualityIssue
} from "./types";

const PLACEHOLDER_VALUES = new Set([
  "test",
  "testing",
  "asdf",
  "asdfgh",
  "qwerty",
  "nothing",
  "no idea",
  "12345",
  "will update later",
  "coming soon",
  "sample text",
  "not applicable",
  "n/a"
]);

const LINK_FIELD_PATTERN = /(url|website|github|demo|portfolio|pitch.?deck|link)$/i;
const LONG_FORM_FIELD_PATTERN = /(problem|solution|customer|market|model|competitor|differentiation|technology|validation|traction|strategy|team|fund|risk|assumption|description)/i;

function asText(value: ApplicationAnswerValue) {
  if (Array.isArray(value)) return value.join(" ").trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return value?.trim() ?? "";
}

function normalized(value: ApplicationAnswerValue) {
  return asText(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function isValidPublicUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname) && !parsed.hostname.endsWith(".local") && parsed.hostname !== "localhost";
  } catch {
    return false;
  }
}

function issue(field: string, code: string, message: string, suggestedAction: string, severity: QualityIssue["severity"] = "high"): QualityIssue {
  return { field, code, message, suggestedAction, severity };
}

function includesCaseInsensitive(values: string[] | undefined, candidate: string) {
  if (!values?.length) return true;
  const target = candidate.trim().toLowerCase();
  return values.some((value) => value.trim().toLowerCase() === target);
}

export function checkEligibility(draft: ApplicationDraft, rules: EligibilityRules, now = new Date()) {
  const sectorMatch = includesCaseInsensitive(rules.acceptedSectors, draft.sector);
  const stageMatch = !rules.acceptedStages?.length || rules.acceptedStages.includes(draft.startupStage);
  const geographyMatch = includesCaseInsensitive(rules.acceptedGeographies, draft.geography);
  const collegeMatch = !rules.eligibleColleges?.length || includesCaseInsensitive(rules.eligibleColleges, draft.college ?? "");
  const funding = draft.fundingRequirement;
  const fundingRangeMatch = funding === undefined || (
    (rules.minimumFunding === undefined || funding >= rules.minimumFunding) &&
    (rules.maximumFunding === undefined || funding <= rules.maximumFunding)
  );
  const deadlineTimestamp = rules.deadline && /^\d{4}-\d{2}-\d{2}$/.test(rules.deadline)
    ? Date.parse(`${rules.deadline}T23:59:59.999Z`)
    : Date.parse(rules.deadline ?? "");
  const deadlineOpen = !rules.deadline || Number.isNaN(deadlineTimestamp) || deadlineTimestamp >= now.getTime();
  const eligibility: EligibilityResult = { sectorMatch, stageMatch, geographyMatch, fundingRangeMatch, collegeMatch, deadlineOpen };
  const mismatches: string[] = [];
  if (!sectorMatch) mismatches.push("Sector does not match the opportunity criteria.");
  if (!stageMatch) mismatches.push("Startup stage does not match the opportunity criteria.");
  if (!geographyMatch) mismatches.push("Geography does not match the opportunity criteria.");
  if (!collegeMatch) mismatches.push("College eligibility does not match the opportunity criteria.");
  if (!fundingRangeMatch) mismatches.push("Funding request is outside the accepted range.");
  if (!deadlineOpen) mismatches.push("The application deadline has passed.");
  return { eligibility, mismatches };
}

function repeatedWordRatio(text: string) {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (words.length < 6) return 0;
  const counts = new Map<string, number>();
  words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  return Math.max(...counts.values()) / words.length;
}

function mostlySymbols(text: string) {
  if (text.length < 6) return false;
  const meaningful = (text.match(/[a-z0-9]/gi) ?? []).length;
  return meaningful / text.length < 0.45;
}

export function runRuleBasedValidation(draft: ApplicationDraft) {
  const issues: QualityIssue[] = [];
  const seenAnswers = new Map<string, string>();

  draft.requiredFields.forEach((field) => {
    if (!normalized(draft.answers[field])) {
      issues.push(issue(field, "required", "This required field is empty.", "Add a complete answer before rechecking."));
    }
  });

  Object.entries(draft.answers).forEach(([field, value]) => {
    const text = asText(value);
    const clean = normalized(value);
    if (!clean) return;

    if (PLACEHOLDER_VALUES.has(clean) || /^(.)\1{4,}$/.test(clean)) {
      issues.push(issue(field, "placeholder", "This answer appears to be placeholder or random text.", "Replace it with specific information supported by your current evidence."));
    }
    if (LONG_FORM_FIELD_PATTERN.test(field) && clean.split(" ").length < 4) {
      issues.push(issue(field, "too_short", "This answer is too short to be meaningful.", "Explain the claim, context, and available evidence in at least one complete sentence."));
    }
    if (LONG_FORM_FIELD_PATTERN.test(field) && /^[bcdfghjklmnpqrstvwxyz0-9]{8,}$/i.test(clean.replace(/\s/g, ""))) {
      issues.push(issue(field, "random_text", "This answer appears to contain random text.", "Replace it with a clear, field-specific explanation."));
    }
    if (LINK_FIELD_PATTERN.test(field) && text && !isValidPublicUrl(text)) {
      issues.push(issue(field, "invalid_url", "This link is not a valid public URL.", "Use a complete http or https URL."));
    }
    if (/(.)\1{7,}/i.test(text)) {
      issues.push(issue(field, "repeated_characters", "This answer contains excessive repeated characters.", "Remove repeated characters and provide a readable answer."));
    }
    if (mostlySymbols(text)) {
      issues.push(issue(field, "mostly_symbols", "This answer contains mostly symbols.", "Replace symbols with a clear written answer."));
    }
    if (repeatedWordRatio(text) >= 0.5) {
      issues.push(issue(field, "repeated_words", "This answer repeats the same words excessively.", "Rewrite the answer with specific, non-repeated information."));
    }
    const paragraphs = text.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z])/).map((part) => part.trim().toLowerCase()).filter((part) => part.length >= 24);
    if (new Set(paragraphs).size < paragraphs.length) {
      issues.push(issue(field, "duplicate_paragraph", "This answer repeats the same paragraph.", "Remove duplicated text and keep one concise, relevant explanation."));
    }
    if (clean.length >= 24) {
      const existingField = seenAnswers.get(clean);
      if (existingField && existingField !== field) {
        issues.push(issue(field, "duplicate_answer", `This answer duplicates the ${existingField} response.`, "Provide information specific to this field."));
      } else {
        seenAnswers.set(clean, field);
      }
    }
  });

  if (draft.fundingRequirement !== undefined && (!Number.isFinite(draft.fundingRequirement) || draft.fundingRequirement < 0)) {
    issues.push(issue("fundingRequirement", "invalid_funding", "Funding requirement must be a valid non-negative amount.", "Enter the requested amount as a number."));
  }
  if (draft.fundingRequirement && !normalized(draft.answers.useOfFunds)) {
    issues.push(issue("useOfFunds", "missing_use_of_funds", "A funding request requires a use-of-funds explanation.", "Explain how the requested capital will be allocated."));
  }
  return issues;
}

export function runDeterministicQualityCheck(draft: ApplicationDraft, rules: EligibilityRules, now = new Date()): ApplicationQualityResult {
  const { eligibility, mismatches } = checkEligibility(draft, rules, now);
  const issues = runRuleBasedValidation(draft);
  const answeredRequired = draft.requiredFields.filter((field) => normalized(draft.answers[field])).length;
  const completenessScore = draft.requiredFields.length ? Math.round((answeredRequired / draft.requiredFields.length) * 20) : 20;
  const meaningfulPenalty = issues.filter((item) => ["placeholder", "too_short", "duplicate_answer", "repeated_words", "repeated_characters", "mostly_symbols"].includes(item.code)).length;
  const meaningfulContentScore = Math.max(0, 15 - meaningfulPenalty * 3);
  const eligibilityMismatch = mismatches.length > 0;
  const qualityScore = Math.max(0, completenessScore + meaningfulContentScore);
  const status = eligibilityMismatch ? "eligibility_mismatch" : issues.length ? (completenessScore < 20 ? "incomplete" : "needs_revision") : "needs_revision";

  return {
    qualityScore,
    completenessScore,
    meaningfulContentScore,
    problemSolutionScore: 0,
    customerMarketScore: 0,
    businessModelScore: 0,
    validationTractionScore: 0,
    consistencyScore: 0,
    fundingClarityScore: 0,
    organisationFitScore: eligibilityMismatch ? 0 : 100,
    status,
    summary: eligibilityMismatch
      ? "The application does not currently meet every mandatory opportunity criterion."
      : issues.length
        ? "Correct the highlighted fields before semantic review."
        : "Deterministic checks passed. Semantic review is required before submission.",
    strengths: issues.length ? [] : ["Every required field contains reviewable content."],
    issues,
    fieldFeedback: issues,
    eligibility,
    eligibilityMismatches: mismatches,
    unsupportedClaims: [],
    contradictoryClaims: [],
    manualReviewReason: null,
    semanticReviewRequired: !eligibilityMismatch && issues.length === 0,
    checkedAt: now.toISOString()
  };
}
