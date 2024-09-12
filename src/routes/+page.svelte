<script lang="ts">
	import { onMount } from 'svelte';
	import {
		clearRoom,
		createRoom,
		fetchRoom,
		fetchWords,
		sendMessage,
		updateRoom,
		incrementUserCount,
		incrementMessageCount
	} from '../lib/massaging';
	import {
		addUserRating,
		getLastFiveRatings,
		updateUserRoom,
		updateUserRating,
		updateUserTimestamp
	} from '../lib/auth';
	import { formatTimestamp, parseMessage, removeHtmlTags, reloadPage } from '../lib/utils';

	import userStore from '../store/userStore';
	import usersStore from '../store/usersStore';
	import roomStore from '../store/roomStore';
	import messageStore from '../store/messageStore';
	import wordStore from '../store/wordStore';
	import loadedStore from '../store/loadedStore';
	import { openModal } from '../store/modalStore';

	import RadioPicker from '../components/RadioPicker.svelte';

	let message: string = '';
	let leavePopupVisible: boolean = false;

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
		if (room) {
			if (user) {
				const cleanedMessage = removeHtmlTags(message);
				if (cleanedMessage.length > 0) {
					await updateUserRoom(user, room.id);

					await sendMessage(room.id, user, cleanedMessage);
					await updateUserTimestamp(user);

					await incrementMessageCount(room.id);
					await incrementUserCount(room.id);

					trackPageClick(cleanedMessage);
				}
				message = '';
			} else {
				openModal('SIGNUP', async () => {});
			}
		}
	}

	function toggleLeavePopup() {
		leavePopupVisible = !leavePopupVisible;
	}

	async function handleLeaveRoom() {
		if (otherUserId) {
			// store new rating item
			await addUserRating(otherUserId, optionSelected);
			optionSelected = -1;

			// calculate and update other user's rating
			const ratings = await getLastFiveRatings(otherUserId);
			const averageRating =
				ratings && ratings.length > 0
					? ratings.reduce((sum, doc) => sum + doc.rating, 0) / ratings.length
					: 0;
			await updateUserRating(otherUserId, (averageRating + 1) * 2);
		}
		if (user && room) {
			await updateUserRoom(user, '');
			await updateRoom(room.id, {
				// userCount: 0,
				open: false
			});
			await updateUserTimestamp(user);
		}

		reloadPage();
	}

	async function handleCreateRoom() {
		if (user) {
			const cleanedMessage = removeHtmlTags(message);
			if (cleanedMessage.length > 0) {
				const newRoomId = await createRoom('');
				await updateUserRoom(user, newRoomId);
				await sendMessage(newRoomId, user, cleanedMessage);
				await updateUserTimestamp(user);

				await incrementMessageCount(newRoomId);

				trackPageClick(cleanedMessage);

				reloadPage();
			}
			message = '';
		} else {
			openModal('SIGNUP', async () => {});
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

	let firstUser: boolean = true;

	// Reactive statement that runs when `user` is set
	$: if (user?.uid) {
		console.log('Loaded user', user);
		if (firstUser) {
			firstUser = false;
			fetchRoom(user);
		}
	} else {
		setTimeout(() => {
			if (!user?.uid) {
				console.log('No user');
				fetchRoom(null);
			}
		}, 1000);
	}

	$: user = $userStore;
	$: users = $usersStore;
	$: room = $roomStore;
	$: messages = $messageStore;
	$: words = $wordStore;
	$: loaded = $loadedStore;

	$: lastMessages = messages.length > 0 ? [messages[messages.length - 1]] : [];

	$: chatting = user && user.currentRoomId && room && room.id && user.currentRoomId === room.id;

	$: otherUserId = Object.keys(users).filter((userId) => userId !== user?.uid)[0];

	$: otherUserName = Object.keys(users)
		.map((userId) => users[userId].userName || 'Anonymous')
		.filter((userName) => userName !== 'You')[0];

	$: optionsList = [
		'Definitely!',
		'Sure',
		'No opinion',
		"I'd rather not",
		`${otherUserName} should be banned!`
	];
	let optionSelected = -1;

	onMount(async () => {
		console.log(chatting);
		fetchWords();
	});
</script>

<div class="wrapper">
	<div class="top-overlay">
		{#if chatting && room?.open && !leavePopupVisible}
			<div class="leave-link-container">
				<button class="link" on:click|preventDefault={toggleLeavePopup}>End conversation</button>
			</div>
		{/if}
		{#if leavePopupVisible}
			<div class="leave-form-container">
				<div class="menu-container">
					<div class="menu-content">
						{#if otherUserName == undefined}
							<p>
								{`Are you sure you want to close this conversation?`}
							</p>
						{:else}
							<p>
								{`Would you ever want to speak with ${otherUserName} again in life?`}
							</p>
							<RadioPicker options={optionsList} bind:selectedIndex={optionSelected} />
							<p>
								{`You cannot reconnect with ${otherUserName} on this site after ending the conversation.`}
							</p>
						{/if}
						<div class="button-group">
							<button class="primary" on:click={toggleLeavePopup}>Stay for Now</button>
							<button
								class="secondary"
								disabled={optionSelected < 0 && otherUserName != undefined ? true : undefined}
								on:click={handleLeaveRoom}>End conversation</button
							>
						</div>
					</div>
				</div>
			</div>
		{:else if chatting && !room?.open}
			<div class="leave-form-container">
				<div class="menu-container">
					<div class="menu-content">
						<p>
							{`${otherUserName} has ended the conversation. Would you ever want to speak with them again in life?`}
						</p>
						<RadioPicker options={optionsList} bind:selectedIndex={optionSelected} />
						<div class="button-group">
							<button
								class="secondary"
								disabled={optionSelected < 0 && otherUserName != undefined ? true : undefined}
								on:click={handleLeaveRoom}>Leave conversation</button
							>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="container">
		{#if loaded}
			{#if !user}
				<p>
					Share anything you want in an anonymous 1-on-1 conversation, from how your day went to
					your deepest thoughts and secrets.
				</p>
			{/if}
			<table class="messages">
				{#each chatting ? messages : lastMessages as message (message.timestamp)}
					<tr class={user && message.uid === user.uid ? 'grey' : ''}>
						<td>
							<strong
								>{users[message.uid]?.userName ? users[message.uid].userName : 'Anonymous'}
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
		{:else}
			<p>Loading...</p>
		{/if}
	</div>
</div>

<style lang="scss">
	em {
		font-size: 0.75rem;
		white-space: nowrap;
	}
	table {
		width: 100%;
		tr {
			td {
				padding: 0.5rem 2rem 0.5rem 0;
				vertical-align: top;
			}
			td:last-child {
				padding-right: 0;
			}
		}
	}
	.wrapper {
		position: relative;
	}
	.container {
		background-color: white;
		padding: 1rem;
		overflow: clip;
		max-width: 800px;
		margin: 0 auto;
		.messages {
			padding: 1rem 0;
		}
	}
	.top-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;

		.leave-link-container {
			max-width: 800px;
			margin: 0 auto;
			padding: 1rem;
			display: flex;
			justify-content: flex-end;
		}
		.leave-form-container {
			max-width: 800px;
			margin: 0 auto;

			.menu-container {
				background-color: #0e0e0e;
				height: 100%;
				margin: 0;
				padding: 2rem;
				// gap: 0.5rem;
				.menu-content {
					display: flex;
					flex-direction: column;
					gap: 2rem;
					.button-group {
						display: flex;
						gap: 1rem;
						button {
							flex: 1;
							text-align: left;
						}
					}
					p {
						color: white;
						margin: 0;
					}
				}
			}
		}
	}
	form {
		// padding-top: 2rem;
		width: 100%;
		display: flex;
		justify-content: flex-end;
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
			justify-content: flex-end;
			gap: 0.5rem;
		}
	}
	.grey {
		color: #777777;
	}

	@media (max-width: 500px) {
		tr {
			display: flex;
			flex-direction: column;
		}
		form {
			.buttonGroup {
				flex-direction: row;
			}
		}
	}

	@media (max-width: 800px) {
		form {
			flex-direction: column;
		}
		form {
			.buttonGroup {
				flex-direction: row;
			}
		}
	}
</style>
