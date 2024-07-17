<script lang="ts">
	import { createRoom } from '../lib/massaging';

	import userStore from '../lib/userStore';
	import roomStore from '../lib/roomStore';

	let newRoomName: string = '';

	async function handleCreateRoom() {
		if (newRoomName.trim()) {
			await createRoom(newRoomName);
			newRoomName = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			// Prevent default behavior (new line) and submit the form
			event.preventDefault();
			handleCreateRoom();
		}
	}

	$: user = $userStore;
	$: rooms = $roomStore;
</script>

<div>
	{#if user}
		<div class="container">
			<h2>Rooms</h2>
			<ul>
				{#each rooms as room}
					<li><a href={`/${room.id}`}>{room.name}</a></li>
				{/each}
			</ul>
			<div class="row">
				<input bind:value={newRoomName} placeholder="New room name" on:keydown={handleKeydown} />
				<button on:click={handleCreateRoom}>New room</button>
			</div>
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
</style>
