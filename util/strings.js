const truncateString = (str, lim) =>
    str.length > lim ? str.slice(0, lim > 3 ? lim - 3 : lim) + '...' : str;

module.exports = {
    truncateString
}