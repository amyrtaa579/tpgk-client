export interface DocumentListItemModel {
  id: number;
  title: string;
  category: string;
  file_url: string;
  file_size?: number | null;
  images: any[];
}
