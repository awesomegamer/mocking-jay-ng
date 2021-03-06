import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';


export interface Notification {
	message: string,
	type: boolean
}


@Injectable()
export class UserService {
	user$: Observable<User>;
	private userObserver: Observer<User>;

	authService: AuthService;

	userCache: User[];

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	){
		this.authService = AuthService;
		this.user$ = new Observable<User>(observer => this.userObserver = observer).share();
	}

	getUserPromise(uid: string = null) {
		let headers = this.authService.getAuthHeader();
		return this.http.get(`${this.authService.baseUri}/users/${uid}`, {
			headers: headers,
		})
			.map(res => res.json())
			.toPromise();
	}

	getUserByEmailPromise(email: string = null) {
		let headers = this.authService.getAuthHeader();
		return this.http.get(`${this.authService.baseUri}/user/${email}`, {
			headers: headers,
		})
			.map(res => res.json())
			.toPromise();
	}

	getUser(uid: string = null) {
		if (uid) {
			
			let headers = this.authService.getAuthHeader();
			this.http.get(`${this.authService.baseUri}/users/${uid}`, {
				headers: headers,
			})
				.map(res => res.json())
				.subscribe(
				(response) => {
					if (response.success) {
						let user = response.payload;
						switch (user.type) {
							case "student":
								user.type = UserType.Student
								break;
							case "faculty":
								user.type = UserType.Faculty
								break;
						}
						user.id = user._id;
						delete user._id;

						this.userObserver.next(user);
					}
				});

		} else {
			let [_, session] = this.authService.getSession();
			return Promise.resolve(session);
		}
	}

	addEmail(email: string) {
		return this.http.post(
			`${this.authService.baseUri}/users/email`,
			JSON.stringify({ email: email }),
			{ headers: this.authService.getAuthHeader() }
		)
			.map(res => res.json())
			.toPromise();
	}

	activate(id: string, code: string) {
		return this.http.post(
			`${this.authService.baseUri}/users/activate`,
			JSON.stringify({ id: id, code: code }),
			{ headers: this.authService.getAuthHeader() }
		)
			.map(res => res.json())
			.toPromise();
	}
}