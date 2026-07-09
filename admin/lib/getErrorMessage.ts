import axios from 'axios';

export function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        return typeof message === 'string' && message.trim() ? message : fallback;
    }
    return error instanceof Error && error.message.trim() ? error.message : fallback;
}
