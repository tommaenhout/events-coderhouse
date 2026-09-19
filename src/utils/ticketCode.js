const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateTicketCode(length = 8) {
    const characters = [];
    for(let i = 0; i < length; i++){
        characters.push(ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length)));
    }
    return 'TCK-' + characters.join('');
}