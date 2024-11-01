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
		parseSignInLink,
		updateUserRoom,
		updateUserRating,
		updateUserTimestamp,
		sendVerificationEmail
	} from '../lib/auth';
	import {
		calcConversationScore,
		calcRating,
		formatTimestamp,
		parseMessage,
		removeHtmlTags,
		reloadPage
	} from '../lib/utils';

	import userStore, { type User } from '../store/userStore';
	import usersStore from '../store/usersStore';
	import roomStore from '../store/roomStore';
	import messageStore, { getMetrics } from '../store/messageStore';
	import wordStore from '../store/wordStore';
	import loadedStore from '../store/loadedStore';
	import { openModal } from '../store/modalStore';
	import { menuOpenStore, popupVisible, scrolling } from '../store/eventStore';

	import RadioPicker from '../components/RadioPicker.svelte';

	let message: string = '';
	let showWarning: boolean = true;
	let showResendLink: boolean = true;
	let textareaElement: HTMLTextAreaElement | null = null; // Initialize as null

	const maxLines = 6;
	let initialized = false;

	function resetTextArea() {
		if (textareaElement) {
			const maxHeight = `${maxLines * 20 + 32}px`;
			// textareaElement.style.height = chatting ? (screenWidth > 600 ? maxHeight : 'auto') : '52px';
			textareaElement.style.height = '72px';
			textareaElement.style.maxHeight = maxHeight; // Maximum height: 4 lines
			textareaElement.style.overflowY = 'auto'; // Hide scroll if under max height
		}
	}

	// Reactive statement to focus the textarea right after it's created
	$: if (textareaElement) {
		// Use a timeout to make sure it's in the DOM and available
		setTimeout(() => {
			if (textareaElement && !initialized) {
				initialized = true;

				resetTextArea();

				// Adjust the height as the user types
				textareaElement.addEventListener('input', () => {
					if (textareaElement) {
						const numLines = (textareaElement.scrollHeight - 32) / 20;

						if (numLines <= maxLines) {
							const newHeight = (chatting ? Math.max(numLines, 2) : numLines) * 20 + 32;
							textareaElement.style.height = `${newHeight}px`; // Grow up to 4 lines
							textareaElement.style.overflowY = 'hidden'; // Hide scroll if under max height
						} else {
							textareaElement.style.height = textareaElement.style.maxHeight; // Fixed at 4 lines
							textareaElement.style.overflowY = 'auto'; // Enable scroll if exceeds max height
						}
					}
				});

				textareaElement.focus();
			}
		}, 0);
	}

	function trackPageClick(text: string) {
		if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
			window.gtag('event', 'click', {
				text
			});
		}
	}

	async function handleSendVerificationEmail() {
		if (user) {
			sendVerificationEmail(user.firebaseUser);
			showResendLink = false;
		}
	}

	// already member
	async function handleSendMessage() {
		if (user && room) {
			if (room.userCount < 2) await clearRoom(room.id);

			const cleanedMessage = removeHtmlTags(message);
			message = '';
			resetTextArea();

			if (cleanedMessage.length > 0) {
				await sendMessage(room.id, user, cleanedMessage);
				await incrementMessageCount(room.id);
				await updateUserTimestamp(user);
				trackPageClick(cleanedMessage);
			}
		}
	}

	// joining room
	async function handleReplyMessage() {
		if (room) {
			const doReplyMessage = async (user: User) => {
				const cleanedMessage = removeHtmlTags(message);
				if (cleanedMessage.length > 0) {
					await updateUserRoom(user, room.id);

					await sendMessage(room.id, user, cleanedMessage);
					await updateUserTimestamp(user);

					await incrementMessageCount(room.id);
					await incrementUserCount(room.id);

					trackPageClick(cleanedMessage);
				}
			};
			if (user) {
				doReplyMessage(user);
				message = '';
			} else {
				openModal('SIGNUP', async (newUser: User, run: boolean) => {
					if (run) doReplyMessage(newUser);
					message = '';
				});
			}
		}
	}

	function toggleLeavePopup() {
		menuOpenStore.set(false);
		popupVisible.set(!leavePopupVisible);
	}

	async function handleLeaveRoom() {
		renderBlock = true;

		if (otherUserId) {
			const { S, R } = getMetrics(messages, user?.uid || '');
			console.log(`S: ${S} R: ${R}`);
			const conversationScore = calcConversationScore(S, R);
			console.log(`conversationScore: ${conversationScore}`);

			// store new rating item
			await addUserRating(otherUserId, 4 - optionSelected, conversationScore);
			optionSelected = -1;

			// calculate and update other user's rating
			const ratings = await getLastFiveRatings(otherUserId);

			const FScores =
				ratings
					?.map((rating) => rating.feedback)
					.filter((value) => value != undefined)
					.map((value) => (value > 0 ? value - 2 : value - 5)) || [];
			const MScores =
				ratings
					?.map((rating) => rating.conversation)
					.filter((value) => value !== undefined && value !== -Infinity) || [];

			console.log('FScores', FScores);
			console.log('MScores', MScores);

			const calculatedRating = calcRating(FScores, MScores);
			console.log('calculatedRating', calculatedRating);

			await updateUserRating(otherUserId, calculatedRating);
		}

		if (user && room) {
			await updateUserRoom(user, '');
			await updateRoom(room.id, {
				// userCount: 0,
				open: false
			});
			await updateUserTimestamp(user);
		}

		reloadPage(); // comment to DEBUG ratingsMScores
	}

	async function handleCreateRoom() {
		const doCreateRoom = async (user: User) => {
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
		};
		if (user) {
			doCreateRoom(user);
			message = '';
		} else {
			openModal('SIGNUP', async (newUser: User, run: boolean) => {
				if (run) doCreateRoom(newUser);
				message = '';
			});
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
				if (chatting) {
					handleSendMessage();
				} else {
					if (selectedTab == 0 && messages.length > 0) {
						handleReplyMessage();
					} else {
						handleCreateRoom();
					}
				}
			}
		}
	}

	function clearWarning() {
		showWarning = false;
	}

	let user: User | null;
	let firstUser = true;
	let userCheckTimeout: number | null = null;

	$: user = $userStore;

	let localLoaded: boolean = false;
	let renderBlock: boolean = false;

	// Define an async function to handle the async call
	async function loadRoom(user: User | null, callback: Function) {
		try {
			await fetchRoom(user, callback); // Call the async fetch function
			console.log('Room fetched for user:', user?.uid);
		} catch (error) {
			console.error('Error fetching room:', error);
		}
	}

	// Reactive statement to handle logged-in users
	$: if (user?.uid) {
		console.log('Loaded user', user);
		if (firstUser) {
			firstUser = false;
			loadRoom(user, () => {
				localLoaded = true;
			});
		}

		// Clear the timeout if the user is authenticated
		if (userCheckTimeout !== null) {
			clearTimeout(userCheckTimeout);
		}
	}
	// Function to handle when user remains null
	function handleUserNeverAuthenticated() {
		console.log('No user');
		loadRoom(null, () => {
			localLoaded = true;
		});
		// Add any additional logic you want here
	}

	$: users = $usersStore;
	$: room = $roomStore;
	$: messages = $messageStore;
	$: words = $wordStore;

	$: leavePopupVisible = $popupVisible;

	$: lastMessages = messages.length > 0 ? [messages[messages.length - 1]] : [];

	$: chatting = user && user.currentRoomId && room && room.id && user.currentRoomId === room.id;

	$: otherUserId = Object.keys(users).filter((userId) => userId !== user?.uid)[0];

	$: allUserNames = Object.keys(users).map((userId) => users[userId].userName || 'Anonymous');

	$: otherUserName = allUserNames.filter((userName) => userName !== user?.userName)[0];

	$: minUserNameWidth = Math.max(...allUserNames.map((name) => name.length)) * 16; // calc min required width based on max character width in pixels

	$: optionsList = [
		'Definitely!',
		'Sure',
		'No opinion',
		"I'd rather not",
		`${otherUserName} should be banned!`
	];
	let optionSelected = -1;

	let selectedTab = 0;

	$: isScrolling = $scrolling;

	$: menuOpen = $menuOpenStore;

	let screenWidth = 0;

	// Function to update screen width
	const updateScreenWidth = () => {
		screenWidth = window.innerWidth;
	};

	// Only run this code on the client
	onMount(() => {
		updateScreenWidth(); // Set initial screen width
		window.addEventListener('resize', updateScreenWidth);

		// Cleanup the event listener when component is destroyed
		return () => {
			window.removeEventListener('resize', updateScreenWidth);
		};
	});

	// $: labelReply = screenWidth < 500 ? 'Reply' : 'Reply to someone';
	$: labelNew = screenWidth < 500 ? 'Start a conversation:' : 'Start a conversation:';

	onMount(async () => {
		fetchWords();
		parseSignInLink();

		// Set a timeout to check if user remains null after 2 seconds
		userCheckTimeout = window.setTimeout(() => {
			// Explicitly using window.setTimeout
			if (!user?.uid) {
				handleUserNeverAuthenticated();
			}
		}, 1000); // Adjust the timeout duration as needed
	});

	$: userNameWidth = `${minUserNameWidth}px`;
</script>

<div class="wrapper">
	{#if !renderBlock}
		<div class={`top-overlay${menuOpen ? ' menu-open' : ''}`}>
			{#if chatting && room?.open && !leavePopupVisible}
				<div class="leave-link-container">
					<div class="button-container">
						<button
							class="link"
							on:click|preventDefault={otherUserName == undefined
								? handleLeaveRoom
								: toggleLeavePopup}
						>
							End conversation
						</button>
					</div>
				</div>
			{/if}
			{#if leavePopupVisible}
				<div
					class="leave-form-container"
					on:wheel|preventDefault={() => {}}
					on:touchmove|preventDefault={() => {}}
				>
					<div class="backdrop" on:click={toggleLeavePopup}></div>
					<div class="menu-container">
						<div class="menu-content">
							<button class="modal-close" on:click={toggleLeavePopup}>&times;</button>
							<div class="menu-body">
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
							</div>
							<div class="button-group">
								<button class="secondary-dark" on:click={toggleLeavePopup}>Stay for Now</button>
								<button
									class="primary-dark"
									disabled={optionSelected < 0 && otherUserName != undefined ? true : undefined}
									on:click={handleLeaveRoom}>End conversation</button
								>
							</div>
						</div>
					</div>
				</div>
			{:else if chatting && !room?.open}
				<div class="leave-form-container">
					<div class="backdrop" on:click={() => {}}></div>
					<div class="menu-container">
						<div class="menu-content">
							<!-- <button class="modal-close" on:click={toggleLeavePopup}>&times;</button> -->
							<div class="menu-body">
								<p>
									{`${otherUserName} is leaving the conversation. Would you ever want to speak with them again in life?`}
								</p>
								<RadioPicker options={optionsList} bind:selectedIndex={optionSelected} />
							</div>
							<div class="button-group">
								<button
									class="secondary-dark"
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
			{#if localLoaded}
				{#if user && !user?.verified && showWarning}
					<div class="message-box error">
						<div class="message">
							<div>
								Please check your email for a verification link and click the link to verify your
								account.
							</div>
							{#if showResendLink}
								<button class="link" on:click={handleSendVerificationEmail}>Resend email</button>
							{:else}
								<button class="link" disabled>Email sent</button>
							{/if}
						</div>
						<!-- <button class="no-border-clear" on:click={clearWarning}>&times;</button> -->
					</div>
				{/if}
				<!-- {#if !user}
					<p>
						Share anything you want in an anonymous 1-on-1 conversation, from how your day went to
						your deepest thoughts and secrets.
					</p>
				{/if} -->
				<div class={`messages-wrapper${chatting ? '' : ' border'}`}>
					{#if !chatting}
						<!-- <div class="tabs">
							{#if messages.length > 0}
								<div
									class={`tab${selectedTab == 0 ? '' : ' hidden'}`}
									on:click={() => {
										if (selectedTab === 0) handleUserNeverAuthenticated();
										else selectedTab = 0;
									}}
								>
									<div class="label">{labelReply}</div>
								</div>
							{/if}
							<div
								class={`tab${selectedTab == (messages.length > 0 ? 1 : 0) ? '' : ' hidden'}`}
								on:click={() => {
									selectedTab = messages.length > 0 ? 1 : 0;
								}}
							>
								<div class="label">{labelNew}</div>
							</div>
						</div> -->
						<!-- {#if !(messages.length > 0 && selectedTab == 0)}
							<div><strong>{labelNew}</strong></div>
						{/if} -->
					{/if}
					<div class={`messages${chatting ? '' : ' border'}`}>
						<table>
							{#if selectedTab == 0}
								{#each chatting ? messages : lastMessages as message, messageIndex (message.timestamp)}
									<tr
										class={`${user && message.uid === user.uid ? 'grey' : ''}${chatting ? ' column' : ''}`}
									>
										{#if screenWidth > 600 || !(messageIndex > 0 && message.uid === (chatting ? messages : lastMessages)[messageIndex - 1].uid)}
											<td
												style="margin-top: {screenWidth > 600
													? '0'
													: '1rem'}; min-width: {userNameWidth}"
											>
												{#if !(messageIndex > 0 && message.uid === (chatting ? messages : lastMessages)[messageIndex - 1].uid)}
													<div class="user-name">
														{(users[message.uid]?.userName
															? users[message.uid].userName
															: 'Anonymous') + (chatting ? '' : ' says:')}
													</div>
												{/if}
											</td>
										{/if}
										<td
											width="99%"
											class={`${messageIndex > 0 && message.uid === (chatting ? messages : lastMessages)[messageIndex - 1].uid ? 'less-padding' : ''}`}
										>
											{@html parseMessage(message.content, words)}
										</td>
										<!-- <td><em>({formatTimestamp(message.timestamp)})</em></td> -->
									</tr>
								{/each}
							{/if}
							{#if !(messages.length > 0 && selectedTab == 0)}
								<tr><td colspan="2"><strong>{labelNew}</strong></td></tr>
							{/if}
							{#if !leavePopupVisible && !(chatting && !room?.open)}
								<tr>
									<td class={`${chatting ? 'bottom-spacer' : ''}`}></td>
								</tr>
								<tr class={`${chatting ? 'sticky border-top' : ''}`}>
									{#if screenWidth > 600 && chatting}
										<td
											class={`border-top${chatting ? ' grey' : ''}`}
											style="min-width: {userNameWidth}"
										>
											<div class="user-name">
												{user?.userName ||
													(selectedTab == 0 && messages.length > 0 ? 'You' : 'Opening message')}
											</div>
										</td>
									{/if}
									<td
										width="100%"
										class={`message${chatting ? ' chatting' : ''}`}
										colspan={chatting && screenWidth > 600 ? 1 : 2}
									>
										<form class={`${chatting ? (screenWidth > 600 ? 'left' : 'full') : ''}`}>
											<textarea
												bind:value={message}
												bind:this={textareaElement}
												placeholder={chatting || selectedTab == 1 || messages.length === 0
													? 'Type a message..'
													: 'Type a response..'}
												required
												on:keydown={handleKeydown}
											/>
											<div class={`buttonGroup${chatting && screenWidth <= 600 ? ' float' : ''}`}>
												{#if chatting}
													<button
														class="primary"
														disabled={user && !user.verified}
														on:click|preventDefault={handleSendMessage}
													>
														Send
													</button>
												{:else}
													<!-- {#if messages.length > 0}
															<button on:click|preventDefault={handleReplyMessage}>Join</button>
														{/if} -->
													<button
														class="primary"
														disabled={user && !user.verified}
														on:click|preventDefault={selectedTab == 0 && messages.length > 0
															? handleReplyMessage
															: handleCreateRoom}>Send</button
													>
												{/if}
											</div>
										</form>
									</td>
								</tr>
							{/if}
						</table>
					</div>
					{#if !chatting}
						<div class="links">
							{#if messages.length > 0 && selectedTab == 0}
								<button
									class="link"
									on:click={() => {
										handleUserNeverAuthenticated();
									}}>{'Try another'}</button
								>
								<button
									class="link"
									on:click={() => {
										selectedTab = 1;
									}}>{'Start a new conversation'}</button
								>
							{:else if messages.length > 0}
								<button
									class="link"
									on:click={() => {
										handleUserNeverAuthenticated();
										selectedTab = 0;
									}}>{'Join a conversation'}</button
								>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<p>Loading...</p>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	$top-bar-height: 3.5rem;
	$top-bar: $top-bar-height - 2rem;
	$divider-height: 0.125rem;
	$menu-content-gap: 0.5rem;

	$top-menu-height-lg: 15rem;
	$top-menu-height-sm: 30rem;

	$header-height: $top-bar-height + $divider-height;
	$header-height-lg: $header-height + $top-menu-height-lg - $divider-height;
	$header-height-sm: $header-height + $top-menu-height-sm - $divider-height;

	$footer-height-lg: 8rem;
	$footer-height-sm: 12rem;

	.message-box {
		margin: 1rem 0;
		padding: 0 1rem;
		display: flex;
		align-items: flex-start;
		.message {
			flex-grow: 1;
			padding: 0.5rem;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 1rem;
		}
	}
	.warning {
		background-color: rgba(255, 234, 0, 0.25);
	}
	.error {
		// background-color: #ff440010;
		// background-color: #00ffdd40;
		color: #ff4400;
	}

	em {
		font-size: 0.75rem;
		white-space: nowrap;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		tr {
			td {
				padding: 0.5rem 2rem 0.5rem 0;
				vertical-align: top;
				word-wrap: break-word; /* This breaks words at the edge of the container */
				overflow-wrap: break-word; /* Alternative syntax */

				&.border-top {
					padding-top: 1rem;
				}

				&.message {
					padding-top: 0;
					padding-bottom: 0;
				}

				// &.chatting {
				// 	padding-top: 1.5rem;
				// }

				&.bottom-spacer {
					height: 160px;
				}

				&.less-padding {
					padding-top: 0;
				}
			}
			td:last-child {
				padding-right: 0;
			}

			&.border-top {
				box-shadow:
					inset 0 2px 0 #000000,
					inset 0 0px 0 #000000;
			}
		}
	}
	.user-name {
		white-space: nowrap;
		font-weight: bold;
	}
	.wrapper {
		position: relative;
	}
	.container {
		// background-color: var(--color-bg-0);
		padding: 0 2rem;
		max-width: 800px;
		margin: 0 auto;

		.tabs {
			position: absolute;
			top: -4rem;
			left: 0;
			height: 4rem;
			display: flex;
			width: 100%;

			.tab {
				background-color: rgb(230, 230, 230);
				display: flex;
				flex-grow: 1;
				// width: 50%;
				align-items: center;
				padding: 0 1.5rem;
				border: 1px solid var(--color-bg-0-dark);
				border-bottom: none;
				overflow: hidden;
				position: relative;
				top: 1px;
				z-index: 50;
				cursor: pointer;

				.label {
					font-weight: bold;
					white-space: nowrap;
					overflow: hidden;
				}

				&.hidden {
					z-index: 10;
					background-color: rgb(215, 215, 215);
				}
			}

			.tab.hidden:first-child {
				border-right: none;
			}
			.tab.hidden:last-child {
				border-left: none;
			}
		}

		.messages-wrapper {
			&.border {
				margin-top: 12rem;
				position: relative;
			}

			.links {
				margin-top: 2rem;
				display: flex;
				gap: 2rem;
			}

			.messages {
				// padding-bottom: 2rem;

				&.border {
					// background-color: rgb(230, 230, 230);
					// border: solid 1px var(--color-bg-0-dark);
					// padding: 1.5rem;
					// position: relative;
					// z-index: 25;

					textarea {
						background-color: white;
						height: 52px !important; // match button
						overflow-y: hidden;
					}

					button {
						height: 52px;
						width: 120px;
						max-width: 120px;
					}
				}
			}
		}
	}
	.top-overlay {
		position: sticky;
		top: $header-height;
		left: 0;
		right: 0;

		transition: top 0.1s;

		.leave-link-container {
			max-width: 800px;
			margin: 0 auto;
			display: flex;
			justify-content: flex-end;
			padding: 0 2rem;

			.button-container {
				padding-left: 1rem;
				padding-top: 1rem;
				padding-bottom: 1rem;
				background-color: var(--color-bg-0); /* 50% opacity */
				// backdrop-filter: blur(5px);
			}
		}
		.leave-form-container {
			max-width: 800px;
			margin: 0 auto;

			.backdrop {
				position: fixed;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				// background-color: rgba(14, 14, 14, 0.5);
				backdrop-filter: blur(5px);
				z-index: 200;
				cursor: pointer;
			}

			.menu-container {
				position: relative;
				z-index: 250;
				background-color: var(--color-bg-0-dark);
				height: 100%;
				margin: 0;
				padding: 2rem;
				// gap: 0.5rem;
				.menu-content {
					display: flex;
					flex-direction: column;
					gap: 2rem;

					.modal-close {
						position: absolute;
						top: 1rem;
						right: 1rem;
						min-width: 0;
						background: none;
						color: white;
						border: none;
						font-size: 1.5rem;
						cursor: pointer;
					}
					.button-group {
						display: flex;
						gap: 1rem;
						button {
							flex: 1;
							text-align: left;
						}
					}
					.menu-body {
						display: flex;
						flex-direction: column;
						gap: 2rem;
						p {
							color: white;
							margin: 0;
						}

						p:first-child {
							padding-right: 3rem;
						}
					}
				}
			}
		}

		&.menu-open {
			top: $header-height-lg;
		}
	}
	form {
		// padding-top: 2rem;
		// width: calc(100% + 1rem);
		width: 100%;
		display: flex;
		justify-content: flex-end;
		padding-bottom: 1rem;
		// gap: 1rem;

		position: relative;
		top: 0.125rem;

		&.left {
			left: -1rem;
			width: calc(100% + 1rem);
		}

		&.full {
			left: -1rem;
			width: calc(100vw - 1rem);
		}

		textarea {
			// height: 46px; // match button
			background-color: rgba(255, 255, 255, 0);
			height: 72px; // match button
			box-sizing: border-box;
			flex-grow: 1;
			padding: 1rem;
			border-radius: 0;
			border: 0;
			font-size: 1em;
			// resize: vertical; /* allows resizing only vertically */
			resize: none; /* allows resizing only vertically */
			outline: none; /* removes the default focus outline */
		}

		textarea::placeholder {
			color: #888; /* Set color */
			// font-size: 14px;     /* Set font size */
			// font-style: italic;  /* Set font style */
			// opacity: 1;          /* Adjust opacity if needed */
		}

		.buttonGroup {
			// height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: 0.5rem;

			&.float {
				position: absolute;
				right: 0;
				top: -46px;
			}

			button {
				padding-left: 2rem;
				padding-right: 2rem;
			}
		}
	}
	.grey {
		color: #777777;
	}

	tr.sticky {
		background-color: var(--color-bg-0);
		// background-color: white;
		// padding-top: 0.5rem;

		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;

		max-width: 800px;
		margin: 0 auto;

		// td {
		// 	padding-bottom: 2rem;
		// }
	}

	@media (max-width: 864px) {
		form {
			// .buttonGroup {
			// 	flex-direction: row;
			// }
		}
		tr.sticky {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}

	@media (max-width: 700px) {
		.top-overlay {
			&.menu-open {
				top: $header-height-sm;
			}
		}
	}

	@media (max-width: 600px) {
		table {
			tr {
				td:first-child {
					// padding-bottom: 0.5rem;
				}

				td {
					padding-top: 0.25rem;
					padding-bottom: 0.25rem;

					&.bottom-spacer {
						height: 100px;
					}
				}

				&.sticky {
					// padding-top: 1rem;
					// td:last-child {
					// 	padding-top: 0.5rem;
					// 	padding-bottom: 8rem;
					// }
				}

				&.column {
					display: flex;
					flex-direction: column;
				}
			}
		}
		form {
			gap: 0;
			.buttonGroup {
				flex-direction: row;

				button {
					padding-left: 2rem;
					padding-right: 3rem;
				}
			}
		}
	}

	@media (max-width: 500px) {
		.container {
			padding: 0 1rem; //
		}
		tr {
			&.sticky {
				padding-left: 1rem; //
				padding-right: 1rem; //
			}
		}
		.top-overlay {
			.leave-link-container {
				padding: 0 1rem; //
			}
			.leave-form-container {
				.menu-container {
					padding: 2rem 1rem; //

					.menu-content {
						.button-group {
							// flex-direction: column;
						}
					}
				}
			}
		}
		form {
			&.full {
				width: calc(100vw + 0.25rem);
			}
		}
		// table {
		// 	tr {
		// 		td {
		// 			&.message-top {
		// 				padding-top: 0.5rem;
		// 			}
		// 		}
		// 	}
		// }
	}
</style>
