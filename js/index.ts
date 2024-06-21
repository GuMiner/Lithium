import "../scss/index.css";
import 'htmx.org';

function getById(id: string) {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input == null) {
        throw new Error("Expected a non-null element. Developer bug.");
    }

    return input.value;
}

function isChecked(id: string) {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input == null) {
        throw new Error("Expected a non-null element. Developer bug.");
    }

    return input.checked;
}

// Swap from light to dark mode on-demand
var isDarkMode = null;
function toggleTheme() {
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'light')
        window.localStorage.setItem("lithiumTheme", "1");

        document.getElementById("themeToggle").textContent = "Dark Mode";
    } else {
        document.documentElement.setAttribute('data-theme', 'dark')
        window.localStorage.setItem("lithiumTheme", "0");

        document.getElementById("themeToggle").textContent = "Light Mode";
    }

    isDarkMode = !isDarkMode;
}

function convertNumbers() {   
    let outputString = "";

    let baseStr = getById('inputBase');
    if (baseStr.length == 0) {
        baseStr = "10";
    }

    let base = parseInt(baseStr);
    
    let delimiter = getById('inputDelimiter');
    if (delimiter.length == 0) {
        delimiter = " ";
    }

    let parts = getById('numbersToConvert').split(delimiter);
    for (var j = 2; j <= 36; j++) {
        // Header
        let convertedNumbers = "(" + j + ") ";
        if (j < 10) {
            convertedNumbers += " ";
        }

        // Convert values (read as base, output to base 'j')
        for (var i = 0; i < parts.length; i++) {
            let number = parseInt(parts[i], base);
            convertedNumbers += (number.toString(j) + delimiter);
        }

        outputString += convertedNumbers + "\r\n";
    }

    document.getElementById('convertedNumbers').textContent = outputString;
}

function convertSubstituteNumbers() {
    let input = getById('numbersToConvertSubst');
    let delimiter = getById('inputDelimiterSubst');
    if (delimiter.length == 0) {
        delimiter = ' ';
    }

    let rotateValue = getById('rotateAmount');
    if (rotateValue.length == 0) {
        rotateValue = '13';
    }
    
    let morseDot = getById('MorseDot');
    if (morseDot.length == 0) {
        morseDot = '.';
    }
    let morseDash = getById('MorseDash');
    if (morseDash.length == 0) {
        morseDash = '-';
    }

    let outputString = "";
    let parts = input.split(delimiter);
    if (isChecked('AZConvertSubst')) {
        outputString += letterToNumber(parts) + "\r\n";
    }

    if (isChecked('rotateSubst')) {
        (document.getElementById('rotateAmount') as HTMLInputElement).disabled = false;
        outputString += rot13(parts, rotateValue) + "\r\n";
    } else {
        (document.getElementById('rotateAmount') as HTMLInputElement).disabled = true;
    }

    if (isChecked('ASCIIConvertSubst')) {
        outputString += numberToAscii(parts) + "\r\n";
    }

    if (isChecked('MorseConvertSubst')) {
        (document.getElementById('MorseDot') as HTMLInputElement).disabled = false;
        (document.getElementById('MorseDash') as HTMLInputElement).disabled = false;
        outputString += convertMorse(parts, morseDot, morseDash) + "\r\n";
    } else {
        (document.getElementById('MorseDot') as HTMLInputElement).disabled = true;
        (document.getElementById('MorseDash') as HTMLInputElement).disabled = true;
    }

    document.getElementById('convertedNumbersSubst').textContent = outputString;
}

function letterToNumber(parts: string[]): string {
    let a1z26String = "";
    for (let i = 0; i < parts.length; i++) {
        let integer = (parseInt(parts[i]) - 1) % 26;
        if (isNaN(integer)) {
            a1z26String += parts[i];
        } else {
            a1z26String += String.fromCharCode(65 + integer);
        }

        a1z26String += " ";
    }

    return a1z26String;
}

function rot13(parts: string[], rotateAmount: string): string {
    let rot13String = "";
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].length == 1) {
            let charValue = parts[i].toUpperCase().charCodeAt(0)
            charValue += parseInt(rotateAmount);
            if (charValue > "Z".charCodeAt(0)) {
                charValue -= 26;
            }

            rot13String += String.fromCharCode(charValue);
        } else {
            rot13String += parts[i];
        }

        rot13String += " ";
    }

    return rot13String;
}

function numberToAscii(parts: string[]): string {
    let asciiString = "";
    for (var i = 0; i < parts.length; i++) {
        let integer = parseInt(parts[i]);
        if (isNaN(integer)) {
            asciiString += parts[i];
        } else {
            asciiString += String.fromCharCode(integer);
        }

        asciiString += " ";
    }

    return asciiString;
}

function convertMorse(parts: string[], dotChar: string, dashChar: string): string {
    let morseString = "";
    for (var i = 0; i < parts.length; i++) {
        let letter = parseMorseCharacter(parts[i], dotChar, dashChar);
        morseString += letter;
    }

    return morseString;
}

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function parseMorseCharacter(character: string, dotChar: string, dashChar: string): string {
    // From https://en.wikipedia.org/wiki/Morse_code#/media/File:International_Morse_Code.svg

    let dotCharRegex = new RegExp(escapeRegExp(dotChar), "g");
    let dashCharRegex = new RegExp(escapeRegExp(dashChar), "g");
    let normalizedCharacter = character.replace(dotCharRegex, ".").replace(dashCharRegex, "-");
    switch (normalizedCharacter) {
        case ".-": return "A";
        case "-...": return "B";
        case "-.-.": return "C";
        case "-..": return "D";
        case ".": return "E";
        case "..-.": return "F";
        case "--.": return "G";
        case "....": return "H";
        case "..": return "I";
        case ".---": return "J";
        case "-.-": return "K";
        case ".-..": return "L";
        case "--": return "M";
        case "-.": return "N";
        case "---": return "O";
        case ".--.": return "P";
        case "--.-": return "Q";
        case ".-.": return "R";
        case "...": return "S";
        case "-": return "T";
        case "..-": return "U";
        case "...-": return "V";
        case ".--": return "W";
        case "-..-": return "X";
        case "-.--": return "Y";
        case "--..": return "Z";
        case ".----": return "1";
        case "..---": return "2";
        case "...--": return "3";
        case "....-": return "4";
        case ".....": return "5";
        case "-....": return "6";
        case "--...": return "7";
        case "---..": return "8";
        case "----.": return "9";
        case "-----": return "0";
        default: return "?";
    }
}

(window as any).convertNumbers = convertNumbers;
(window as any).convertSubstituteNumbers = convertSubstituteNumbers;
(window as any).toggleTheme = toggleTheme;

window.addEventListener('load', () =>
{    
    // Figure out the current theme for the button text
    var buttonTitle = "Dark Mode";
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDarkMode = true;
        buttonTitle = "Light Mode";
    } else {
        isDarkMode = false;
    }
    document.getElementById("themeToggle").textContent = buttonTitle;

    var theme = window.localStorage.getItem("lithiumTheme")
    if ((theme == "0" && !isDarkMode) || (theme == "1" && isDarkMode))
    {
        // Use saved settings to reset theme
        toggleTheme();
    }
});