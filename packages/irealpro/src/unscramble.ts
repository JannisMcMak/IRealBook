export function unscramble(s: string): string {
    let r = "";
    let p = "";

    while (s.length > 50) {
        p = s.substring(0, 50);
        s = s.substring(50);
        if (s.length < 2) {
            r = r + p;
        } else {
            r = r + obfusc50(p);
        }
    }
    r = r + s;
    // Now undo substitution obfuscation
    r = r.replace(/Kcl/g, "| x").replace(/LZ/g, " |").replace(/XyQ/g, "   ");
    return r;
}

function obfusc50(s: string): string {
    if (s.length !== 50) {
        return s;
    }

    // The first 5 characters are switched with the last 5
    let newString = s.split("");
    for (let i = 0; i < 5; i++) {
        newString[49 - i] = s[i] as string;
        newString[i] = s[49 - i] as string;
    }
    // Characters 10-24 are also switched
    for (let i = 10; i < 24; i++) {
        newString[49 - i] = s[i] as string;
        newString[i] = s[49 - i] as string;
    }
    return newString.join("");
}
