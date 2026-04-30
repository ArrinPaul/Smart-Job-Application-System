import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * JobCardComponent
 * - Accepts a `job` object (or raw markdown string via `markdown`) and renders a safe HTML description
 * - Fixes common character-encoding mojibake (e.g. â€” -> —)
 */
@Component({
  selector: 'app-job-card',
  templateUrl: './job-card.component.html',
  styleUrls: ['./job-card.component.css']
})
export class JobCardComponent implements OnChanges {
  @Input() job: any | null = null; // minimal, accepts whatever shape the backend provides
  @Input() markdown?: string; // optional markdown override

  previewText = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] || changes['markdown']) {
      const md = (this.markdown !== undefined) ? this.markdown : (this.job?.description || '');
      this.previewText = this.buildPreviewText(md);
    }
  }

  private buildPreviewText(md: string): string {
    const normalized = this.normalizeMarkdown(this.fixEncoding(md || ''));
    const plainText = normalized
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#+\s+/gm, ' ')
      .replace(/\n#+\s+/g, ' ')
      .replace(/#/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[\*_]{1,3}/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const deduped = this.removeLeadingDupes(plainText);
    return deduped || 'View role details';
  }

  private removeLeadingDupes(input: string): string {
    return input.replace(/^(\b\w+(?:\s+\w+){1,6})\s+\1(\s+\1)*/i, '$1');
  }

  private fixEncoding(input: string): string {
    if (!input) return input;
    // Common mojibake fixes and whitespace cleanup
    return input
      .replace(/\u00e2\u0080\u0094|â€”|â\u0000\u000a|â\u000a/g, '—')
      .replace(/\u00e2\u0080\u0093|â€“/g, '–')
      .replace(/\u00e2\u0080\u0099|\u00e2\u0080\u0098|â€™|â€˜/g, "'")
      .replace(/\u00e2\u0080\u009c|\u00e2\u0080\u009d|â€œ|â€"/g, '"')
      .replace(/\u00e2\u0080\u00a6/g, '...')
      .replace(/\u00c3\u00a9|Ã©/g, 'é')
      .replace(/\u00c3\u00b1|Ã±/g, 'ñ')
      .replace(/\u00c2|Â/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
  }

  private normalizeMarkdown(input: string): string {
    if (!input) return input;

    let out = input
      .replace(/\r\n/g, '\n')
      .replace(/\\n/g, '\n');

    out = out.replace(/\*\*(Position|Location|Employment Type|Description|The Role|Key Skills|Responsibilities)\*\*:/gi, '$1:');

    out = out
      .replace(/([^\n])\s*(#{1,6})\s+/g, '$1\n\n$2 ')
      .replace(/(##\s+[^\n]*?)\s+(We|Our|You|This|They|The)\b/g, '$1\n\n$2')
      .replace(/(##\s+[^\n]*?)\s+(Position|Location|Employment Type):/gi, '$1\n\n$2:')
      .replace(/([^\n])\s+(Position|Location|Employment Type):/gi, '$1\n$2:')
      .replace(/([^\n])\s*(Description|The Role|Key Skills|Responsibilities):/gi, '$1\n$2:')
      .replace(/(^|\n)\s*•\s+/g, '$1- ')
      .replace(/\s+•\s+/g, '\n- ')
      .replace(/([\S])\s+-\s+/g, '$1\n- ')
      .replace(/\n{3,}/g, '\n\n');

    out = out.replace(/^(Position|Location|Employment Type):/gmi, '- $1:');

    const lines = out.split('\n');
    const seenHeadings = new Set<string>();
    const cleaned: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        cleaned.push('');
        continue;
      }

      const headingMatch = trimmed.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const headingText = headingMatch[1].trim();
        const headingKey = headingText.toLowerCase();

        for (let idx = cleaned.length - 1; idx >= 0; idx -= 1) {
          const previous = cleaned[idx].trim();
          if (!previous) continue;
          if (previous.toLowerCase() === headingKey) {
            cleaned.splice(idx, 1);
          }
          break;
        }

        if (seenHeadings.has(headingKey)) {
          continue;
        }

        seenHeadings.add(headingKey);
      }

      cleaned.push(line);
    }

    return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  getCompany(): string {
    return this.job?.companyName || this.job?.company_name || this.job?.postedBy?.companyName || '';
  }

  getTitle(): string {
    return this.job?.title || this.job?.name || 'Untitled';
  }

  getLocation(): string {
    return this.job?.location || this.job?.candidate_required_location || 'Remote';
  }
}
