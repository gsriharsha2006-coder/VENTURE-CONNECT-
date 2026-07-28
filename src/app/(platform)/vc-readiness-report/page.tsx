import { VcReadinessReportClient } from "@/components/product/VcReadinessReportClient";

export const dynamic = "force-dynamic";

export default function VcReadinessReportPage() {
  return (
    <VcReadinessReportClient
      developmentMode={process.env.NODE_ENV === "development"}
      openaiConfigured={Boolean(process.env.OPENAI_API_KEY?.trim())}
    />
  );
}
