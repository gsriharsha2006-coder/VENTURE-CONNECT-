import type {
  ApplicationAnswerValue,
  ApplicationDraft,
  ApplicationQualityCorrection,
  ApplicationQualityResult,
  EligibilityMismatch,
  EligibilityRules
} from "./types";

type RuleIssue = ApplicationQualityCorrection & {
  code: "required" | "too_short" | "placeholder" | "random_text" | "repeated_answer" | "invalid_url";
  penalty: number;
};

const PLACEHOLDER_VALUES = new Set([
  "tbd", "n/a", "na", "test", "testing", "lorem ipsum", "coming soon", "sample", "sample text", "xyz", "asdf"
]);

const FIELD_LABELS: Record<string, string> = {
  startupName: "Startup Name",
  founderName: "Founder Name",
  sector: "Sector",
  startupStage: "Startup Stage",
  founderLocation: "Founder Location",
  problem: "Problem Statement",
  solution: "Solution",
  targetCustomer: "Target Customer",
  marketOpportunity: "Market Opportunity",
  businessModel: "Business Model",
  competitors: "Competitors and Alternatives",
  differentiation: "Product Differentiation",
  productTechnology: "Product and Technology",
  customerValidation: "Customer Validation",
  traction: "Traction",
  goToMarket: "Go-to-Market Strategy",
  team: "Team",
  fundingRequirement: "Funding Requirement",
  useOfFunds: "Use of Funds",
  risks: "Risks and Assumptions",
  website: "Website",
  pitchDeck: "Pitch-deck Link",
  organisationQuestions: "Organisation-specific Questions"
};

const NARRATIVE_MINIMUMS: Record<string, number> = {
  problem: 40,
  solution: 40,
  targetCustomer: 20,
  marketOpportunity: 25,
  businessModel: 25,
  competitors: 15,
  differentiation: 25,
  productTechnology: 25,
  customerValidation: 20,
  traction: 12,
  goToMarket: 25,
  team: 15,
  useOfFunds: 25,
  risks: 20,
  organisationQuestions: 20
};

const LINK_FIELD_PATTERN = /(url|website|github|demo|portfolio|pitch.?deck|link)$/i;
const KEYBOARD_PATTERN = /(qwerty|asdfgh|hjkl|zxcv|uiop)/i;

export function applicationFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (value) => value.toUpperCase());
}

function asText(value: ApplicationAnswerValue) {
  if (Array.isArray(value)) return value.join(" ").trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return value?.trim() ?? "";
}

function normalized(value: ApplicationAnswerValue) {
  return asText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isRandomText(text: string, field: string) {
  if (LINK_FIELD_PATTERN.test(field)) return false;
  const compact = text.replace(/\s/g, "");
  if (KEYBOARD_PATTERN.test(compact)) return true;
  if (/([^a-z0-9\s])\1{3,}/i.test(text)) return true;
  if (/^(?:[^a-z0-9]*[a-z]){0,2}[^a-z0-9]{5,}$/i.test(text)) return true;
  if (/^[a-z0-9]{8,}$/i.test(compact) && /[a-z]/i.test(compact) && /\d/.test(compact)) {
    const letters = compact.match(/[a-z]/gi) ?? [];
    const vowels = compact.match(/[aeiou]/gi) ?? [];
    return letters.length > 0 && vowels.length / letters.length < 0.16;
  }
  return false;
}

function comparableWords(text: string) {
  return new Set(normalized(text).split(" ").filter((word) => word.length > 2));
}

function essentiallySame(left: string, right: string) {
  const a = comparableWords(left);
  const b = comparableWords(right);
  if (a.size < 8 || b.size < 8) return normalized(left) === normalized(right) && normalized(left).length >= 40;
  const shared = [...a].filter((word) => b.has(word)).length;
  return shared / Math.max(a.size, b.size) >= 0.9;
}

function includesCaseInsensitive(values: string[] | undefined, candidate: string) {
  if (!values?.length) return true;
  const target = candidate.trim().toLowerCase();
  return values.some((value) => value.trim().toLowerCase() === target);
}

function mismatch(field: string, requirement: string, expected: string, actual: string): EligibilityMismatch {
  return { field, requirement, expected, actual: actual || "Not provided" };
}

export function checkEligibility(draft: ApplicationDraft, rules: EligibilityRules, now = new Date()) {
  const mismatches: EligibilityMismatch[] = [];
  if (!includesCaseInsensitive(rules.acceptedSectors, draft.sector)) {
    mismatches.push(mismatch("sector", "Sector or category", rules.acceptedSectors!.join(" or "), draft.sector));
  }
  if (rules.acceptedStages?.length && !rules.acceptedStages.includes(draft.startupStage)) {
    mismatches.push(mismatch("startupStage", "Startup stage", rules.acceptedStages.join(" or "), draft.startupStage));
  }
  if (!includesCaseInsensitive(rules.acceptedGeographies, draft.geography)) {
    mismatches.push(mismatch("founderLocation", "Geography", rules.acceptedGeographies!.join(" or "), draft.geography));
  }
  if (rules.eligibleColleges?.length && !includesCaseInsensitive(rules.eligibleColleges, draft.college ?? "")) {
    mismatches.push(mismatch("college", "Eligible institution", rules.eligibleColleges.join(" or "), draft.college ?? ""));
  }
  if (rules.studentOnly === true && draft.isStudent !== true) {
    mismatches.push(mismatch("isStudent", "Student applicant", "Current student", draft.isStudent === false ? "Not a student" : "Not provided"));
  }
  const deadlineTimestamp = rules.deadline && /^\d{4}-\d{2}-\d{2}$/.test(rules.deadline)
    ? Date.parse(`${rules.deadline}T23:59:59.999Z`)
    : Date.parse(rules.deadline ?? "");
  if (rules.deadline && !Number.isNaN(deadlineTimestamp) && deadlineTimestamp < now.getTime()) {
    mismatches.push(mismatch("deadline", "Application deadline", `On or before ${rules.deadline}`, now.toISOString()));
  }
  return mismatches;
}

function ruleIssue(field: string, code: RuleIssue["code"], issue: string, correction: string, penalty: number): RuleIssue {
  return { field, code, issue, correction, penalty };
}

export function runRuleBasedValidation(draft: ApplicationDraft): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const required = new Set(draft.requiredFields);
  const narrativeAnswers: Array<[string, string]> = [];

  draft.requiredFields.forEach((field) => {
    if (!asText(draft.answers[field])) {
      const label = applicationFieldLabel(field);
      issues.push(ruleIssue(field, "required", `${label} is missing.`, `Complete ${label} before rechecking.`, 14));
    }
  });

  Object.entries(draft.answers).forEach(([field, value]) => {
    const text = asText(value);
    const clean = normalized(value);
    if (!clean) return;
    const notApplicable = clean === "n a" || clean === "na";
    if (notApplicable && !required.has(field)) return;
    let unusable = false;

    if ((PLACEHOLDER_VALUES.has(clean) && !notApplicable) || (required.has(field) && notApplicable)) {
      issues.push(ruleIssue(field, "placeholder", `${applicationFieldLabel(field)} contains placeholder content.`, "Replace the placeholder with application-specific information.", 10));
      unusable = true;
    } else if (isRandomText(text, field)) {
      issues.push(ruleIssue(field, "random_text", `${applicationFieldLabel(field)} appears to contain meaningless text.`, "Replace it with a clear answer relevant to this field.", 10));
      unusable = true;
    }

    const minimum = NARRATIVE_MINIMUMS[field];
    if (minimum && text.length < minimum && !unusable) {
      issues.push(ruleIssue(field, "too_short", `${applicationFieldLabel(field)} is too short to communicate useful information.`, `Add enough specific context for an organisation reviewer to understand ${applicationFieldLabel(field).toLowerCase()}.`, 6));
    }
    if (LINK_FIELD_PATTERN.test(field) && !isValidHttpUrl(text)) {
      issues.push(ruleIssue(field, "invalid_url", `${applicationFieldLabel(field)} is not a valid HTTP or HTTPS URL.`, "Enter a complete URL beginning with http:// or https://.", 6));
    }
    if (minimum && text.length >= 40) narrativeAnswers.push([field, text]);
  });

  for (let index = 0; index < narrativeAnswers.length; index += 1) {
    const [field, answer] = narrativeAnswers[index];
    const duplicate = narrativeAnswers.slice(0, index).find(([, previous]) => essentiallySame(answer, previous));
    if (duplicate) {
      issues.push(ruleIssue(field, "repeated_answer", `${applicationFieldLabel(field)} repeats essentially the same answer as ${applicationFieldLabel(duplicate[0])}.`, `Provide information specific to ${applicationFieldLabel(field).toLowerCase()}.`, 8));
    }
  }

  return issues;
}

export function runDeterministicQualityCheck(draft: ApplicationDraft, rules: EligibilityRules, now = new Date()): ApplicationQualityResult {
  const corrections = runRuleBasedValidation(draft);
  const eligibilityMismatches = checkEligibility(draft, rules, now);
  const missingRequired = corrections.some((item) => item.code === "required");
  const unusableRequired = corrections.filter((item) => (item.code === "placeholder" || item.code === "random_text") && draft.requiredFields.includes(item.field)).length;
  const score = Math.max(0, Math.min(100, 100 - corrections.reduce((total, item) => total + item.penalty, 0)));
  const status = eligibilityMismatches.length
    ? "eligibility_mismatch"
    : missingRequired || unusableRequired >= 2
      ? "incomplete"
      : corrections.length
        ? "needs_revision"
        : "needs_revision";
  const semanticReviewRequired = eligibilityMismatches.length === 0 && corrections.length === 0;
  const majorIssues = eligibilityMismatches.length
    ? eligibilityMismatches.slice(0, 3).map((item) => `${item.requirement} requires ${item.expected}; the application shows ${item.actual}.`)
    : corrections.slice(0, 3).map((item) => item.issue);

  return {
    status,
    score: eligibilityMismatches.length ? Math.min(score, 60) : score,
    summary: eligibilityMismatches.length
      ? "The application does not match one or more explicitly configured opportunity requirements."
      : corrections.length
        ? "Correct the highlighted application fields before submission."
        : "Rule-based checks passed. Meaning-based review is required before submission.",
    strengths: corrections.length || eligibilityMismatches.length ? [] : ["All required fields contain reviewable content."],
    majorIssues,
    corrections: corrections.slice(0, 3).map(({ field, issue, correction }) => ({ field, issue, correction })),
    eligibilityMismatches,
    manualReviewReason: null,
    semanticReviewRequired,
    checkedAt: now.toISOString()
  };
}
