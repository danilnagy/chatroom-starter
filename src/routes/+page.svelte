<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createRoom,
		fetchSingleRoom,
		fetchWords,
		sendMessage,
		setUserCount,
		subscribeToMessages,
		incrementUserCount
	} from '../lib/massaging';
	import { updateUserChatroom } from '../lib/auth';
	import { formatTimestamp, parseMessage, removeHtmlTags, reloadPage } from '../lib/utils';

	import userStore, { type User } from '../lib/userStore';
	import roomStore, { type Room } from '../lib/roomStore';
	import messageStore from '../lib/messageStore';
	import wordStore from '../lib/wordStore';

	// let newRoomName: string = '';
	let message: string = '';
	let chatting: boolean = false;

	async function handleSendMessage() {
		if (user) {
			const cleanedMessage = removeHtmlTags(message);
			await sendMessage(rooms[0].id, user?.email || 'Anonymous', cleanedMessage);
			message = '';
		}
	}

	async function handleReplyMessage() {
		if (user) {
			await updateUserChatroom(user?.uid, rooms[0].id);
			await incrementUserCount(rooms[0].id);
			chatting = true;

			const cleanedMessage = removeHtmlTags(message);
			await sendMessage(rooms[0].id, user?.email || 'Anonymous', cleanedMessage);
			message = '';
		}
	}

	async function handleLeaveRoom() {
		if (user) {
			await updateUserChatroom(user?.uid, '');
			await setUserCount(rooms[0].id, 0);
			chatting = false;
			message = '';
			reloadPage();
		}
	}

	async function handleCreateRoom() {
		if (user) {
			const newRoomId = await createRoom('');
			await updateUserChatroom(user?.uid, newRoomId);

			const cleanedMessage = removeHtmlTags(message);
			await sendMessage(newRoomId, user?.email || 'Anonymous', cleanedMessage);

			reloadPage();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (event.shiftKey) {
				// Create a new line
				message += '\n';
			} else {
				// Prevent default behavior (new line) and submit the form
				event.preventDefault();
				handleReplyMessage();
			}
		}
	}

	let user: User | null;

	// Reactive statement that runs when `user` is set
	$: if (user) {
		fetchWords();

		if (user.currentRoomId) {
			roomStore.set([{ id: user.currentRoomId, name: '', timestamp: 0 }]);

			console.log(`Subscribing User: ${user.email} to Room: ${user.currentRoomId}`);
			subscribeToMessages(user.currentRoomId, (newMessages) => {
				console.log('newMessages', newMessages);
				messageStore.set(newMessages);
			});
			chatting = true;
		} else {
			fetchSingleRoom(user, (newMessages) => {
				messageStore.set(newMessages);
			});
		}
	}

	$: user = $userStore;
	$: rooms = $roomStore;
	$: messages = $messageStore;
	$: words = $wordStore;

	$: lastMessages = messages.length > 0 ? [messages[messages.length - 1]] : [];

	onMount(async () => {});
</script>

<div>
	{#if user}
		<div class="container">
			{#if messages.length === 0}
				<p>No rooms to join</p>
			{/if}
			<div class="messages">
				{#each chatting ? messages : lastMessages as message (message.timestamp)}
					<div>
						<strong>{message.from}</strong> <em>({formatTimestamp(message.timestamp)})</em>: {@html parseMessage(
							message.content,
							words
						)}
					</div>
				{/each}
			</div>
			<form>
				<textarea
					bind:value={message}
					placeholder="Type a message"
					required
					on:keydown={handleKeydown}
				/>
				<div class="buttonGroup">
					{#if chatting}
						<button on:click|preventDefault={handleSendMessage}>Send</button>
						<button on:click|preventDefault={handleLeaveRoom}>Leave</button>
					{:else}
						{#if messages.length > 0}
							<button on:click|preventDefault={handleReplyMessage}>Reply</button>
						{/if}
						<button on:click|preventDefault={handleCreateRoom}>New</button>
					{/if}
				</div>
			</form>
		</div>
	{/if}
</div>

<style lang="scss">
	.container {
		background-color: white;
		margin: 1em;
		overflow: clip;

		.messages {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
	}
	.row {
		display: flex;
		gap: 1rem;
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	form {
		padding-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;

		textarea {
			padding: 0.5rem;
		}

		.buttonGroup {
			align-self: center;
			display: flex;
			gap: 1rem;
		}
	}
</style>
