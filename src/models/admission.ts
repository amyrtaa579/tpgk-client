export interface AdmissionSpecialtyModel {
  code: string;
  name: string;
  budget_places: number;
  paid_places: number;
  exams: string[];
  duration: string;
}

export interface SubmissionMethodModel {
  title: string;
  description: string;
  link?: string | null;
}

export interface ImportantDateModel {
  title: string;
  date: string;
  description?: string | null;
}

export interface AdmissionCampaignModel {
  year: number;
  specialties_admission: AdmissionSpecialtyModel[];
  submission_methods: SubmissionMethodModel[];
  important_dates: ImportantDateModel[];
}
