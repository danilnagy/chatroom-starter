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

<div>
	{#if user}
		<div>
			{#each messages as message (message.timestamp)}
				<div><strong>{message.from}</strong>: {message.content}</div>
			{/each}
		</div>
		<form on:submit|preventDefault={handleSendMessage}>
			<input bind:value={message} placeholder="Type a message" required />
			<button type="submit">Send</button>
		</form>
	{/if}
</div>
