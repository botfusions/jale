export function formatDateStart(date) {
    if (!date)
        return "";
    if (date.endsWith("Z"))
        return date;
    if (!date.includes("T"))
        return `${date}T00:00:00.000Z`;
    return date;
}
export function formatDateEnd(date) {
    if (!date)
        return "";
    if (date.endsWith("Z"))
        return date;
    if (!date.includes("T"))
        return `${date}T23:59:59.999Z`;
    return date;
}
//# sourceMappingURL=date.js.map