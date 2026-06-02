export interface ImageModel {
  url: string;
  alt?: string | null;
  caption?: string | null;
}

export interface AboutCollegeModel {
  title: string;
  description: string[];
  images: ImageModel[];
}
