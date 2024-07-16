<script lang="ts">
	import { sendMessage } from '../lib/massaging';
	import userStore from '../lib/userStore';
	import messageStore from '../lib/messageStore';

	let message: string = '';

	async function handleSendMessage() {
		await sendMessage(user?.email || 'Anonymous', message);
		message = '';
	}

	$: user = $userStore;
	$: messages = $messageStore;
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
		padding: 1rem 0;
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
