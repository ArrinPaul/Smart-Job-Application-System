import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, from } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap, mergeMap, toArray } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Job } from '../models/job.model';

type LibreTranslateResponse = {
  translatedText?: string;
  detectedLanguage?: {
    confidence?: number;
    language?: string;
  };
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly baseUrl = (environment.translationApiUrl || 'https://libretranslate.de').replace(/\/$/, '');
  private readonly targetLanguage = (environment.translationTarget || 'en').trim() || 'en';
  private readonly enabled = environment.translationEnabled !== false && this.baseUrl.length > 0;
  private readonly cache = new Map<string, string>();
  private readonly inFlight = new Map<string, Observable<string>>();

  constructor(private http: HttpClient) {}

  /**
   * Translates a single string
   */
  translateText(text: string | null | undefined): Observable<string> {
    const normalized = (text || '').toString().trim();
    if (!normalized || !this.enabled) {
      return of(text || '');
    }

    const cacheKey = `${this.targetLanguage}::${normalized}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return of(cached);
    }

    const pending = this.inFlight.get(cacheKey);
    if (pending) {
      return pending;
    }

    // LibreTranslate /translate endpoint
    const request$ = this.http.post<LibreTranslateResponse>(`${this.baseUrl}/translate`, {
      q: normalized,
      source: 'auto',
      target: this.targetLanguage,
      format: 'text'
    }).pipe(
      map(response => {
        const result = (response?.translatedText || normalized).trim();
        if (!environment.production && result !== normalized) {
          console.log(`[Translation] "${normalized.slice(0, 30)}..." -> "${result.slice(0, 30)}..."`);
        }
        return result;
      }),
      catchError(err => {
        if (!environment.production) {
          console.error(`[Translation Failed] for "${normalized.slice(0, 20)}...":`, err.message || err);
        }
        return of(normalized);
      }),
      tap(result => {
        if (result && result !== normalized) {
          this.cache.set(cacheKey, result);
        }
      }),
      finalize(() => this.inFlight.delete(cacheKey)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.inFlight.set(cacheKey, request$);
    return request$;
  }

  /**
   * Translates a full Job object
   */
  translateJob(job: Job | null | undefined): Observable<Job | null> {
    if (!job || !this.enabled) {
      return of(job || null);
    }

    // Fields to translate
    const fields = [
      { key: 'title', value: job.title },
      { key: 'description', value: job.description },
      { key: 'location', value: job.location },
      { key: 'jobType', value: job.jobType || '' },
      { key: 'workType', value: job.workType || '' },
      { key: 'requiredSkills', value: job.requiredSkills || '' },
      { key: 'educationRequired', value: job.educationRequired || '' },
      { key: 'howToApply', value: job.howToApply || '' }
    ];

    // Filter out empty fields and those already in cache
    const toTranslate = fields.filter(f => f.value && f.value.trim().length > 0);
    
    if (toTranslate.length === 0) {
      return of(job);
    }

    // We use forkJoin for the fields to benefit from the string-level cache
    const translations$ = toTranslate.map(f => 
      this.translateText(f.value).pipe(
        map(translated => ({ key: f.key, original: f.value, translated }))
      )
    );

    return forkJoin(translations$).pipe(
      map(results => {
        const translatedJob = { ...job } as any;
        results.forEach(res => {
          translatedJob[res.key] = this.pickTranslatedValue(res.original, res.translated);
        });
        return translatedJob as Job;
      }),
      catchError(() => of(job))
    );
  }

  /**
   * Translates a list of jobs with a concurrency limit to avoid rate limiting
   */
  translateJobs(jobs: Job[] | null | undefined): Observable<Job[]> {
    if (!jobs || !jobs.length || !this.enabled) {
      return of(jobs || []);
    }

    // Process jobs in small batches (concurrency of 3) to avoid overwhelming the translation API
    return from(jobs).pipe(
      mergeMap(job => this.translateJob(job).pipe(map(translated => translated || job)), 3),
      toArray(),
      // Ensure we maintain original order (mergeMap doesn't guarantee order unless we use concatMap)
      // Actually mergeMap with toArray will emit in order of completion.
      // Let's use map with index to restore order if needed, but for now this is much safer.
      map(translatedJobs => {
        // Simple order restoration by matching IDs
        return jobs.map(original => translatedJobs.find(t => t.id === original.id) || original);
      })
    );
  }

  private pickTranslatedValue(original: string | undefined, translated: string): string {
    const fallback = (original || '').toString().trim();
    const cleanTranslated = (translated || '').trim();

    if (!fallback) return cleanTranslated;
    if (!cleanTranslated || cleanTranslated === fallback) return fallback;
    
    return cleanTranslated;
  }
}