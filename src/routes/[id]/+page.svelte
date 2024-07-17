<script lang="ts">
	import { onMount } from 'svelte';

	import { sendMessage, subscribeToMessages, fetchRooms, fetchWords } from '../../lib/massaging';
	import { formatTimestamp, parseMessage, removeHtmlTags } from '../../lib/utils';

	import { page } from '$app/stores';
	import userStore, { type User } from '../../lib/userStore';
	import roomStore from '../../lib/roomStore';
	import messageStore from '../../lib/messageStore';
	import wordStore from '../../lib/wordStore';

	let message: string = '';

	async function handleSendMessage() {
		const cleanedMessage = removeHtmlTags(message);
		await sendMessage(chatroomId, user?.email || 'Anonymous', cleanedMessage);
		message = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (event.shiftKey) {
				// Create a new line
				message += '\n';
			} else {
				// Prevent default behavior (new line) and submit the form
				event.preventDefault();
				handleSendMessage();
			}
		}
	}

	let user: User | null;

	// Reactive statement that runs when `user` is set
	$: if (user) {
		console.log(`Subscribing User: ${user.email} to messages from Room: ${chatroomId}`);
		subscribeToMessages(chatroomId, (newMessages) => {
			messageStore.set(newMessages);
		});
		fetchRooms();
	}

	$: user = $userStore;
	$: messages = $messageStore;
	$: rooms = $roomStore;
	$: words = $wordStore;

	onMount(async () => {
		fetchWords();
	});

	interface RoomLookup {
		[key: string]: string;
	}

	$: roomLookup = rooms.reduce((lookup, room) => {
		lookup[room.id] = room.name;
		return lookup;
	}, {} as RoomLookup);

	const { id: chatroomId } = $page.params;
</script>

<div>
	<div class="container">
		<a href="/">{`Back`}</a>
	</div>
	{#if user}
		<div class="container">
			<h2>{roomLookup[chatroomId]}</h2>
			<div class="messages">
				{#each messages as message (message.timestamp)}
					<div>
						<strong>{message.from}</strong> <em>({formatTimestamp(message.timestamp)})</em>: {@html parseMessage(
							message.content,
							words
						)}
					</div>
				{/each}
			</div>
			<form on:submit|preventDefault={handleSendMessage}>
				<textarea
					bind:value={message}
					placeholder="Type a message"
					required
					on:keydown={handleKeydown}
				/>
				<button type="submit">Send</button>
			</form>
		</div>
	{/if}
</div>

<style lang="scss">
	.container {
		background-color: white;
		margin: 1rem;
		overflow: clip;

		.messages {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
	}
	form {
		padding-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;

		textarea {
			padding: 0.5rem;
		}

		button {
			align-self: center;
		}
	}
</style>
