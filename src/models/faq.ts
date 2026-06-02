import { ImageModel, DocumentModel } from './specialty';

export interface FAQModel {
  id: number;
  question: string;
  answer: string[];
  category: string;
  show_in_admission: boolean;
  images: ImageModel[];
  documents: DocumentModel[];
  document_file_ids: number[];
}
