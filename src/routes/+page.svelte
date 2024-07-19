<script lang="ts">
	import { onMount } from 'svelte';
	import {
		clearRoom,
		createRoom,
		fetchRoom,
		fetchWords,
		sendMessage,
		setUserCount,
		incrementUserCount
	} from '../lib/massaging';
	import { updateUserChatroom } from '../lib/auth';
	import { formatTimestamp, parseMessage, removeHtmlTags, reloadPage } from '../lib/utils';

	import userStore from '../lib/userStore';
	import usersStore from '../lib/usersStore';
	import roomStore from '../lib/roomStore';
	import messageStore from '../lib/messageStore';
	import wordStore from '../lib/wordStore';

	let message: string = '';

	function trackPageClick(text: string) {
		if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
			window.gtag('event', 'click', {
				text
			});
		}
	}

	// already member
	async function handleSendMessage() {
		if (user && room) {
			if (room.userCount < 2) await clearRoom(room.id);

			const cleanedMessage = removeHtmlTags(message);
			await sendMessage(room.id, user, cleanedMessage);
			trackPageClick(cleanedMessage);
			message = '';
		}
	}

	// joining room
	async function handleReplyMessage() {
		if (user && room) {
			await updateUserChatroom(user, room.id);
			await incrementUserCount(room.id);

			const cleanedMessage = removeHtmlTags(message);
			await sendMessage(room.id, user, cleanedMessage);
			trackPageClick(cleanedMessage);
			message = '';
		}
	}

	async function handleLeaveRoom() {
		if (user && room) {
			await updateUserChatroom(user, '');
			await setUserCount(room.id, 0);

			reloadPage();
		}
	}

	async function handleCreateRoom() {
		if (user) {
			const newRoomId = await createRoom('');
			await updateUserChatroom(user, newRoomId);

			const cleanedMessage = removeHtmlTags(message);
			await sendMessage(newRoomId, user, cleanedMessage);
			message = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (event.shiftKey) {
				// Create a new line
				message += '\n';
			} else {
				// Prevent default behavior (new line) and submit the form
				if (chatting) handleSendMessage();
				else handleCreateRoom();
			}
		}
	}

	// let user: User | null;

	// Reactive statement that runs when `user` is set
	$: if (user?.uid) {
		fetchWords();
		fetchRoom(user);
	}

	$: user = $userStore;
	$: users = $usersStore;
	$: room = $roomStore;
	$: messages = $messageStore;
	$: words = $wordStore;

	$: lastMessages = messages.length > 0 ? [messages[messages.length - 1]] : [];

	$: chatting = user?.currentRoomId === room?.id;

	onMount(async () => {});
</script>

<div>
	{#if user}
		<div class="container">
			<table class="messages">
				{#each chatting ? messages : lastMessages as message (message.timestamp)}
					<tr class={message.uid === user.uid ? 'grey' : ''}>
						<td>
							<strong
								>{users[message.uid]?.userName ? users[message.uid].userName : message.uid}
							</strong>
						</td>
						<td width="99%">
							{@html parseMessage(message.content, words)}
						</td>
						<!-- <td><em>({formatTimestamp(message.timestamp)})</em></td> -->
					</tr>
				{/each}
			</table>
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
							<button on:click|preventDefault={handleReplyMessage}>Join</button>
						{/if}
						<button on:click|preventDefault={handleCreateRoom}>Start</button>
					{/if}
				</div>
			</form>
		</div>
	{/if}
</div>

<style lang="scss">
	em {
		font-size: 0.75rem;
		white-space: nowrap;
	}
	table {
		tr {
			td {
				padding: 0.5rem 1rem 0.5rem 0;
				vertical-align: top;
			}
			td:last-child {
				padding-right: 0;
			}
		}
	}
	.container {
		background-color: white;
		padding: 2rem 0;
		overflow: clip;
		max-width: 800px;
		margin: 0 auto;
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
	.grey {
		color: #777777;
	}
</style>
