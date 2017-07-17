﻿import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../services/account.service';
import { UtilService } from '../services/util.service';
import { Student } from '../model/student';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
    loading: boolean = false;
    username: string = "";
    password: string = "";
    loginFailedMsg: string = "";
    @ViewChild('f') form: any;
    student: Student;

    constructor(private accountService: AccountService, private utilService: UtilService, private router: Router) {
        this.accountService.loggedIn.subscribe(newValue => {
            if (newValue)
                this.router.navigate(['/business']);
        });
        this.student = this.accountService.loggedStudent.getValue();
        this.accountService.loggedStudent.subscribe(newValue => {
            this.student = newValue;
            console.log(this.student);
        });
    }

    ngAfterViewInit() {
        this.accountService.updateStudent();
    }

    onLogin() {
        if (this.form.valid) {
            this.utilService.loading.next(true);
            this.accountService.login(this.username, this.password).subscribe((response) => {
                this.utilService.loading.next(false);
                if (response.ok == true) {
                    this.utilService.alert.next({ type: "success", titel: "Success", message: "Login lykkedes" });
                    this.router.navigate(['/business']);
                } else {
                    this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Login mislykkedes" });
                }
            }, (err) => {
                this.utilService.loading.next(false);
                this.utilService.alert.next({ type: "danger", titel: "Fejl", message: "Login mislykkedes" });
            });
        }
    }

    newBusiness() {
        this.router.navigate(['/business/register']);
    }

    fblogin() {
        this.accountService.fblogin();
    }

    fblogout() {
        this.accountService.fblogout();
    }

    getUserImage() {
        if (this.student) {
            return "http://graph.facebook.com/" + this.student.facebookId + "/picture?type=square";
        }
    }

    forgotPassword() {
        this.router.navigate(['/login/forgotpassword']);
    }
}
