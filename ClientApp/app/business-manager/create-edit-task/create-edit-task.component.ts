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
    public ismeridian: boolean = false;
    now: Date = new Date();
    isEdit: Date;
    selectedTime: Date = new Date();
    selectedDate: Date = new Date();
    statusMessage: string;
    taskTypes: string[] = UtilService.taskTypes;
    business: Business;
    edit: Boolean;
    minuteStep: number = 1;
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
        });
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
                    this.isEdit = res.deadline.toDate();
                    this.now = res.deadline.toDate();
                    this.selectedDate = res.deadline.toDate();
                    this.selectedTime = res.deadline.toDate();
                });
            } else {
                this.edit = false;
                this.model.rewardValue = 0;
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
                    console.log(data);
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
            }
            
        });
    }

    deadlineChanged(something) {
        let _date: moment.Moment = moment(this.selectedDate).startOf("day");
        let _time: moment.Moment = moment(this.selectedTime);
        _date.add(_time.hours(), "h").add(_time.minutes(), "m");
        if (_date.isAfter(moment())) {
            this.model.deadline = _date;
            this.statusMessage = '';
        }
        else {
            this.statusMessage = "Tiden for din deadline skal ligge efter nuværende tidspunkt";
        }   
    }
}
