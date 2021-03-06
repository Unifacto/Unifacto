﻿import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Business } from '../../model/business';
import { Solution } from '../../model/solution';
import { Student } from '../../model/student';
import { BusinessService } from '../../services/business.service';
import { TaskService } from '../../services/task.service';
import { BlobService } from '../../services/blob.service';
import { UtilService } from '../../services/util.service';
import { StudentService } from '../../services/student.service';
import { AccountService } from '../../services/account.service';

@Component({
    selector: 'download-solution',
    templateUrl: './download-solution.component.html',
    styleUrls: ['./download-solution.component.css']
})
export class DownloadSolutionComponent implements AfterViewInit {
    business: Business;
    student: Student;
    solutions: any[];
    isAdmin: boolean = false;

    constructor(
        private businessService: BusinessService,
        private taskService: TaskService,
        private route: ActivatedRoute,
        private utilService: UtilService,
        private studentService: StudentService,
        private blobService: BlobService,
        private accountService: AccountService,
        private router: Router) {
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
            let taskId = params['taskId'];
            let studentId = params['studentId']
            if (taskId && studentId) {
                this.getSolutionFiles(taskId, studentId);
                this.studentService.getStudentFromId(studentId).subscribe(res => {
                    if (res.id) {
                        this.student = res;
                    }
                })
            }
        })
    }

    getBusiness() {
        this.utilService.displayLoading(true);
        this.businessService.getBusinessFromUser().subscribe(res => {
            this.business = res;
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

    formatFileName(filePath: string) {
        return filePath.slice(filePath.lastIndexOf('/') + 1, filePath.length);
    }

    getSolutionFiles(taskId, studentId) {
        this.utilService.displayLoading(true);
        this.blobService.getSolutionFiles(taskId, studentId).subscribe(res => {
            if (res != null) {
                this.utilService.displayLoading(false);
                this.solutions = res;
                this.solutions.forEach((f) => {
                    f.fileName = this.formatFileName(f.name)
                });
            } else {
                this.utilService.displayLoading(false);
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Der var ikke nogen filer til dette løsningsforslag at hente" });
            }
        }, (err) => {
            this.utilService.displayLoading(false);
            this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Kunne ikke hente allerede uploadede filer" });
        });
    }
}
