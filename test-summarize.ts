async function test() {
    try {
        console.log('Loading @steipete/summarize...');
        // Note: The package might have different exports. Let's try to find the summarize function.
        const summarizePkg = await (eval('import("@steipete/summarize")'));
        console.log('Available exports:', Object.keys(summarizePkg));
        
        // Based on typical summarize libs, it might be a default or named export
        // Let's try a simple URL if we can find a summarize-like function
    } catch (error) {
        console.error('Error during summarize test:', error);
    }
}

test();
