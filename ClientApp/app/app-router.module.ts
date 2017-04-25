﻿import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FrontpageComponent } from './frontpage/frontpage.component';
import { JobsComponent } from './jobs/jobs.component';

const routes: Routes = [
    { path: '', redirectTo: 'frontpage', pathMatch: 'full' },
    { path: 'frontpage', component: FrontpageComponent },
    { path: 'jobs', component: JobsComponent },
    { path: '**', redirectTo: 'frontpage' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }

export const routingComponents = [FrontpageComponent, JobsComponent]