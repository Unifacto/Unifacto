﻿import { Component } from '@angular/core';

@Component({
    selector: 'job-list',
    templateUrl: './job-list.component.html',
    styleUrls: ['./job-list.component.css', '../../sharedStyles.css']
})
export class ExampleComponent {
    constructor() {
        this.name = 'Sam';
    }
}