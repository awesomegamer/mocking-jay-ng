import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {LayoutHeader} from '../layouts/header.layout';
import {Segment, Time, Template} from '../interfaces/interface';
import {RadiusInputComponent, RadiusSelectComponent, RadiusRadioComponent, SelectObject} from '../form/form.component';

import {TemplateService} from '../services/template.service';
import {SegmentService} from '../services/segment.service';
import {AuthService} from '../auth/auth.service';

import {Notification, NotificationService, NotificationModalService, NotifyModal, NotifyTarget} from '../notification.service';
import {CalendarSelectElm} from '../form/calendar.form.component';

// TOO MUCH MONKEY PATCHING ..... FIX IT!!!!!
// CHECK IF TEMPLATES ARE EMPTY!!

export interface Notification {
	message: string,
	type: boolean
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

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
	selector: 'mj-radio',
	template: `
		<div class="mj__radio__wrap" (click)="toggle()">
			<span class="mj__radio" [ngClass]="{on: on}">
				&nbsp;
			</span>
			<span class="mj__radio__text" *ngIf="text">{{text}}</span>
		</div>
	`
})
export class MjRadio {
	@Input() on: boolean = false;
	@Input() text: string;
	@Output() update = new EventEmitter<boolean>();

	toggle() {
		this.on = !!!this.on;
		this.update.next(this.on);
	}
}

enum TimeOfDay {
	AM,
	PM
}

enum Weekday {
	Mon,
	Tue,
	Wed,
	Thu,
	Fri,
	Sat,
	Sun
}

interface ValidationResult {
	[key: string]: boolean;
}

class DateTimeValidator {
	static shouldBeTime(control: Control): ValidationResult {
		let validation = control.value.trim().match(/^\d{1,2}:\d{1,2}$/i),
			error: ValidationResult = { "shouldBeTime": true };
		if (!validation) {
			return error;
		} else {
			let [hr, min] = control.value.trim().split(":");
			hr = parseInt(hr);
			min = parseInt(min);
			if (hr < 0 || hr > 24) { return error; }
			if (min < 0 || min > 60) { return error; }
		}
		return null;
	}

	static shouldBeDate(control: Control): ValidationResult {
		let validation = control.value.trim().match(/^\d{1,2}\/\d{1,2}\/\d{4}$/i),
			error: ValidationResult = { "shouldBeDate": true };

		if (!validation) {
			return error;
		} else {
			let [m, d, _] = control.value.trim().split("/");
			m = parseInt(m); d = parseInt(d);
			if (m < 1 || m > 24) { return error; }
			if (d < 1 || d > 31) { return error; }
		}
		return null;
	}
}


@Component({
	template: `
		<div *ngIf="templates">
			<div class="contextual__form" *ngIf="templates.length > 0">
				<h4 class="form__lnr">
					<span class="lnr lnr-pencil"></span>
					Create a new segment
				</h4>
				<div class="form__wrap">
					{{formatted}}
					<form [ngFormModel]="segmentForm">
						<div class="form__group">
							<label for="">Template</label>
							<radius-select (update)="updateTemplate($event)" [items]="templates" [selected]="0"></radius-select>
							<div class="form__desc">
								Select the template you want this event to use
							</div>
						</div>
						<div class="form__group">
							<label for="">Date</label>
							<calendar-select-elm (update)="updateDate($event)"></calendar-select-elm>
							<div class="form__desc">
								Select the date for segment start
							</div>
						</div>
						<div class="form__group">
							<label for="">Start time</label>
							<div class="divide">
								<section>
									<input type="text" ngControl="start" />
								</section>
								<section>
									<radius-select [items]="timeOfDay" [selected]="0"></radius-select>
								</section>
							</div>
							<div class="form__desc">
								Select the time for segment start
							</div>
						</div>
						<div class="form__group">
							<label for="">End time</label>
							<div class="divide">
								<section>
									<input type="text" ngControl="end" />
								</section>
								<section>
									<radius-select [items]="timeOfDay" [selected]="0"></radius-select>
								</section>
							</div>
							<div class="form__desc">
								Select the time for segment end
							</div>
						</div>
						<div class="form__group">
							<label for="">Repeat?</label>
							<radius-radio (update)="updateRepeat($event)" [on]="true" [intext]="true"></radius-radio>
							<div class="form__desc">
								Do you want to repeat the event
							</div>
						</div>
						<div *ngIf="repeatView">
							<div class="form__group">
								<label for="">Repeat until</label>
								<calendar-select-elm (update)="updateUntil($event)"></calendar-select-elm>
								<div class="form__desc">
									Select the segment repeat until date
								</div>
							</div>
							<div class="form__group">
								<label for="">Repeat days</label>
								<div class="weekdays">
									<section>
										<mj-radio [on]="false" [text]="'Mon'" (update)="updateMon($event)"></mj-radio>
									</section>
									<section>
										<mj-radio [on]="false" [text]="'Tue'" (update)="updateTue($event)"></mj-radio>
									</section>
									<section>
										<mj-radio [on]="false" [text]="'Wed'" (update)="updateWed($event)"></mj-radio>
									</section>
									<section>
										<mj-radio [on]="false" [text]="'Thu'" (update)="updateThu($event)"></mj-radio>
									</section>
									<section>
										<mj-radio [on]="false" [text]="'Fri'" (update)="updateFri($event)"></mj-radio>
									</section>
									<section>
										<mj-radio [on]="false" [text]="'Sat'" (update)="updateSat($event)"></mj-radio>
									</section>
									<section>
										<mj-radio [on]="false" [text]="'Sun'" (update)="updateSun($event)"></mj-radio>
									</section>
								</div>
								<div class="form__desc">
									Select the weekdays you want to repeat on
								</div>
							</div>
						</div>
						<div class="form__group">
							<button (click)="submit()" class="button type__3">
								<span class="icon-done"></span>Create Segment
							</button>
							<button class="button type__4">
								<span class="icon-close"></span>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
			<div *ngIf="!(templates.length > 0)">
				<h3>You need to create a template before you can create a segment</h3>
			</div>
		</div>
		<spinner *ngIf="!templates"></spinner>
	`,
	directives: [MjRadio, RadiusInputComponent, RadiusRadioComponent, RadiusSelectComponent, CalendarSelectElm, Spinner]
})
class SegmentCreate implements OnInit {
	segment: Segment;
	repeatView: boolean = true;

	templates: SelectObject[];
	templates$: Observable<Template[]>;

	notification$: Observable<Notification>;

	timeOfDay: SelectObject[] = [
		{ value: TimeOfDay.AM, text: 'AM' },
		{ value: TimeOfDay.PM, text: 'PM' }
	]

	start: Control;
	end: Control;
	segmentForm: ControlGroup;

	constructor(
		private templateService: TemplateService,
		private segmentService: SegmentService,
		private authService: AuthService,
		private notificationService: NotificationService,
		private fb: FormBuilder
	) {
		let date = new Date();
		this.start = new Control(
			`10:00`,
			Validators.compose([Validators.required, DateTimeValidator.shouldBeTime]));

		this.end = new Control(
			`12:00`,
			Validators.compose([Validators.required, DateTimeValidator.shouldBeTime]));

		this.segmentForm = fb.group({
			'start': this.start,
			'end': this.end
		});
	}

	updateTemplate(event: string) {
		this.segment._template = event;
	};

	updateDate([month, day, year]: [number, number, number]) {
		this.segment.date = {
			month: month,
			day: day,
			year: year
		};
	}

	updateUntil([month, day, year]: [number, number, number]) {
		this.segment.repeat_until = {
			month: month,
			day: day,
			year: year
		};
	}

	updateRepeat(event: boolean) {
		this.repeatView = event;
		this.segment.repeat = event;
	}

	updateMon(event: boolean) { this.segment.repeat_days.mon = event; }
	updateTue(event: boolean) { this.segment.repeat_days.tue = event; }
	updateWed(event: boolean) { this.segment.repeat_days.wed = event; }
	updateThu(event: boolean) { this.segment.repeat_days.thu = event; }
	updateFri(event: boolean) { this.segment.repeat_days.fri = event; }
	updateSat(event: boolean) { this.segment.repeat_days.sat = event; }
	updateSun(event: boolean) { this.segment.repeat_days.sun = event; }

	submit() {
		if (this.segmentForm.valid) {
			let {start, end} = this.segmentForm.value;

			let [hr, min] = start.split(":");
			this.segment.start = {
				hour: parseInt(hr),
				minute: parseInt(min)
			}

			let [hr2, min2] = end.split(":");
			this.segment.end = {
				hour: parseInt(hr2),
				minute: parseInt(min2)
			}

			this.segmentService.addSegment(this.segment);
			this.segmentService.getNewSegment().then(segment => {
				this.segment.id = segment.id;
			});
			this.notificationService.notify(`Added new segment ${this.segment.id}`, true);
		} else {
			this.notificationService.notify(`Cannot add segment`, true, true);
		}
	}

	ngOnInit() {
		let [_, session] = this.authService.getSession();

		this.notification$ = this.segmentService.notification$;
		this.notification$.subscribe(
			(data) => {
				let {message, type} = data;
				this.notificationService.notify(message, true, !type);
			}
		);

		this.templates$ = this.templateService.templates$;
		this.templates$.subscribe(
			(response) => {
				this.templates = response.map(
					(template) => {
						return { value: template.id, text: template.name }
					});
			});

		this.segmentService.getNewSegment().then(segment => this.segment = segment);
		this.templateService.getTemplates(session.id);
	}

	get formatted() {
		return ``;
		// return JSON.stringify(this.segment);
	}
}


@Component({
	selector: 'segment-editor',
	template: `
	<div class="editor" *ngIf="segment">
		<div class="form__wrap">
			<form>
				<a class="button type__1" (click)="remove(segment.id)">
					<span class="icon-close"></span>
					Remove segment
				</a>
			</form>
		</div>
	</div>
	`
})
class SegmentEditor {
	@Input() segment: Segment;
	
	notifyTargetObr$: Observable<NotifyTarget>;
	notifyModal: NotifyModal;

	constructor(
		private segmentService: SegmentService,
		private NMService: NotificationModalService
	) {
		this.notifyTargetObr$ = this.NMService.notifyTargetObr$;
	}

	remove(id: string) {
		let target = genId();
		this.NMService.show({
			heading: `You're about to perform an irreversible action`,
			message: `Deleting a segment is a permanent action. It will remove all appointments associated with it. Are you sure you want to proceed?`,
			target: target,
			display: `Delete Segment`,
			error: true
		});
		this.notifyTargetObr$.subscribe(
			(done) => {
				if (done.target == target && done.payload == true) {
					this.segmentService.removeSegment(id);
				}
			});
	}
}


@Component({
	selector: 'segment-detail',
	template: `
		<li *ngIf="segment" class="segment__detail">
			<div>
				<section>
				<h4>{{segment.template?.name}}</h4>
				</section>
				<section>
					<h5>{{from}}</h5>
					<div>
						<strong>From</strong> {{segment.start.hour}}:{{segment.start.minute}} 
						<strong>To:</strong> {{segment.end.hour}}:{{segment.end.minute}}
					</div>
				</section>
				<button class="lnr" [ngClass]="{'lnr-pencil': !show, 'lnr-cross': show}" (click)="show=!show"></button>
				<segment-editor [segment]="segment" *ngIf="show"></segment-editor>
			</div>
		</li>
	`,
	directives: [SegmentEditor]
})
class SegmentDetail implements OnInit {
	@Input() segment: Segment;
	show: boolean = false;

	from: any = '';

	ngOnInit() {
		if (this.segment) {
			this.from = moment(new Date(this.segment.date.year, this.segment.date.month, this.segment.date.day)).format("MMM Do YYYY");
		}
	}
}


@Component({
	template: `
		<h3>Segments</h3>
		<ul *ngIf="segments" class="table__segments">
			<segment-detail *ngFor="#s of segments" [segment]="s">
			</segment-detail>
		</ul>
		<spinner *ngIf="!segments"></spinner>
	`,
	directives: [SegmentDetail, Spinner]
})
class Segments implements OnInit {

	segments: Segment[];
	segments$: Observable<Segment[]>;
	notification$: Observable<Notification>;
	templates: Template[];

	constructor(
		private segmentService: SegmentService,
		private authService: AuthService,
		private notificationService: NotificationService,
		private templateService: TemplateService
	) {
	}

	ngOnInit() {
		let [_, session] = this.authService.getSession();

		this.notification$ = this.segmentService.notification$;
		this.notification$.subscribe(
			(data) => {
				let {message, type} = data;
				this.notificationService.notify(message, true, !type);
			}
		);

		this.segments$ = this.segmentService.segments$;
		this.segments$.subscribe(
			(response) => {
				this.segments = response;
			});

		this.segmentService.getSegments(session.id);
	}

	remove(id: string) {
		this.segmentService.removeSegment(id);
	}
}

@Component({
	selector: 'contextual-menu',
	template: `
		<div class="contextual__menu">
			<h4>Segments</h4>
			<ul>
				<li><a [routerLink]="['/SegmentViewport']">View all</a></li>
				<li><a [routerLink]="['/SegmentViewport', 'SegmentCreate']">Create new</a></li>
			</ul>
		</div>
	`,
	directives: [RouterLink]
})
class ContextualMenu {
}


@Component({
	template: `
		<div class="wrapping__viewport">
			<contextual-menu></contextual-menu>
			<div class="wrapping__content">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
	directives: [RouterLink, RouterOutlet, ContextualMenu]
})
@RouteConfig([
		{ path: '/', name: 'Segments', component: Segments, useAsDefault: true },
		{ path: '/new', name: 'SegmentCreate', component: SegmentCreate },
])
export class SegmentViewport {

}