<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment'; // Import the browser environment flag
	import {
		logIn,
		logOut,
		signUp,
		resetPassword,
		sendSignInLink,
		reAuth,
		deleteUserAccount,
		updateUserRoom,
		updateUserTimestamp,
		updateUserUserName
	} from '../lib/auth';
	import { updateRoom } from '../lib/massaging';
	import userStore, { type User } from '../store/userStore';
	import roomStore from '../store/roomStore';
	import { reloadPage, validateEmail } from '../lib/utils';
	import '../app.css';
	import Modal from '../components/Modal.svelte';
	import { modalState, closeModal, openModal, toggleState } from '../store/modalStore';
	import messageStore from '../store/messageStore';
	import { menuOpenStore, popupVisible, scrolling } from '../store/eventStore';
	import { firebaseErrorMessages } from '../lib/firebaseErrorMessages';

	let error = '';
	let warning = '';

	let userName: string = '';
	let email: string = '';
	let password: string = '';

	let hideSendLoginLink: boolean = true;
	let contextMessage: string = '';

	function clearWarning() {
		warning = '';
	}
	function clearError() {
		error = '';
	}

	function closeAndResetModal() {
		userName = '';
		email = '';
		password = '';
		clearError();
		clearWarning();
		closeModal();
	}

	function handleToggleState() {
		error = '';
		toggleState();
	}

	function getFirebaseErrorKey(errorMessage: string): string | undefined {
		const match = errorMessage.match(/\(([^)]+)\)/);
		return match ? match[1] : undefined;
	}

	async function handleSignUp() {
		try {
			// Check if userName is empty
			if (!userName) {
				throw new Error('Please enter a username.');
			}
			await signUp(userName, email, password);
			closeAndResetModal();
		} catch (e) {
			if (e instanceof Error) {
				const errorKey = getFirebaseErrorKey(e.message);
				error =
					errorKey && firebaseErrorMessages[errorKey]
						? firebaseErrorMessages[errorKey]
						: 'Sign Up Failed: ' + e.message;
			} else {
				error = 'Sign Up Failed: An unknown error occurred';
			}
		}
	}

	async function handleLogIn() {
		try {
			await logIn(email, password);
			closeAndResetModal();
		} catch (e) {
			if (e instanceof Error) {
				const errorKey = getFirebaseErrorKey(e.message);
				error =
					errorKey && firebaseErrorMessages[errorKey]
						? firebaseErrorMessages[errorKey]
						: 'Log In Failed: ' + e.message;
				hideSendLoginLink = ['auth/invalid-email'].includes(errorKey || '');
			} else {
				error = 'Log In Failed: An unknown error occurred';
			}
		}
	}

	async function handleResetPassword() {
		if (user?.email) {
			try {
				await resetPassword(user.email);
				contextMessage = 'Link sent';
				// warning = `Reset password link was sent to ${user.email}`;
			} catch (e) {
				if (e instanceof Error) {
					console.warn('Error resetting password: ' + e.message);
					contextMessage = 'Error: ' + e.message;
				} else {
					contextMessage = 'Error resetting password';
				}
			}
		}
	}

	async function handleSendSignInLink() {
		if (!validateEmail(email)) {
			error = 'Please enter a valid email address.';
			return;
		}

		try {
			await sendSignInLink(email);
			error = '';
			warning = `Sign in link was sent to ${email}`;
		} catch (e) {
			if (e instanceof Error) {
				error = 'Send link failed: ' + e.message;
			} else {
				error = 'Send link failed: An unknown error occurred';
			}
			hideSendLoginLink = true;
		}
	}

	function handleChangeInfo() {
		userName = user?.userName ? user.userName : '';
		openModal('CHANGEINFO', () => {});
	}

	async function handleUpdateUserName() {
		try {
			// Check if userName is empty
			if (!userName) {
				throw new Error('Please enter a username.');
			}
			if (user) {
				await updateUserUserName(user, userName);
				reloadPage();
			}
		} catch (e) {
			if (e instanceof Error) {
				error = 'Change Username failed: ' + e.message;
			} else {
				error = 'Change Username failed: An unknown error occurred';
			}
		}
	}

	async function handleLeaveRoom() {
		if (user) {
			await updateUserRoom(user, '');
			await updateUserTimestamp(user);
		}
		if (room) {
			await updateRoom(room.id, {
				// userCount: 0,
				open: false
			});
		}
	}

	function handleClickDeleteAccount() {
		openModal('DELETEACCOUNT', () => {});
	}

	async function handleDeleteAccount() {
		if (user?.firebaseUser) {
			try {
				await reAuth(user?.firebaseUser, email, password);
				await handleLeaveRoom();
				await deleteUserAccount(user?.firebaseUser);
				reloadPage();
			} catch (e) {
				if (e instanceof Error) {
					const errorKey = getFirebaseErrorKey(e.message);
					error =
						errorKey && firebaseErrorMessages[errorKey]
							? firebaseErrorMessages[errorKey]
							: 'Delete Account Failed: ' + e.message;
					hideSendLoginLink = ['auth/invalid-email'].includes(errorKey || '');
				} else {
					error = 'Delete Account Failed: An unknown error occurred';
				}
			}
		}
	}

	async function handleLogOut() {
		try {
			await logOut();
			reloadPage();
		} catch (e) {
			if (e instanceof Error) {
				alert('LogOut Failed: ' + e.message);
			} else {
				alert('LogOut Failed: An unknown error occurred');
			}
		}
	}

	$: menuOpen = $menuOpenStore;

	function handleMenuToggle() {
		console.log('Menu toggle');
		popupVisible.set(false);
		menuOpenStore.set(!menuOpen);
	}

	$: user = $userStore;
	$: room = $roomStore;
	$: state = $modalState;
	$: messages = $messageStore;

	let numMessages = 0;

	async function scrollToBottom(smooth = true) {
		if (browser) {
			await tick();
			document.documentElement.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: smooth ? 'smooth' : 'instant' // Optional: use 'smooth' for smooth scrolling
			});
		}
	}

	$: if (messages.length > 0) {
		console.log('Messages received:', messages.length);
		scrollToBottom(numMessages > 0); // instant scroll on first message load
		numMessages = messages.length;
	}

	$: leavePopupVisible = $popupVisible;

	function handleSroll(event: any) {
		const target = event.target.scrollingElement;
		console.log(target.clientHeight, target.scrollHeight, target.scrollTop);
		if (target.scrollTop < target.scrollHeight - target.clientHeight - 60) {
			scrolling.set(true);
		} else {
			scrolling.set(false);
		}
	}

	// Add the event listener when the component is mounted
	onMount(() => {
		window.addEventListener('scroll', handleSroll);

		// Cleanup the event listener when the component is destroyed
		return () => {
			window.removeEventListener('scroll', handleSroll);
		};
	});
</script>

<div class="wrapper">
	<div
		class="top-bar-container"
		on:wheel|preventDefault={() => {}}
		on:touchmove|preventDefault={() => {}}
	>
		<div class="top-bar">
			<div><h2>tincann.ing</h2></div>
			{#if user}
				<div class="top-form">
					<button class="no-border" on:click={handleMenuToggle}>
						<div>
							{`${user.userName || user.email}`}{user.rating
								? ` (${user.rating.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })})`
								: ''}
						</div>
						<div class={`${menuOpen ? 'rotate-45' : ''} trans icon`}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-6"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
						</div>
					</button>
				</div>
			{:else}
				<div class="top-form">
					<div class="button-group">
						<button class="no-border" on:click={() => openModal('LOGIN', () => {})}
							><strong>Log In</strong></button
						>
						<span>|</span>
						<button class="no-border" on:click={() => openModal('SIGNUP', () => {})}>Sign Up</button
						>
					</div>
				</div>
			{/if}
		</div>
		<div class={`${menuOpen ? 'show-menu' : ''} menu`}>
			<div class="menu-content">
				<p>
					<strong
						>Conversing Score:<span style="font-family: 'Courier New', Courier, monospace;"
							>{` ${user?.rating?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '5.0'} / 10`}</span
						></strong
					>
				</p>
				<p>
					Your Conversing Score reflects the quality and length of your conversations. Only you can
					see it, but your conversation partners will typically have a similar score to yours. In
					other words, the better you are to your fellow human, the better they will be to you.
				</p>
			</div>
			<div class="menu-content">
				<button class="link dark" on:click={handleChangeInfo}>Change Username</button>
				{#if contextMessage}
					<button class="link dark" disabled>{contextMessage}</button>
				{:else}
					<button class="link dark" on:click={handleResetPassword}>Reset Password</button>
				{/if}
				<button class="link dark" on:click={handleClickDeleteAccount}>Close Account</button>
				<button class="link dark" on:click={handleLogOut}>Log Out</button>
			</div>
		</div>
	</div>

	<div
		class={`${menuOpen ? 'show-menu ' : ''}${leavePopupVisible ? 'no-scroll ' : ''}content-container`}
	>
		<div class={`${menuOpen ? 'show-menu' : ''} content`}>
			<slot />
		</div>
	</div>

	<Modal showHeader={true} isOpen={state.isOpen} on:close={closeAndResetModal}>
		{#if warning}
			<div class="message-box warning">
				<div class="message">{warning}</div>
				<!-- <div class="close-container">
					<button class="no-border-dark" on:click={clearWarning}>&times;</button>
				</div> -->
			</div>
		{/if}
		{#if error}
			<div class="message-box error">
				<div class="message">
					{error}
					{#if ['LOGIN', 'DELETEACCOUNT'].includes(state.state) && !hideSendLoginLink}
						<button class="link dark" on:click={handleSendSignInLink}>Send login link</button>
					{/if}
				</div>
				<!-- <div class="close-container">
					<button class="no-border-dark" on:click={clearError}>&times;</button>
				</div> -->
			</div>
		{/if}
		{#if state.state === 'SIGNUP'}
			<div class="two-col">
				<div class="col">
					<p>Please choose an anonymous username.</p>
					<p>We request an email address only to help prevent bots and other abuses of the site.</p>
					<p>
						Your email is encrypted such that all we see are the random username and password
						combinations created here.
					</p>
				</div>
				<div class="col min">
					<div class="login-form">
						<div class="form-section">
							<div class="label">Username</div>
							<input
								class="dark"
								type="text"
								bind:value={userName}
								placeholder=""
								maxlength="11"
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
								placeholder=""
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
								placeholder=""
								on:keyup={(event) => {
									if (event.key === 'Enter') handleSignUp();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label"></div>
							<div class="button-group">
								<button class="link dark" on:click={handleToggleState}
									><strong>Log In</strong></button
								>
								<button class="primary-dark" on:click={handleSignUp}>Sign Up</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if state.state === 'LOGIN'}
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
								placeholder=""
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
								placeholder=""
								on:keyup={(event) => {
									if (event.key === 'Enter') handleLogIn();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label"></div>
							<div class="button-group">
								<button class="link dark" on:click={toggleState}><strong>Sign up</strong></button>
								<!-- <button class="link dark" on:click={toggleState}
									><strong>Email Login Link</strong></button
								> -->
								<button class="primary-dark" on:click={handleLogIn}>Log in</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if state.state === 'DELETEACCOUNT'}
			<div class="two-col">
				<div class="col">
					<p>Are you sure you want to delete your account?</p>
					<p>This action cannot be reversed.</p>
					<p>Please enter your login information to confirm.</p>
				</div>
				<div class="col min">
					<div class="login-form">
						<div class="form-section">
							<div class="label">Email</div>
							<input
								class="dark"
								type="email"
								bind:value={email}
								placeholder=""
								on:keyup={(event) => {
									if (event.key === 'Enter') handleDeleteAccount();
								}}
							/>
						</div>

						<div class="form-section">
							<div class="label">Password</div>
							<input
								class="dark"
								type="password"
								bind:value={password}
								placeholder=""
								on:keyup={(event) => {
									if (event.key === 'Enter') handleDeleteAccount();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label"></div>
							<div class="button-group">
								<button class="link dark" on:click={closeAndResetModal}
									><strong>Cancel</strong></button
								>
								<button class="primary-dark" on:click={handleDeleteAccount}>Confirm</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if state.state === 'CHANGEINFO'}
			<div class="two-col">
				<!-- <div class="col"></div> -->
				<div class="col min">
					<div class="login-form">
						<div class="form-section">
							<div class="label">Username</div>
							<input
								class="dark"
								type="text"
								bind:value={userName}
								placeholder=""
								maxlength="11"
								on:keyup={(event) => {
									if (event.key === 'Enter') handleUpdateUserName();
								}}
							/>
						</div>
						<div class="form-section">
							<div class="label"></div>
							<div class="button-group">
								<button class="link dark" on:click={closeAndResetModal}
									><strong>Cancel</strong></button
								>
								<button class="primary-dark" on:click={handleUpdateUserName}>Confirm</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</Modal>
</div>

<style lang="scss">
	$top-bar-height: 3.5rem;
	$top-bar: $top-bar-height - 2rem;
	$divider-height: 0.125rem;
	$menu-content-gap: 0;

	$top-menu-height-lg: 15rem;
	$top-menu-height-sm: 30rem;

	$top-menu-offset-lg: -1 * ($top-menu-height-lg - $top-bar-height - $divider-height);
	$top-menu-offset-sm: -1 * ($top-menu-height-sm - $top-bar-height - $divider-height);

	$content-offset-lg: $top-menu-height-lg + $menu-content-gap;
	$content-offset-sm: $top-menu-height-sm + $menu-content-gap;

	.message-box {
		// border-radius: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.25rem;
		display: flex;

		// flex-wrap: wrap;
		align-items: stretch;
		// justify-content: space-between;
		// min-height: 75px;
		.message {
			flex-grow: 1;
			// padding: 0.75rem 0;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 1rem;
		}
		.close-container {
			height: 100%;
		}
	}
	.warning {
		// background-color: rgba(255, 234, 0, 0.25);
		color: #bbbbbb;
	}
	.error {
		// background-color: #ff440010;
		// background-color: #00ffdd40;
		color: #ff4400;
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
				align-items: stretch;
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
	.menu {
		position: absolute;
		top: $top-menu-offset-lg;
		left: 0;
		right: 0;
		width: 100%;
		min-height: $top-menu-height-lg;
		max-height: $top-menu-height-lg;

		display: flex;
		flex-direction: row;
		justify-content: space-between;

		background-color: var(--color-bg-0-dark);
		color: #fff;

		// transition: top 0.5s ease-in-out;
		transition: top 0.1s;
		z-index: 10;
		max-width: 800px;
		margin: 0 auto;

		.menu-content {
			box-sizing: border-box;
			max-width: 28rem;
			margin: 0;
			padding: 1rem 2rem;
			display: flex;
			flex-direction: column;

			p {
				margin: 0.5rem 0;
			}

			button {
				padding-top: 1rem;
			}
		}

		.menu-content:last-child {
			align-items: flex-end; // Apply only to the last child
		}
	}

	.menu a {
		display: block;
		color: #fff;
		text-decoration: none;
		margin: 10px 0;
		font-size: 18px;
	}

	.menu a:hover {
		background-color: #555;
	}

	.show-menu.menu {
		top: $top-bar-height; /* Adjust this value to match the height of your top bar */
	}

	// .show-menu.content-container {
	// 	margin-top: $content-offset-lg; /* Adjust this value to match the height of the menu */
	// }

	.rotate-45 {
		transform: rotate(45deg);
	}
	.trans {
		transition: transform 0.2s;
	}
	.size-6 {
		width: 24px;
		height: 24px;
	}
	.wrapper {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;

		.top-bar-container {
			position: sticky;
			top: 0;
			z-index: 20;

			.top-bar {
				background-color: var(--color-bg-0);
				position: relative;
				z-index: 50;
				min-height: $top-bar-height;
				height: 100%;
				max-width: 800px;
				margin: 0 auto;
				padding: 0 2rem;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
		}

		.content-container {
			display: flex;
			transition: margin-top 0.1s;
			margin-top: 2px; /* Adjust this value to match the height of the menu */
			position: relative;
			.content {
				flex-grow: 1;
				position: relative;
			}
			&.no-scroll {
				.content {
					left: 0; //
				}
			}
			&.show-menu {
				margin-top: $content-offset-lg; /* Adjust this value to match the height of the menu */
			}
		}
	}
	.top-form {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		position: relative;
		right: -1rem;
	}
	.button-group {
		display: flex;
		align-items: center;
	}
	input {
		// max-width: 210px;
	}

	@media (max-width: 864px) {
		.wrapper {
			.content-container {
				.content {
					left: 0;
				}
			}
		}
		.error {
			justify-content: center;
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

	@media (max-width: 700px) {
		.menu {
			top: $top-menu-offset-sm;
			min-height: $top-menu-height-sm;
			max-height: $top-menu-height-sm;
			flex-direction: column;
			justify-content: flex-start;

			.menu-content:last-child {
				align-items: flex-start; // Apply only to the last child
			}
		}

		.wrapper {
			.content-container {
				&.show-menu {
					margin-top: $content-offset-sm; /* Adjust this value to match the height of the menu */
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
	}

	@media (max-width: 500px) {
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
		.menu {
			.menu-content {
				padding: 0.75rem;
			}
		}

		.wrapper {
			.top-bar-container {
				.top-bar {
					padding: 0 0.75rem;
				}
			}
		}
	}
</style>
