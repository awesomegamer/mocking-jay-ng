import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {User, UserType} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';
import {Notifier, NotifierService} from '../services/notifier.service';
import {NotificationService, Notification} from '../notification.service';
import {SearchService} from './header.service';

@Pipe({ name: 'unread' })
export class UnreadNotifiers implements PipeTransform {
  transform(allNotifier: Notifier[]) {
    return allNotifier.filter(nt => !nt.read);
  }
}

@Pipe({ name: 'read' })
export class ReadNotifiers implements PipeTransform {
  transform(allNotifier: Notifier[]) {
    return allNotifier.filter(nt => nt.read);
  }
}

@Component({
	selector: 'main-nav',
	template: `
		<ul class="main__nav" *ngIf="navs">
			<li>
				<a (click)="show=!show" [ngClass]="{animate: animate}">
					<span class="unread">{{unread}}</span>
					<span class="lnr lnr-flag"></span>
					<em>Notifications</em>
				</a>
				<div class="notifiers" *ngIf="show">
					<ul>
						<h5>Unread ({{unread}})</h5>
						<li *ngFor="#nt of (notifiers | unread)">
							<span class="icon-radio-off"></span>
							<a (click)="resource(nt._id)">{{nt.data.message}}</a>
							<button (click)="toggleRead(nt._id)" class="icon-done"></button>
						</li>
					</ul>

					<ul>
						<h5>Read</h5>
						<li *ngFor="#nt of (notifiers | read)">
							<span class="icon-radio-on"></span>
							<a (click)="resource(nt._id)">{{nt.data.message}}</a>
							<button (click)="toggleRead(nt._id)" class="lnr lnr-chevron-up"></button>
						</li>
					</ul>
					<section>
						<a>View all</a>
					</section>
				</div>
			</li>
			<li *ngFor="#nav of navs">
				<a [routerLink]="nav.location">
          <span class='lnr lnr-{{nav.lnr}}'></span>
          <em>{{nav.text}}</em>
        </a>
			</li>
			<li *ngIf="user">
				{{user.fname}} {{user.lname}}
				<a [routerLink]="['/LogoutComponent']"><img src="{{user.meta.avatar}}" /></a>
				<span class="lnr lnr-chevron-down"></span>
			</li>
		</ul>
	`,
	directives: [RouterLink],
	pipes: [UnreadNotifiers, ReadNotifiers]
})
class MainNav implements OnInit {
	@Input() user: User;
	@Input() navs: Object[];

	show: boolean = false;
	notifiers: Notifier[] = [];
	notifier$: Observable<string>;

	animate: boolean = false;
	timeout: any;

	constructor(
		private notifierService: NotifierService,
		private router: Router
	) {
		this.notifier$ = this.notifierService.notifier$;
		this.notifier$.subscribe(
			(response) => {
				this.notifiers = [response].concat(this.notifiers);
				this.runAnimate();
			});
	}

	runAnimate() {
		clearTimeout(this.timeout);
		this.animate = false;
		let length = this.notifiers.filter(nt => !nt.read).length;
		if (length > 0) {
			this.animate = true;
			this.timeout = setTimeout(() => {
				this.animate = false;
			}, 1000);
		}
	}

	ngOnInit() {
		this.notifierService.getNotifications().then(
			(notifiers) => {
				this.notifiers = notifiers;
				this.runAnimate();
			});
	}

	get unread() {
		return this.notifiers.filter(nt => !nt.read).length;
	}

	toggleRead(id: string) {
		this.notifiers = this.notifiers.map(notifier => {
			if (notifier._id == id) {
				notifier.read = !!!notifier.read;
			}
			return notifier;
		});
	}

	resource(id: string) {
		this.notifiers.forEach(notifier => {
			if (notifier._id == id) {
				switch (notifier.type) {
					case 0:
					case 1:
					case 2:
					case 3:
						let res = notifier.data.resource;
						this.router.navigateByUrl(`/calendar/${res.user}/day/${res.month}/${res.day}/${res.year}`);
						break;
					default:
						break;
				}
			}
		});
		this.toggleRead(id);
	}
}


enum SearchType {
	User,
	Date,
	UserDate,
	Help
}

interface SearchResult {
	type: SearchType,
	obj: {}
}

@Component({
	selector: 'spinner',
	template: `
		<div class="spinner">
			<div class="bounce1"></div>
			<div class="bounce2"></div>
			<div class="bounce3"></div>
		</div>
	`
})
class Spinner { }

@Component({
	selector: 'search-box',
	template: `
		<form>
			<div class="search__box">
				<span class='lnr lnr-magnifier'></span>
        <input placeholder='Search for anything' type='text' [(ngModel)]="q" (focus)="show=true" (blur)="hide()" (keyup)="search()">

        <ul class="search__results" [ngClass]="{show: show}">
        	<h5>Search results:</h5>
        	<li *ngFor="#s of searchResults">
        		<a [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: s.obj.id}]" class="search__user">
							<img src="{{s.obj.meta?.avatar}}" alt="" />
							<h3>
								{{s.obj.fname}} {{s.obj.lname}}
								<span>{{s.obj.email}}</span>
							</h3>
        		</a>
        	</li>
        	<li *ngIf="searchResults.length < 1 && q.length > 0 && !spin">Could not find anything</li>
        	<li *ngIf="searchResults.length < 1 && q.length < 1 && !spin">Type to search</li>
        	<li *ngIf="spin"><spinner></spinner></li>
        </ul>
			</div>
		</form>
	`,
	directives: [RouterLink, Spinner],
	providers: [SearchService]
})
class SearchBox implements OnInit {
	searchResults: SearchResult[] = [];
	show: boolean = false;
	timeout: any;
	q: string = "";
	spin: boolean = false;

	constructor(
		private searchService: SearchService
	) {}

	search() {
		if (this.q.length > 0) {
			this.spin = true;
			this.searchService.search(this.q).then((users) => {
				this.searchResults = [];
				users.forEach((user) => {
					let tmp = user;
					tmp.id = user._id;
					this.searchResults.push({ type: SearchType.User, obj: tmp });
				});
				this.spin = false;
			})
		}
	}

	hide() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => { this.show = false; }, 250);
	}

	ngOnInit() {
	}
}


@Component({
	selector: 'layout-header',
	template: `
		<div class="app__top" *ngIf="user">
			<div class="row">
				<div class="top__left">
					<div>
						<img src="https://cdn.shopify.com/s/files/1/0521/5917/files/mjlogosm.png?10550252934331944658" alt="" />
					</div>
				</div>
				<div class="top__search">
					<search-box></search-box>
				</div>
				<div class="top__right">
					<main-nav [user]="user" [navs]="navs"></main-nav>
				</div>
			</div>
		</div>
	`,
	directives: [SearchBox, MainNav]
})
export class LayoutHeader implements OnInit {
	user: User;
	session$: Observable<boolean>;
	show: boolean = false;
	notification$: Observable<Notification>;

	constructor(
		private authService: AuthService,
		private notificationService: NotificationService
	) {
		this.notification$ = this.notificationService.notification$;
		this.notification$.subscribe(
			(data) => {
			}
		);
	}

	NAVS: Object[] = [
		{ location: ['/ProfileViewport'], lnr: 'calendar-full', text: 'Calendar' },
		{ location: ['/TemplateViewport'], lnr: 'layers', text: 'Templates' },
		{ location: ['/SegmentViewport'], lnr: 'file-add', text: 'Events' },
		{ location: ['/PreferencesViewport'], lnr: 'cog', text: 'Preferences' },
	]

	navs: any = [];

	update() {
		let [sessionExists, session] = this.authService.getSession();
		if (sessionExists) {
			this.user = session;
			this.navs = this.NAVS;
			this.navs[0].location = ['/ProfileViewport', 'CalendarRouter', { id: this.user.id }];
		}
	}

	ngOnInit() {
		this.update();

		this.session$ = this.authService.session$;
		this.session$.subscribe(
			(response) => {
				if (response) {
					this.update();
				} else {
					this.user = null;
				}
			});
	}
}