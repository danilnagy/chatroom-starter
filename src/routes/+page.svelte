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
	import { updateUserRoom, updateUserTimestamp, logIn, signUp, resetPassword } from '../lib/auth';
	import { formatTimestamp, parseMessage, removeHtmlTags, reloadPage } from '../lib/utils';

	import userStore from '../store/userStore';
	import usersStore from '../store/usersStore';
	import roomStore from '../store/roomStore';
	import messageStore from '../store/messageStore';
	import wordStore from '../store/wordStore';
	import loadedStore from '../store/loadedStore';
	import { modalState, closeModal, openModal, toggleState } from '../store/modalStore';

	import Modal from '../components/Modal.svelte';

	let message: string = '';

	let userName: string = '';
	let email: string = '';
	let password: string = '';
	let error = '';
	let warning = '';

	function clearWarning() {
		warning = '';
	}
	function clearError() {
		error = '';
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
				openModal(true, async () => {});
			}
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
				await updateUserTimestamp(user);

				await incrementMessageCount(newRoomId);

				trackPageClick(cleanedMessage);

				reloadPage();
			}
			message = '';
		} else {
			openModal(true, async () => {});
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

	function handleToggleState() {
		error = '';
		toggleState();
	}

	async function handleSignUp() {
		try {
			await signUp(userName, email, password);
			userName = '';
			email = '';
			password = '';
			error = '';
			closeModal();
		} catch (e) {
			if (e instanceof Error) {
				error = 'Sign Up Failed: ' + e.message;
			} else {
				error = 'Sign Up Failed: An unknown error occurred';
			}
		}
	}

	async function handleLogIn() {
		try {
			await logIn(email, password);
			userName = '';
			email = '';
			password = '';
			error = '';
			closeModal();
		} catch (e) {
			if (e instanceof Error) {
				error = 'Log In Failed: ' + e.message;
			} else {
				error = 'Log In Failed: An unknown error occurred';
			}
		}
	}

	async function handleResetPassword() {
		try {
			await resetPassword(email);
			error = '';
			warning = `Reset password link was sent to [${email}]`;
		} catch (e) {
			if (e instanceof Error) {
				error = 'Reset Password Failed: ' + e.message;
			} else {
				error = 'Reset Password Failed: An unknown error occurred';
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

	$: state = $modalState;

	onMount(async () => {
		console.log(chatting);
		fetchWords();
	});
</script>

<div>
	<!-- <button on:click={openModal}>Open Modal</button> -->
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
		{:else}
			<p>Loading...</p>
		{/if}
	</div>
	<Modal showHeader={true} isOpen={state.isOpen} on:close={closeModal}>
		{#if warning}
			<div class="message-box warning">
				<div class="message">{warning}</div>
				<button class="no-border-dark" on:click={clearWarning}>&times;</button>
			</div>
		{/if}
		{#if error}
			<div class="message-box error">
				<div class="message">{error}</div>
				{#if !state.signUpState}
					<button class="link-dark" on:click={handleResetPassword}>Reset password?</button>
				{/if}
				<button class="no-border-dark" on:click={clearError}>&times;</button>
			</div>
		{/if}
		{#if state.signUpState}
			<div class="two-col">
				<div class="col">
					<p>Please choose an anonymous username.</p>
					<p>
						We request an email address only to help prevent bots and other abuses off the site.
					</p>
					<p>
						The address is encrypted such that we can't even see it. The only identifying data we
						have on users is the random username and password combinations they create here.
					</p>
				</div>
				<div class="col min">
					<div class="login-form">
						<div class="form-section">
							<div class="label">User name</div>
							<input
								class="dark"
								type="text"
								bind:value={userName}
								placeholder="User name"
								on:keyup={(event) => {
									if (event.key === 'Enter') handleSignUp();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label">Email</div>
							<input
								class="dark"
								type="email"
								bind:value={email}
								placeholder="Email"
								on:keyup={(event) => {
									if (event.key === 'Enter') handleSignUp();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label">Password</div>
							<input
								class="dark"
								type="password"
								bind:value={password}
								placeholder="Password"
								on:keyup={(event) => {
									if (event.key === 'Enter') handleSignUp();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label"></div>
							<div class="button-group">
								<button class="link-dark" on:click={handleToggleState}>Log In</button>
								<button class="primary-dark" on:click={handleSignUp}>Sign Up</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="two-col">
				<!-- <div class="col"></div> -->
				<div class="col min">
					<div class="login-form">
						<div class="form-section">
							<div class="label">Email</div>
							<input
								class="dark"
								type="email"
								bind:value={email}
								placeholder="Email"
								on:keyup={(event) => {
									if (event.key === 'Enter') handleLogIn();
								}}
							/>
						</div>

						<div class="form-section">
							<div class="label">Password</div>
							<input
								class="dark"
								type="password"
								bind:value={password}
								placeholder="Password"
								on:keyup={(event) => {
									if (event.key === 'Enter') handleLogIn();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label"></div>
							<div class="button-group">
								<button class="link-dark" on:click={toggleState}>Sign up</button>
								<button class="primary-dark" on:click={handleLogIn}>Log in</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</Modal>
</div>

<style lang="scss">
	.message-box {
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		padding: 1rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		// justify-content: space-between;
		.message {
			flex-grow: 1;
		}
	}
	.warning {
		background-color: rgba(255, 234, 0, 0.25);
	}
	.error {
		background-color: rgba(255, 0, 0, 0.25);
	}
	.two-col {
		display: flex;
		justify-content: flex-end;
		gap: 2rem;
		.col {
			flex: 1 0 0;
			max-width: 360px;
			.login-form {
				display: flex;
				flex-direction: column;
				gap: 1rem;
				.form-section {
					display: flex;
					align-items: center;
					gap: 1rem;
					.label {
						width: 100px;
					}
					.button-group {
						display: flex;
						flex-grow: 1;
						justify-content: space-between;
						button {
							flex: 1;
							text-align: left;
						}
					}
					input {
						flex-grow: 1;
					}
				}
			}
		}
		.min {
			min-width: 360px;
		}
		p {
			margin-top: 0;
		}
		p:last-child {
			margin-bottom: 0;
		}
	}
	em {
		font-size: 0.75rem;
		white-space: nowrap;
	}
	table {
		width: 100%;
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

	@media (max-width: 400px) {
		.two-col {
			.col {
				.login-form {
					.form-section {
						flex-direction: column;
						align-items: stretch;
					}
				}
			}
		}
	}

	@media (max-width: 500px) {
		.two-col {
			.col {
				width: 100%;
				min-width: inherit;
				max-width: inherit;
				.login-form {
					.form-section {
					}
				}
			}
		}
		tr {
			display: flex;
			flex-direction: column;
		}
	}

	@media (max-width: 800px) {
		.error {
			justify-content: center;
		}
		form {
			flex-direction: column;
		}
		.two-col {
			flex-direction: column;
			align-items: center;
			.col {
				.login-form {
					.form-section {
					}
				}
			}
		}
	}
</style>
