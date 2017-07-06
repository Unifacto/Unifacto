﻿import { Component, OnInit, Pipe, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { BusinessService } from '../../services/business.service';
import { UtilService } from '../../services/util.service';
import { Business } from '../../model/business';
import { Task } from '../../model/task';
import * as moment from 'moment';

import { TaskService } from '../../services/task.service'

@Component({
    selector: 'create-edit-task',
    templateUrl: './create-edit-task.component.html',
    styleUrls: ['./create-edit-task.component.css']
})
export class CreateEditTaskComponent implements AfterViewInit {
    taskTypes: string[] = [
        'Grafisk Opgave',
        'Video Opgave',
        'Event Opgave',
        'Strategisk Opgave',
        'Målgruppeanalyse',
        'Dataanalyse'
    ];
    business: Business;
    edit: Boolean;
    model: Task = new Task();

    constructor(private taskService: TaskService,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private businessService: BusinessService,
        private utilService: UtilService) {
        accountService.loggedIn.subscribe(newValue => {
            if (newValue)
                this.getBusiness();
            else
                this.business = null;
        })
    }

    ngAfterViewInit() {
        this.route.params.subscribe(params => {
            let id = params['id'];
            if (id) {
                this.utilService.loading.next(true);
                this.taskService.getTask(id).subscribe(res => {
                    this.utilService.loading.next(false);
                    this.model = res;
                    this.edit = true;
                });
            } else {
                this.edit = false;
            }

        })
    }

    @ViewChild('f') form: any;

    onSubmit() {
        if (this.form.valid) {
            this.utilService.loading.next(true);
            if (!this.model.id) {
                if (this.model.rewardType === 'Anbefaling')
                    this.model.rewardValue = 0;
                this.taskService.createTask(this.model).subscribe((data) => {
                    this.utilService.loading.next(false);
                    this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave oprettet" });
                    this.router.navigateByUrl('business');
                }, (err) => {
                    this.utilService.loading.next(false);
                    this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Opgave ikke oprettet" });
                });
                //this.businessService.createBusiness(this.model);
            } else {
                if (this.model.rewardType === 'Anbefaling')
                    this.model.rewardValue = 0;
                this.taskService.updateTask(this.model).subscribe((data) => {
                    this.utilService.loading.next(false);
                    this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave opdateret" });
                    this.router.navigateByUrl('business');
                }, (err) => {
                    this.utilService.loading.next(false);
                    this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Opgaven blev ikke opdateret" });
                });
            }  
        }
    }

    getBusiness() {
        this.utilService.loading.next(true);
        this.businessService.getBusinessFromUser().subscribe(res => {
            this.business = res;
            this.model.address = res.address;
            this.model.city = res.city;
            this.model.zip = res.zip;
            this.utilService.loading.next(false);
        }, err => {
            this.utilService.loading.next(false);
            if (err.status === 401) {
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Du skal være logget ind for at se dette indhold" });
                this.router.navigateByUrl("login");
            } else {
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Noget gik galt" });
                console.log(err);
            }
            
        });
    }

    deadlineChanged(newValue) {
        this.model.deadline = moment(newValue);
        console.log(this.model.deadline.format());
    }
}
