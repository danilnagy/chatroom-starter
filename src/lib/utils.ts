import { get } from 'svelte/store';
import wordStore from './wordStore';

export function parseMessage(content: string): string {
    let parsedContent = content;
    const words = get(wordStore);

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