export function parseMessage(content: string, words: { [s: string]: string; }): string {
    let parsedContent = content;

    for (const [phrase, url] of Object.entries(words)) {
        // Use a case-insensitive regular expression
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        parsedContent = parsedContent.replace(regex, `<a href="${url}" target="_blank">${phrase}</a>`);
    }

    return parsedContent;
}

export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

export function formatTimeDifference(timestamp: number): string {
    const now = Date.now();
    const difference = now - timestamp;

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return seconds > 0 ? `${seconds} second${seconds > 1 ? 's' : ''} ago` : 'now';
    }
}

/**
 * Utility function to remove HTML tags from a string
 * @param input - The input string to be cleaned
 * @returns The cleaned string with HTML tags removed
 */
export function removeHtmlTags(input: string): string {
    const div = document.createElement('div');
    div.innerHTML = input;
    return div.textContent || div.innerText || '';
}

export function reloadPage(delay: number = 0) {
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            window.location.reload();
        }, delay);
    }
}
