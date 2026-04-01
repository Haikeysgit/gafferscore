export async function measureServerTask<T>(
    label: string,
    task: () => Promise<T>
): Promise<T> {
    if (process.env.NODE_ENV === "production") {
        return task();
    }

    const start = Date.now();

    try {
        return await task();
    } finally {
        const duration = Date.now() - start;
        console.log(`[perf] ${label}: ${duration}ms`);
    }
}
