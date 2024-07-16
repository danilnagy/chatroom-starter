<script lang="ts">
	import { sendMessage, subscribeToMessages, type Message } from '../lib/massaging';
	import userStore from '../lib/userStore';

	let messages: Message[] = [];
	let message: string = '';

	subscribeToMessages((newMessages: Message[]) => {
		messages = newMessages;
	});

	async function handleSendMessage() {
		await sendMessage(user?.email || 'Anonymous', message);
		message = '';
	}

	$: user = $userStore;
</script>

<div class="container">
	{#if user}
		<div class="messages">
			{#each messages as message (message.timestamp)}
				<div><strong>{message.from}</strong>: {message.content}</div>
			{/each}
		</div>
		<form on:submit|preventDefault={handleSendMessage}>
			<textarea bind:value={message} placeholder="Type a message" required />
			<button type="submit">Send</button>
		</form>
	{/if}
</div>

<style lang="scss">
	.container {
		background-color: white;
		margin: 1em;
		padding-top: 1rem;
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
