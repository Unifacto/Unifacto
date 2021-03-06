﻿import { Component, OnInit, Pipe, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { BusinessService } from '../../services/business.service';
import { BlobService } from '../../services/blob.service';
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
    formData: FormData = new FormData();
    filesChanged: boolean = false;
    @ViewChild('f') form: any;
    attachments: any;
    attachmentNames: any;
    isAdmin: boolean = false;

    constructor(private taskService: TaskService,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private businessService: BusinessService,
        private utilService: UtilService,
        private blobService: BlobService) {
        accountService.loggedIn.subscribe(newValue => {
            if (newValue === "business") {
                this.getBusiness();
            }
            else if (newValue === "student") {
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Du har ikke tilladelse til at se dette indhold" });
                this.router.navigate(['/frontpage']);
            }
            else if (newValue === "admin") {
                this.isAdmin = true;
                this.business = null;
            }
            else {
                this.business = null;
            }
        });
    }

    ngAfterViewInit() {
        this.route.params.subscribe(params => {
            let id = params['id'];
            if (id) {
                this.utilService.displayLoading(true);
                this.taskService.getTask(id).subscribe(res => {
                    this.utilService.displayLoading(false);
                    this.model = res;
                    this.now = res.deadline.toDate();
                    this.selectedDate = res.deadline.toDate();
                    this.selectedTime = res.deadline.toDate();
                    if (!this.isAdmin) {
                        this.edit = true;
                        this.isEdit = res.deadline.toDate();
                    } else {
                        this.edit = false;
                    }
                });
                //this.getAttachments(id);
                this.getAttachmentNames(id);
            } else {
                this.edit = false;
                this.model.rewardValue = 0;
            }
        });
    }

    fileChange(event) {
        this.filesChanged = true;
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                this.formData.append('uploadFile', file, file.name);
            }
        }
    }

    onSubmit() {
        if (this.form.valid) {
            this.utilService.displayLoading(true);
            if (!this.model.id) {
                if (this.model.rewardType === 'Anbefaling')
                    this.model.rewardValue = 0;
                else 
                    this.model.rewardValue = this.formatRewardValue(this.model.rewardValue);
                
                this.taskService.createTask(this.model).subscribe((data) => {
                    console.log(data);
                    if (data.id) {
                        if (this.filesChanged) {
                            this.blobService.uploadAttachments(this.formData, data.id).subscribe((res) => {
                                if (res.ok) {
                                    this.utilService.displayLoading(false);
                                    this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave oprettet" });
                                    this.router.navigateByUrl('business');
                                } else {
                                    this.utilService.displayLoading(false);
                                    this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der skete en fejl under upload af filer" });
                                }
                            }, (err) => {
                                this.utilService.displayLoading(false);
                                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der skete en fejl under upload af filer" });
                            });
                        } else {
                            this.utilService.displayLoading(false);
                            this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave oprettet" });
                            this.router.navigateByUrl('business');
                        }
                    } else {
                        this.utilService.displayLoading(false);
                        this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Opgave ikke oprettet" });
                    }
                    
                }, (err) => {
                    this.utilService.displayLoading(false);
                    this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Opgave ikke oprettet" });
                });
                //this.businessService.createBusiness(this.model);
            } else {
                if (this.model.rewardType === 'Anbefaling')
                    this.model.rewardValue = 0;
                else
                    this.model.rewardValue = this.formatRewardValue(this.model.rewardValue);

                this.taskService.updateTask(this.model).subscribe((data) => {
                    if (this.filesChanged) {
                        this.blobService.uploadAttachments(this.formData, this.model.id).subscribe((res) => {
                            if (res.ok) {
                                if (!this.isAdmin) {
                                    this.utilService.displayLoading(false);
                                    this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave opdateret" });
                                    this.router.navigateByUrl('business');
                                } else {
                                    this.utilService.displayLoading(false);
                                    this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave opdateret" });
                                    this.router.navigateByUrl('admin/tasks');
                                }
                            } else {
                                this.utilService.displayLoading(false);
                                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der skete en fejl under upload af filer, men resten af opgaven er blevet opdateret." });
                            }
                        }, (err) => {
                            this.utilService.displayLoading(false);
                            this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der skete en fejl under upload af filer, men resten af opgaven er blevet opdateret." });
                        })
                    } else {
                        if (!this.isAdmin) {
                            this.utilService.displayLoading(false);
                            this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave opdateret" });
                            this.router.navigateByUrl('business');
                        } else {
                            this.utilService.displayLoading(false);
                            this.utilService.alert.next({ type: "success", titel: "Success", message: "Opgave opdateret" });
                            this.router.navigateByUrl('admin/tasks');
                        }
                    }

                }, (err) => {
                    this.utilService.displayLoading(false);
                    this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Opgaven blev ikke opdateret" });
                });
            }  
        }
    }

    getBusiness() {
        this.utilService.displayLoading(true);
        this.businessService.getBusinessFromUser().subscribe(res => {
            this.business = res;
            this.model.address = res.address;
            this.model.city = res.city;
            this.model.zip = res.zip;
            this.utilService.displayLoading(false);
        }, err => {
            this.utilService.displayLoading(false);
            if (err.status === 401) {
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Du skal være logget ind for at se dette indhold" });
                this.router.navigateByUrl("login");
            } else {
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Noget gik galt" });
            }
            
        });
    }

    deleteAttachment(fileName: string) {
        this.blobService.deleteAttachment(this.model.id, fileName).subscribe(res => {
            if (res.ok) {
                this.utilService.alert.next({ type: "success", titel: "Success", message: "Filen er blevet slettet fra opgaven" });
                this.getAttachmentNames(this.model.id);
            } else {
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der skete en fejl da filen skulle slettes" });
            }
        }, (err) => {
            this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der skete en fejl da filen skulle slettes" });
            });
    }

    /*getAttachments(id) {
        this.utilService.displayLoading(true);
        this.blobService.getAttachments(id).subscribe(res => {
            this.attachments = res;
            this.attachments.forEach((f) => {
                f.fileName = this.formatFileName(f.name)
            });
            //console.log(this.attachments);
            this.utilService.displayLoading(false);
        }, (err) => {
            this.utilService.displayLoading(false);
            });
    }*/

    getAttachmentNames(id) {
        this.blobService.getAttachmentNames(id).subscribe(res => {
            console.log(res);
            this.attachmentNames = res;
            for (let i = 0; i < this.attachmentNames.length; i++) {
                this.attachmentNames[i] = this.formatFileName(this.attachmentNames[i]);
            }
            console.log(this.attachmentNames);
        });  
    }



    formatFileName(filePath: string) {
        return filePath.slice(filePath.lastIndexOf('/') + 1, filePath.length);
    }

    formatRewardValue(rewardValue: number) {
        let rv = rewardValue.toString();
        rv = rv.replace('.', '');
        console.log(rv);
        return +rv;
    }

    deadlineChanged(something) {
        let _date: moment.Moment = moment(this.selectedDate).startOf("day");
        let _time: moment.Moment = moment(this.selectedTime);
        _date.add(_time.hours(), "h").add(_time.minutes(), "m");
        if (!this.isAdmin) {
            if (_date.isAfter(moment())) {
                this.model.deadline = _date;
                this.statusMessage = '';
            }
            else {
                this.statusMessage = "Tiden for din deadline skal ligge efter nuværende tidspunkt";
            }   
        } else {
            this.model.deadline = _date;
            this.statusMessage = '';
        }
    }
}
