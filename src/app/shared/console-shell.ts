import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EndpointDef, EndpointPanel } from './endpoint-panel';

export interface ConsoleSection {
  key: string;
  title: string;
  icon: string;
  service: string;
  endpoints: EndpointDef[];
}

/** Sidebar of sections + the selected section's endpoint panels (admin and partner consoles). */
@Component({
  selector: 'app-console-shell',
  imports: [RouterLink, RouterLinkActive, EndpointPanel],
  template: `
    <div class="container-xxl py-5">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-3">
                    <div class="bg-light rounded p-4 sticky-lg-top" style="top: 100px;">
                        <h5 class="mb-3">{{ heading() }}</h5>
                        <div class="list-group list-group-flush">
                            @for (s of sections(); track s.key) {
                                <a class="list-group-item list-group-item-action bg-transparent border-0 px-0 py-2" [routerLink]="[base(), s.key]"
                                   routerLinkActive="text-primary fw-bold">
                                    <i class="fa fa-fw text-primary me-2" [class]="s.icon"></i>{{ s.title }}
                                    <small class="d-block text-muted ms-4">{{ s.service }} &middot; {{ s.endpoints.length }} endpoints</small>
                                </a>
                            }
                        </div>
                    </div>
                </div>
                <div class="col-lg-9">
                    @if (current(); as s) {
                        <h3 class="mb-4"><i class="fa text-primary me-2" [class]="s.icon"></i>{{ s.title }}</h3>
                        @for (e of s.endpoints; track e.method + e.path + e.title) {
                            <app-endpoint-panel [def]="e" />
                        }
                    }
                </div>
            </div>
        </div>
    </div>
  `,
})
export class ConsoleShell {
  readonly heading = input.required<string>();
  readonly base = input.required<string>();
  readonly sections = input.required<ConsoleSection[]>();
  readonly section = input<string>();

  protected readonly current = computed(() => {
    const all = this.sections();
    return all.find(s => s.key === this.section()) ?? all[0];
  });
}
