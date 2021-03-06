﻿import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class UtilService {
    public alert: BehaviorSubject<{ type: string, titel: string, message: string }> = new BehaviorSubject({ type: null, titel: null, message: null });
    public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public showSidemenu: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public static readonly taskTypes = [
        "Branding",
        "Events",
        "Grafik og design",
        "Markedsanalyse",
        "Målgruppeanalyse",
        "Online marketing og kommunikation",
        "PR",
        "Strategi",
        "Tektforfatning",
        "Video/Billede",
        "Andet"
    ];
    public dataArray: any = {};

    displayLoading(value: boolean) {
        setTimeout(() => {
            this.loading.next(value);
        });
    }

    displaySideMenu(value: boolean) {
        setTimeout(() => {
            this.showSidemenu.next(value);
        });
    }
}