import "../scss/index.css";
import 'htmx.org';

function getById(id: string) {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input == null) {
        throw new Error("Expected a non-null element. Developer bug.");
    }

    return input.value;
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

(window as any).convertNumbers = convertNumbers;
/*
class EquationSolverModel {
    input: ko.Observable<string>

    delimiter: ko.Observable<string>
    inputBase: ko.Observable<string>

    output: ko.PureComputed<string>

    constructor() {
        this.input = ko.observable("");
        this.delimiter = ko.observable(" ");
        this.inputBase = ko.observable("10");

        this.output = ko.pureComputed(() => {
            let outputString = "";

            let base = parseInt(this.inputBase());
            let delimiter = this.delimiter();
            let parts = this.input().split(delimiter);
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

            return outputString;
        });
    }
}*/