import * as dotenv from 'dotenv';
dotenv.config();
process.env.NODE_ENV = 'testing';
import {expect} from 'chai';
import 'mocha';

import {CacheStore, Storage} from '../src';

let initCount = 0;
let loadCount = 0;
let saveCount = 0;
let emitCount = 0;

type DemoType = {demo: string};

interface DataStorage<T = any> {
	_ts: number;
	data: T;
}

class TestStorage extends Storage<DemoType> {
	private ts: number;
	private store = JSON.stringify({
		_ts: 0,
		data: {demo: ''},
	});
	protected handleInit(): Promise<void> {
		initCount++;
		// init
		return Promise.resolve();
	}
	protected handleLoad(): Promise<DemoType> {
		loadCount++;
		const storeData = JSON.parse(this.store) as DataStorage<DemoType>;
		return Promise.resolve(storeData.data);
	}
	protected handleSave(data: DemoType): Promise<void> {
		saveCount++;
		this.ts = new Date().getTime();
		this.store = JSON.stringify({
			_ts: this.ts,
			data,
		});
		return Promise.resolve();
	}
	public emitUpdate(): void {
		emitCount++;
		const storeData = JSON.parse(this.store) as DataStorage<DemoType>;
		storeData._ts = new Date().getTime();
		storeData.data.demo = 'update';
		if (!this.ts || storeData._ts > this.ts) {
			this.ts = storeData._ts;
			this.emit('update', storeData.data);
			this.store = JSON.stringify(storeData);
		}
	}
}

let cacheStore: CacheStore<DemoType>;
let testStorage = new TestStorage();

describe('cache store', () => {
	beforeEach(function () {
		initCount = 0;
		loadCount = 0;
		saveCount = 0;
		emitCount = 0;
		testStorage = new TestStorage();
		cacheStore = new CacheStore<DemoType>({storage: testStorage});
	});
	describe('init', () => {
		it('should wait init promise', async () => {
			await cacheStore.init();
			expect(initCount).to.be.eq(1);
			expect(loadCount).to.be.eq(0);
			expect(saveCount).to.be.eq(0);
			expect(emitCount).to.be.eq(0);
		});
		it('should wait load promise', async () => {
			await cacheStore.init({load: true});
			cacheStore.on('update', (data) => {
				expect(data.demo).to.be.eq('');
			});
			await cacheStore.load();
			expect(initCount).to.be.eq(1);
			expect(loadCount).to.be.eq(2);
			expect(saveCount).to.be.eq(0);
			expect(emitCount).to.be.eq(0);
		});
		it('should save', async () => {
			await cacheStore.init({load: true});
			await cacheStore.save({demo: 'test'});
			expect(initCount).to.be.eq(1);
			expect(loadCount).to.be.eq(1);
			expect(saveCount).to.be.eq(1);
			expect(emitCount).to.be.eq(0);
		});
		it('should get event', async function () {
			this.timeout(15000);
			let resolver: any;
			const waiter = new Promise((resolve) => (resolver = resolve));
			cacheStore.on('update', (data) => {
				expect(data.demo).to.be.eq('update');
				expect(initCount).to.be.eq(1);
				expect(loadCount).to.be.eq(0);
				expect(saveCount).to.be.eq(0);
				expect(emitCount).to.be.eq(1);
				resolver();
			});
			await cacheStore.init();
			testStorage.emitUpdate();
			await waiter;
		});
	});
});
