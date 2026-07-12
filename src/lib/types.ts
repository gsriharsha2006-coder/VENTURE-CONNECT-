export type UserRole =
  | "Founder"
  | "Investor"
  | "Incubator"
  | "Hackathon Organizer"
  | "Event Organizer"
  | "Service Provider"
  | "Admin";

export type SubscriptionPlan = "Free" | "Student Pro" | "Founder Pro";

/** Backward-compatible alias for older API routes. */
export type PlanTier = SubscriptionPlan | "Starter" | "Growth";

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "expired" | "trialing";

export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refunded";

export type ConversationStatus = "active" | "archived" | "closed";

export type MessageType = "text" | "file" | "meeting_link" | "system" | "feedback";

export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export type StartupStage = "Idea" | "Prototype" | "MVP" | "Revenue" | "Seed";

export type IdeaStatus = "Draft" | "In Progress" | "Complete";

export type WorkspaceTemplate =
  | "startup"
  | "ai-project"
  | "hackathon"
  | "saas"
  | "marketing"
  | "student-project"
  | "custom";

export type WorkspaceVisibility = "private" | "application_only";

export type ReportType =
  | "Basic SWOT Report"
  | "Premium SWOT Analysis"
  | "Full Brief Report"
  | "Bottleneck Report"
  | "Competitor Defensive Report"
  | "Roadmap Report"
  | "Investor Scorecard Report";

export type ReportTier = "free" | "premium";

export type ReportSection = {
  title: string;
  body?: string;
  items?: string[];
  score?: number;
};

export type VcReportContent = {
  tier: ReportTier;
  reportType: ReportType;
  planRequired: SubscriptionPlan;
  overallScore: number;
  finalRecommendation?: "Not Ready" | "Needs Validation" | "Incubator Ready" | "Investor Conversation Ready" | "Strong Candidate";
  sections: ReportSection[];
  improvementSuggestions: string[];
  generatedAt: string;
};

export type Profile = {
  id: string;
  user_id?: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  plan: SubscriptionPlan;
  trust_score?: number;
  verification_status?: "Pending" | "Verified" | "Rejected" | "Suspended";
  avatar_url?: string;
  razorpay_customer_id?: string;
  free_report_used: boolean;
  reports_used_this_month: number;
  opportunity_submissions_used?: number;
  reports_month_reset?: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  start_date?: string;
  started_at?: string;
  end_date?: string;
  expires_at?: string;
  report_count_used?: number;
  opportunity_submissions_used?: number;
  free_swot_used?: boolean;
};

export type Payment = {
  id: string;
  user_id: string;
  amount: number;
  razorpay_payment_id?: string;
  status: PaymentStatus;
  created_at: string;
};

export type Conversation = {
  id: string;
  founder_id: string;
  investor_id: string;
  startup_idea_id?: string;
  application_id?: string;
  submission_id?: string;
  status: ConversationStatus;
  unlockedForFounder: boolean;
  created_at: string;
  updated_at: string;
  founder?: Profile;
  investor?: Profile;
  workspace?: { id: string; name: string; template?: WorkspaceTemplate };
  last_message?: ChatMessage;
  unread_count?: number;
};

export type ChatMessage = {
  id: string;
  conversation_id?: string;
  application_id?: string;
  sender_id: string;
  receiver_id?: string;
  sender_role: UserRole;
  message_type: MessageType;
  message?: string;
  body?: string;
  meeting_link?: string;
  meeting_time?: string;
  is_locked_for_free_user?: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_mime?: string;
  read_at?: string;
  read_status?: "unread" | "read";
  created_at: string;
};

export type Meeting = {
  id: string;
  conversation_id: string;
  meeting_link: string;
  scheduled_time: string;
  notes?: string;
  created_by: string;
  status: MeetingStatus;
  created_at: string;
};

export type SubmissionStatus = ApplicationStatus;

export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Saved by Investor"
  | "Interested"
  | "Rejected"
  | "Shortlisted";

export type WorkspaceVersion = {
  id: string;
  versionNumber: number;
  sections: Record<string, string>;
  createdAt: string;
  summary?: string;
};

export type IdeaWorkspaceItem = {
  id: string;
  founder_id?: string;
  name: string;
  template: WorkspaceTemplate;
  title?: string;
  status: IdeaStatus;
  stage: StartupStage;
  visibility: WorkspaceVisibility;
  tags: string[];
  category: string;
  updatedAt: string;
  created_at?: string;
  sections: Record<string, string>;
  video_link?: string;
  uploads: string[];
  versionHistory: WorkspaceVersion[];
  archived: boolean;
  summary: string;
  markdown: string;
  uniqueness: number;
  demand: number;
  scalability: number;
  competition: string;
  versions: number;
};

export type OpportunityType =
  | "Investor opportunity"
  | "Incubator program"
  | "Accelerator program"
  | "Hackathon"
  | "Startup event"
  | "Company challenge/debug challenge"
  | "Grants"
  | "Competitions"
  | "Fellowships"
  | "AI challenges";

export type OpportunityMode = "Remote" | "Hybrid" | "Offline";

export type DomainTag =
  | "AI"
  | "SaaS"
  | "FinTech"
  | "HealthTech"
  | "EdTech"
  | "DeepTech"
  | "AgriTech"
  | "Consumer"
  | "Social Impact";

export type Opportunity = {
  id: string;
  created_by?: string;
  creator_role: Exclude<UserRole, "Founder" | "Service Provider" | "Admin"> | "Admin";
  title: string;
  organizer_name: string;
  organizer_type: string;
  opportunity_type: OpportunityType;
  category: string;
  prize_or_funding: string;
  deadline: string;
  eligibility: string;
  guidelines: string;
  benefits: string;
  requirements: string[];
  tags: string[];
  location: string;
  mode: OpportunityMode;
  verified: boolean;
  trending: boolean;
  beginnerLevel: "Beginner" | "Intermediate" | "Advanced";
  startupStage: StartupStage | "Any";
  domain: DomainTag;
  trust_score: number;
  saved: boolean;
  external_link?: string;
  contact_email?: string;
  /** Compatibility for older cards/routes. Prefer organizer_name. */
  organization?: string;
  /** Compatibility for older cards/routes. Prefer opportunity_type. */
  type?: string;
  /** Compatibility for older cards/routes. Prefer prize_or_funding. */
  funding?: string;
  /** Compatibility for older cards/routes. */
  applicants?: number;
  /** Compatibility for older cards/routes. Prefer saved. */
  bookmarked?: boolean;
  /** Compatibility for older cards/routes. Prefer guidelines/benefits. */
  description?: string;
  /** Compatibility for older cards/routes. */
  premium?: boolean;
};

export type Application = {
  id: string;
  founder_id?: string;
  opportunity_id?: string;
  idea_workspace_id?: string | null;
  startup: string;
  founder: string;
  reviewer: string;
  investor?: string;
  opportunity: string;
  opportunityType: OpportunityType;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  packet: string[];
  timeline: Array<{ label: ApplicationStatus | "Meeting Created"; date: string; complete: boolean }>;
};

export type NotificationType =
  | "Investor Interested"
  | "New Message"
  | "Meeting Scheduled"
  | "Document Request"
  | "Founder Reply"
  | "Document Uploaded"
  | "Meeting Update"
  | "Report Ready"
  | "Application Update"
  | "Provider Verification"
  | "Opportunity Posted";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export type PlatformNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type Entitlements = {
  plan: SubscriptionPlan;
  messagingEnabled: boolean;
  allTemplatesEnabled: boolean;
  premiumReportsPerMonth: number;
  reportsRemaining: number;
  freeReportAvailable: boolean;
  workspacesLimit: number | "unlimited";
  opportunitySubmissionsPerMonth: number;
  reportTypes: ReportType[];
};

export type ServiceCategory =
  | "Patent filing"
  | "Trademark registration"
  | "Company registration"
  | "GST/tax filing"
  | "ROC compliance"
  | "Legal documentation"
  | "Pitch deck design"
  | "Financial modeling"
  | "Startup compliance"
  | "Product development"
  | "Marketing services";

export type ServiceVerificationStatus = "Pending" | "Verified" | "Rejected" | "Suspended";

export type ServiceProvider = {
  id: string;
  user_id: string;
  name: string;
  firm_name: string;
  email: string;
  phone: string;
  service_category: ServiceCategory;
  pan_or_gst: string;
  website_or_linkedin: string;
  experience_details: string;
  certificate_url?: string;
  cgpdtm_registration_number?: string;
  verification_status: ServiceVerificationStatus;
  venture_connect_verified: boolean;
  cgpdtm_checked: boolean;
  verification_date?: string;
  created_at: string;
};

export type ServicePost = {
  id: string;
  provider_id: string;
  title: string;
  category: ServiceCategory;
  description: string;
  guide_info: string;
  original_price: number;
  listed_price: number;
  contact_info: string;
  external_link: string;
  created_at: string;
};

export type ServiceRequest = {
  id: string;
  founder_id: string;
  provider_id: string;
  service_post_id: string;
  status: "Requested" | "Accepted" | "Rejected" | "Quotation Sent";
  quotation?: string;
  created_at: string;
};

export type StartupProfile = {
  id: string;
  name: string;
  logo: string;
  founder: string;
  role: string;
  university: string;
  stage: StartupStage;
  industry: string;
  location: string;
  fundingStatus: string;
  ask: string;
  traction: string;
  deckStatus: string;
  demoVideo: string;
  readiness: number;
  monthlyGrowth: string;
  activeUsers: string;
  retention: string;
  website: string;
  linkedIn: string;
  category: string;
  shortDescription: string;
  views: number;
};

export type Investor = {
  id: string;
  name: string;
  firm: string;
  designation: string;
  thesis: string;
  sectors: string[];
  stage: string;
  geography: string;
  ticketSize: string;
  badge: string;
  portfolio: string[];
  matchScore: number;
  verified: boolean;
};

export type AiReport = {
  readiness: number;
  overallScore: number;
  startupScore: number;
  market: string;
  validation: string;
  recommendation: "Investable" | "Needs Work" | "Watchlist";
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  tamSamSom: { tam: string; sam: string; som: string };
  competitors: string[];
  nextSteps: string[];
  scorecard: Array<{
    label: string;
    value: number;
    status: "Excellent" | "Strong" | "Developing" | "Risk";
  }>;
};

export type ReportSuiteItem = {
  id: string;
  title: ReportType;
  subtitle: string;
  plan: SubscriptionPlan;
  pages: string;
  sections: string[];
  score: number;
  locked?: boolean;
};

export type MessageThread = {
  id: string;
  investor: string;
  firm: string;
  startup: string;
  status: "Interested" | "Feedback only" | "Meeting proposed";
  lastMessage: string;
  badge: string;
  unread: boolean;
  founderPlan: SubscriptionPlan;
  meetingLink?: string;
  meetingTime?: string;
};

export type PricingTier = {
  name: SubscriptionPlan;
  price: string;
  priceAmount: number;
  description: string;
  features: string[];
  highlighted: boolean;
  razorpayPlanId?: string;
};

export type BlogCategory = "Fundraising" | "AI" | "Startup" | "Product" | "Marketing" | "Technology" | "Venture Capital" | "News";
export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  role: UserRole;
  category: BlogCategory;
  likes: number;
  bookmarks: number;
  comments: string[];
  publishedAt: string;
};

export type FeedPostType = "Startup idea" | "Funding update" | "Product launch" | "Hackathon win" | "Founder story";
export type FeedPost = {
  id: string;
  author: string;
  role: UserRole;
  university?: string;
  company?: string;
  type: FeedPostType;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  comments: number;
  score: number;
  postedAt: string;
};
