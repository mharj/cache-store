import * as EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import {Storage} from './Storage';

interface StorageEvents<S = any> {
	update: (data: S) => void;
}

interface IProps {
	storage: Storage;
}

export class CacheStore<S = any> extends (EventEmitter as {new <S>(): TypedEmitter<StorageEvents<S>>})<S> {
	private storage: Storage<S>;
	constructor(props: IProps) {
		super();
		this.storage = props.storage;
		// start listen events
		this.storage.on('update', (store) => {
			this.emit('update', store);
		});
		//  bind methods
		this.init = this.init.bind(this);
		this.load = this.load.bind(this);
		this.save = this.save.bind(this);
	}
	public async init({load}: {load?: true} = {}): Promise<void> {
		if (load) {
			await this.storage.init();
			await this.load();
			return;
		}
		return this.storage.init();
	}
	public async load(): Promise<S> {
		const data = await this.storage.load();
		this.emit('update', data);
		return data;
	}
	public save(data: S): Promise<void> {
		return this.storage.save(data);
	}
}
