import TurndownService from 'turndown';
const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});
export function convertHtmlToMarkdown(html) {
    if (!html)
        return '';
    return turndown.turndown(html);
}
//# sourceMappingURL=html-to-markdown.js.map