import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType, Fragment, Segment, Status} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';
import {SegmentService} from './segment.service';


export interface Notification {
	message: string,
	type: boolean
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


@Injectable()
export class FragmentService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	authService: AuthService;
	segmentService: SegmentService;

	fragments: Fragment[] = [];

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService,
		@Inject(SegmentService) SegmentService
	) {
		this.segmentService = SegmentService;
		this.authService = AuthService;
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();

		let fragments = localStorage.getItem('fragments');
		if (typeof fragments !== 'undefined' && fragments !== null) {
			this.fragments = JSON.parse(fragments);
		} else {
			localStorage.setItem('fragments', JSON.stringify([]));
		}
	}

	getFragments(segment, month, day, year) {
		let fragments = this.fragments
			.filter((fragment) =>
					fragment.segment_id == segment.id && fragment.date.month == month && fragment.date.day == day && fragment.date.year == year)
			.map((fragment) => {
				fragment.segment = segment;
				return fragment;
		});

		return Promise.resolve(fragments);
	}

	merge(frags1: Fragment[], frags2: Fragment[]) {
		let fragments = frags1.map((fragment) => {
			
		});
		console.log(fragments);
	}

	addFragment(fragment: Fragment) {
		let {id, date, start, end, segment_id, status} = fragment;
		// this.fragments.push({
		// 	id: id,
		// 	date: date,
		// 	start: start,
		// 	end: end,
		// 	segment_id: segment_id,
		// 	status: status
		// });
		// localStorage.setItem('fragments', JSON.stringify(this.fragments));
	}

	genFragments (segment: Segment): Fragment[] {
		let [t1, m1] = [segment.start.hour, segment.start.minute],
				[t2, m2] = [segment.end.hour, segment.end.minute];

		let d1: any = new Date(segment.date.year, segment.date.month, segment.date.day, t1, m1),
				d2: any = new Date(segment.date.year, segment.date.month, segment.date.day, t2, m2);

		let diff = (d2 - d1) / 1000 / 60;
		let fragments = diff / segment.template.interval;

		let increment = ([h, m], inc): [number, number] => {
			if ((m + inc) === 60) {
				return [h + 1, 0];
			} else {
				return [h, m + inc];
			}
		}

		let frags: Fragment[] = [];
		let now: [number, number] = [t1, m1];
		for (let i = 0, l = fragments; i < l; i++) {
			let tmp = now;
			now = increment(now, 15);
			frags.push({
				id: genId(),
				date: {
					year: segment.date.year,
					month: segment.date.month,
					day: segment.date.day
				},
				start: {
					hour: tmp[0],
					minute: tmp[1]
				},
				end: {
					hour: now[0],
					minute: now[1]
				},
				status: Status.default,
				segment: segment,
				segment_id: segment.id
			});
		}

		return frags;
	}

}






// end