<script lang="ts">
	import { onMount } from 'svelte';
	import { subscribeToRooms, subscribeToUsers } from '../../lib/massaging';
	import { formatTimeDifference } from '../../lib/utils';

	import userStore, { type User } from '../../lib/userStore';
	import { type Room } from '../../lib/roomStore';

	let selectedRoom: Room | null;

	function onClickRoom(room: Room) {
		if (selectedRoom === room) {
			selectedRoom = null;
		} else {
			selectedRoom = room;
		}
	}

	let selectedUser: User | null;

	function onClickUser(user: User) {
		if (selectedUser === user) {
			selectedUser = null;
		} else {
			selectedUser = user;
		}
	}

	let rooms: Room[] = [];
	let users: User[] = [];

	function loadData() {
		subscribeToRooms((roomsData: Room[]) => {
			console.log('-> Incoming [roomsData]: ', roomsData);
			// process incoming rooms
			rooms = roomsData;
		});
		subscribeToUsers((usersData: User[]) => {
			console.log('-> Incoming [usersData]: ', usersData);
			// process incoming users
			users = usersData;
		});
	}

	$: filteredRooms = selectedUser
		? rooms.filter((room) => room.id === selectedUser?.currentRoomId)
		: rooms;

	$: filteredUsers = selectedRoom
		? users.filter((user) => user.currentRoomId === selectedRoom?.id)
		: users;

	// Reactive statement that runs when `user` is set
	$: if (user?.uid) {
		if (user?.email === 'danilnagy@gmail.com') {
			loadData();
		}
	}

	$: user = $userStore;

	onMount(async () => {});
</script>

<div>
	{#if user}
		<div class="container">
			<div class="two-col">
				<table class="messages">
					<thead>
						<tr>
							<th>Id</th>
							<th>timestamp</th>
							<th>userCount</th>
							<th>exposeCount</th>
							<th>messageCount</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredRooms as room (room.timestamp)}
							<tr
								class={room.userCount === 2
									? 'green'
									: room.userCount === 1
										? 'orange'
										: 'disabled'}
								on:click|preventDefault={() => onClickRoom(room)}
							>
								<td class={room === selectedRoom ? 'selected' : 'not-selected'}>
									<strong>{room.id}</strong>
								</td>
								<td><em>{formatTimeDifference(room.timestamp)}</em></td>
								<td>
									{room.userCount}
								</td>
								<td>
									{room.exposeCount}
								</td>
								<td>
									{room.messageCount}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<table class="messages">
					<thead>
						<tr>
							<th>Id/userName</th>
							<th>timestamp</th>
							<th>currentRoomId</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredUsers as user (user.timestamp)}
							<tr
								class={user.currentRoomId ? 'green' : ''}
								on:click|preventDefault={() => onClickUser(user)}
							>
								<td class={user === selectedUser ? 'selected' : 'not-selected'}>
									<strong>{user.userName ? user.userName : user.uid}</strong>
								</td>
								<td><em>{user.timestamp ? formatTimeDifference(user.timestamp) : ''}</em></td>
								<td>
									{user.currentRoomId}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	em {
		font-size: 0.75rem;
		white-space: nowrap;
	}
	table {
		border-collapse: collapse;
		tr {
			border-left: 5px solid rgba(0, 0, 0, 0);
			transition: background-color 0.3s ease-in-out;

			th,
			td {
				padding: 0.5rem 1rem;
				vertical-align: top;
			}
		}
		tr:hover {
			border-color: rgba(0, 0, 0, 0.5);
		}
	}
	.container {
		background-color: white;
		padding: 2rem 0;
		margin: 0 auto;
		.two-col {
			display: flex;
			justify-content: center;
			align-items: flex-start;
			gap: 2rem;
		}
	}
	form {
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
	.green {
		background-color: #9fe196;
	}
	.orange {
		background-color: #f2bca5;
	}
	.disabled {
		font-style: italic;
		color: #b0b0b0;
	}
	.not-selected {
	}
	.selected {
		border-left: 5px solid rgb(0, 0, 0);
	}

	@media (max-width: 700px) {
		form {
			flex-direction: column;
		}
	}
</style>
