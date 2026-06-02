import { config } from '../config/settings';
import { AboutCollegeModel } from '../models/about';
import { AdmissionCampaignModel } from '../models/admission';
import { DocumentListItemModel } from '../models/document';
import { FAQModel } from '../models/faq';
import {
  InterestingFactDetailModel,
  InterestingFactPreviewModel,
  SpecialtiesResponseModel,
  SpecialtyDetailModel,
} from '../models/specialty';
import { TestQuestionModel } from '../models/test';

export class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.apiUrl.replace(/\/+$/, '');
    this.timeout = config.apiTimeout;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, '')}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new APIError(`API returned ${response.status}: ${text}`, response.status);
      }

      return await response.json() as T;
    } catch (err: any) {
      console.error("DEBUG API ERROR:", err);

      if (err instanceof APIError) throw err;
      if (err.name === 'AbortError') {
        throw new APIError('Request timeout');
      }
      throw new APIError(`Network error: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', endpoint, params);
  }

  // === API Methods ===

  async getAboutCollege(): Promise<AboutCollegeModel> {
    return this.get<AboutCollegeModel>('/api/v1/about');
  }

  async getSpecialties(params?: {
    page?: number;
    limit?: number;
    search?: string;
    form?: string;
    popular?: boolean;
  }): Promise<SpecialtiesResponseModel> {
    return this.get<SpecialtiesResponseModel>('/api/v1/specialties', params);
  }

  async getSpecialtyByCode(code: string): Promise<SpecialtyDetailModel> {
    return this.get<SpecialtyDetailModel>(`/api/v1/specialties/${code}`);
  }

  async getSpecialtyFacts(code: string): Promise<InterestingFactPreviewModel[]> {
    return this.get<InterestingFactPreviewModel[]>(`/api/v1/specialties/${code}/facts`);
  }

  async getFactById(factId: number): Promise<InterestingFactDetailModel> {
    return this.get<InterestingFactDetailModel>(`/api/v1/facts/${factId}`);
  }

  async getAdmissionCampaign(year?: number): Promise<AdmissionCampaignModel> {
    const params: Record<string, any> = {};
    if (year !== undefined) params.year = year;
    return this.get<AdmissionCampaignModel>('/api/v1/admission', params);
  }

  async getFaq(category?: string): Promise<FAQModel[]> {
    const params: Record<string, any> = {};
    if (category) params.category = category;
    return this.get<FAQModel[]>('/api/v1/faq', params);
  }

  async getDocumentsList(): Promise<DocumentListItemModel[]> {
    return this.get<DocumentListItemModel[]>('/api/v1/documents');
  }

  async getTestQuestions(): Promise<TestQuestionModel[]> {
    const data = await this.get<TestQuestionModel[]>('/api/v1/test/questions');
    return data.sort((a, b) => a.id - b.id);
  }
}
