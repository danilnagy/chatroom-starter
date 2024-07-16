import { writable } from 'svelte/store';
import { type Message } from '../lib/massaging';

const messageStore = writable<Message[]>([]);

export default messageStore;
