<script lang="ts">
	import { onMount } from 'svelte';
	import {
		clearRoom,
		createRoom,
		fetchRoom,
		fetchWords,
		sendMessage,
		setUserCount,
		incrementUserCount,
		incrementMessageCount
	} from '../lib/massaging';
	import { updateUserRoom, updateUserTimestamp } from '../lib/auth';
	import { formatTimestamp, parseMessage, removeHtmlTags, reloadPage } from '../lib/utils';

	import userStore from '../store/userStore';
	import usersStore from '../store/usersStore';
	import roomStore from '../store/roomStore';
	import messageStore from '../store/messageStore';
	import wordStore from '../store/wordStore';

	import Modal from '../components/Modal.svelte';

	let message: string = '';

	let isModalOpen = false;

	function openModal() {
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

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
			if (cleanedMessage.length > 0) {
				await sendMessage(room.id, user, cleanedMessage);
				await incrementMessageCount(room.id);
				await updateUserTimestamp(user);
				trackPageClick(cleanedMessage);
			}
			message = '';
		}
	}

	// joining room
	async function handleReplyMessage() {
		if (user && room) {
			const cleanedMessage = removeHtmlTags(message);
			if (cleanedMessage.length > 0) {
				await updateUserRoom(user, room.id);
				await incrementUserCount(room.id);

				await sendMessage(room.id, user, cleanedMessage);
				await incrementMessageCount(room.id);
				await updateUserTimestamp(user);
				trackPageClick(cleanedMessage);
			}
			message = '';
		}
	}

	async function handleLeaveRoom() {
		if (user && room) {
			await updateUserRoom(user, '');
			await setUserCount(room.id, 0);
			await updateUserTimestamp(user);

			reloadPage();
		}
	}

	async function handleCreateRoom() {
		if (user) {
			const cleanedMessage = removeHtmlTags(message);
			if (cleanedMessage.length > 0) {
				const newRoomId = await createRoom('');
				await updateUserRoom(user, newRoomId);
				await sendMessage(newRoomId, user, cleanedMessage);
				await incrementMessageCount(newRoomId);
				await updateUserTimestamp(user);
				trackPageClick(cleanedMessage);
			}
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
	<!-- <button on:click={openModal}>Open Modal</button> -->
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
				<tr>
					<td class="grey"><strong>You</strong></td>
					<td width="99%">
						<form>
							<textarea
								bind:value={message}
								placeholder="Type a message"
								required
								on:keydown={handleKeydown}
							/>
							<div class="buttonGroup">
								{#if chatting}
									<button class="primary" on:click|preventDefault={handleSendMessage}>Send</button>
									<button class="secondary" on:click|preventDefault={handleLeaveRoom}>Leave</button>
								{:else}
									{#if messages.length > 0}
										<button on:click|preventDefault={handleReplyMessage}>Join</button>
									{/if}
									<button class="primary" on:click|preventDefault={handleCreateRoom}>Start</button>
								{/if}
							</div>
						</form>
					</td>
				</tr>
			</table>
		</div>
	{/if}
	<Modal title="My Modal" isOpen={isModalOpen} on:close={closeModal}>
		<p>This is the content of the modal.</p>
	</Modal>
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
		// padding-top: 2rem;
		width: 100%;
		display: flex;
		gap: 1rem;

		textarea {
			min-height: 150px;
			flex-grow: 1;
			padding: 0px;
			border-radius: 0;
			border: 0;
			font-size: 1em;
			resize: vertical; /* allows resizing only vertically */
			outline: none; /* removes the default focus outline */
		}

		.buttonGroup {
			height: 100%;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
	}
	.grey {
		color: #777777;
	}

	@media (max-width: 700px) {
		form {
			flex-direction: column;
		}
	}
</style>
