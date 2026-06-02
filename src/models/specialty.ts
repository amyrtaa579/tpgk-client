export interface ImageModel {
  url: string;
  alt?: string | null;
  caption?: string | null;
}

export interface DocumentModel {
  url: string;
  alt?: string | null;
  caption?: string | null;
}

export interface EducationOptionModel {
  id: number;
  education_level: string;
  duration: string;
  budget_places: number;
  paid_places: number;
}

export interface InterestingFactPreviewModel {
  id: number;
  title: string;
}

export interface InterestingFactDetailModel {
  id: number;
  title: string;
  description: string[];
  images: ImageModel[];
}

export interface SpecialtyModel {
  id: number;
  code: string;
  name: string;
  short_description?: string | null;
}

export interface SpecialtyDetailModel {
  id: number;
  code: string;
  name: string;
  short_description?: string | null;
  description: string[];
  exams: string[];
  images: ImageModel[];
  documents: DocumentModel[];
  education_options: EducationOptionModel[];
  interesting_facts_preview: InterestingFactPreviewModel[];
}

export interface SpecialtiesResponseModel {
  total: number;
  page: number;
  limit: number;
  items: SpecialtyModel[];
}
