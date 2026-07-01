export interface ConversionFunnel {
  registered: number;
  applied: number;
  uploadedDocuments: number;
  accepted: number;
  enrolled: number;
}

export interface AnalyticsSnapshot {
  funnel: ConversionFunnel;
  applicationsByStatus: { status: string; count: number }[];
  documentsByStatus: { status: string; count: number }[];
  registrationsByDay: { date: string; count: number }[];
}
