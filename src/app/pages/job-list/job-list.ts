import { Component, computed, input } from '@angular/core';
import { JobSearchCriteria } from '../../core/models/api.models';
import { categoryName } from '../../core/models/categories';
import { PageHeader } from '../../layout/page-header';
import { JobListing } from '../../shared/job-listing';
import { SearchBar } from '../../shared/search-bar';

/** /jobs - the template's Job List page, driven by query params (?keyword=&categoryCode=&city=&contractType=). */
@Component({
  selector: 'app-job-list',
  imports: [PageHeader, SearchBar, JobListing],
  template: `
    <app-page-header [title]="heading()" crumb="Job List" section="Jobs" sectionLink="/jobs" />
    <app-search-bar [criteria]="criteria()" />
    <app-job-listing [criteria]="criteria()" [pageSize]="10" [paged]="true" />
  `,
})
export class JobList {
  // Bound from the query string by withComponentInputBinding().
  readonly keyword = input<string>();
  readonly categoryCode = input<string>();
  readonly city = input<string>();
  readonly governorate = input<string>();
  readonly contractType = input<string>();

  protected readonly criteria = computed<JobSearchCriteria>(() => ({
    keyword: this.keyword() ?? null,
    categoryCode: this.categoryCode() ?? null,
    city: this.city() ?? null,
    governorate: this.governorate() ?? null,
    contractType: this.contractType() ?? null,
  }));

  protected readonly heading = computed(() => {
    const code = this.categoryCode();
    return code ? categoryName(code) : 'Job List';
  });
}
