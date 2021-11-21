import * as EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

interface StorageEvents<S = any> {
	update: (data: S) => void;
}

export abstract class Storage<S = any> extends (EventEmitter as {new <S>(): TypedEmitter<StorageEvents<S>>})<S> {
	private initPromise: Promise<void> | undefined;
	protected abstract handleInit(): Promise<void>;
	protected abstract handleLoad(): Promise<S>;
	protected abstract handleSave(data: S): Promise<void>;
	constructor() {
		super();
		this.init();
	}
	public init(): Promise<void> {
		if (!this.initPromise) {
			this.initPromise = this.handleInit();
		}
		return this.initPromise;
	}
	public load(): Promise<S> {
		return this.handleLoad();
	}
	public save(data: S): Promise<void> {
		return this.handleSave(data);
	}
}
