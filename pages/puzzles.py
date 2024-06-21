from dataclasses import dataclass
from flask import Blueprint, render_template, request, g
import sqlite3
from typing import List

from . import base

puzzles = Blueprint('puzzles', __name__, url_prefix='/puzzles', template_folder='../templates/puzzles')

def _get_puzzle_db():
    db = getattr(g, '_puzzle_data_db', None)
    if db is None:
        db = g._database = sqlite3.connect("db/puzzle-data.db")
    return db

@base.APP.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_puzzle_data_db', None)
    if db is not None:
        db.close()

def _get_word_query():
    return "SELECT word from words WHERE word LIKE ? ORDER BY word LIMIT ?"

# TODO -- update DB to support a simpler query
def _get_thesaurus_query():
    return """SELECT T.word, L.synonymList
FROM thesaurus T
JOIN thesaurus_lookup L
ON SUBSTR(T.synonymIds, 0, INSTR(T.synonymIds, ',')) = L.id
WHERE word LIKE ? ORDER BY word LIMIT ?
"""

def _get_crossword_question_query():
    return "SELECT clue || ' ⩥ ' || answer FROM crosswords WHERE clue LIKE ? ORDER BY clue LIMIT ?"

def _get_crossword_answer_query():
    return "SELECT clue || ' ⩥ ' || answer FROM crosswords WHERE answer LIKE ? ORDER BY answer LIMIT ?"

def _get_homophones_query():
    return "SELECT homophones FROM homophones WHERE UPPER(homophones) LIKE ? ORDER BY homophones LIMIT ?"

def _get_anagram_query(query):
    lookup = {}
    for character in query:
        if not character in lookup:
            lookup[character] = 0
        lookup[character] += 1
    
    sql_query = f'SELECT word FROM words WHERE (LENGTH(word) = {len(query)})'

    comparison = '>=' if '_' in query else '='
    for key in lookup.keys():
        value = lookup[key]
        if key != '_':
            sql_query += f" AND (LENGTH(word) - LENGTH(REPLACE(word, '{key}', '')) {comparison} {value})"

    return sql_query + ' LIMIT ?'

@dataclass
class Link:
    name: str
    link: str

@dataclass
class Reference:
    title: str
    links: List[Link]

references = [
    [
        Reference("Art", [
            Link("Lists of Celebrities", "https://en.wikipedia.org/wiki/Lists_of_celebrities")
            ]),
        Reference("Financial", [
            Link("NYSE Stock Listings", "https://www.nyse.com/listings_directory/stock")
            ]),
    ],
    [
        Reference("Geography", [
           Link("Countries", "https://en.wikipedia.org/wiki/List_of_sovereign_states"),
           Link("US States and Capitals", "https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States"),
           Link("Country Calling Codes", "https://en.wikipedia.org/wiki/List_of_country_calling_codes")
        ]),
        Reference("Science", [
            Link("Chemical Elements", "https://en.wikipedia.org/wiki/List_of_chemical_elements"),
            Link("Resistor Color Codes", "https://en.wikipedia.org/wiki/Electronic_color_code"),
        ]),
    ],
    [
        Reference("Codes", [
              Link("American Sign Language","https://upload.wikimedia.org/wikipedia/commons/d/d1/Asl_alphabet_gallaudet.png"), 
              Link("Braille", "https://www.pharmabraille.com/pharmaceutical-braille/the-braille-alphabet/"), 
              Link("Maritime Signal Flags", "https://en.wikipedia.org/wiki/International_maritime_signal_flags"),
              Link("NATO Phonetic Alphabet", "https://upload.wikimedia.org/wikipedia/commons/e/e0/FAA_Phonetic_and_Morse_Chart2.svg"),
              Link("Pigpen", "https://upload.wikimedia.org/wikipedia/commons/3/36/Pigpen_cipher_key.svg"),
              Link("Semaphore Flags", "https://en.wikipedia.org/wiki/Flag_semaphore"),
        ])
    ],
    [   
        Reference("Sports", [

            Link("Sports teams in US and Canada", "https://en.wikipedia.org/wiki/List_of_professional_sports_teams_in_the_United_States_and_Canada"),
            Link("Football teams in US and Canada", "https://en.wikipedia.org/wiki/National_Football_League"),
            Link("Soccer clubs in England", "https://en.wikipedia.org/wiki/List_of_football_clubs_in_England"),
        ])
    ]
]

@puzzles.route("/")
def puzzles_page():
    return render_template("puzzles.html", references=references)

def _generate_textarea(id, items, limit):
    prefix = f'<textarea id="{id}" readonly>'
    limitText = ' (Limited!)' if len(items) == limit else ''
    postfix = f'</textarea><small>{len(items)}{limitText}</small>'
    return prefix + '\n'.join(items) + postfix

@puzzles.route("/crossword", methods=['POST'])
def puzzles_crossword_querty():
    query = request.form.get("crosswordQuery").upper()

    limit = 200
    questions = [word[0] for word in _get_puzzle_db()
            .execute(_get_crossword_question_query(), [query, limit])]
    answers = [word[0] for word in _get_puzzle_db()
            .execute(_get_crossword_answer_query(), [query, limit])]

    questions_block = _generate_textarea("questions", questions, limit)
    answers_block = _generate_textarea("answers", answers, limit)
    return f'<fieldset id="foundCrossword"><label>Clues{questions_block}</label>' + \
        f'<label>Answers{answers_block}</label></fieldset>'

@puzzles.route("/wordsExtra", methods=['POST'])
def puzzles_extra_query():
    query = request.form.get('wordExtraQuery').upper()
    extraChoice = request.form.get('extraChoice')

    limit = 200
    if extraChoice == 'Thesaurus':
        words = [f'{word[0]} -> {word[1]}' for word in _get_puzzle_db()
                 .execute(_get_thesaurus_query(), [query, limit])]
    else:
        words = [word[0] for word in _get_puzzle_db()
                .execute(_get_homophones_query(), [f'{query}%', limit])]
        
    return _generate_textarea("resultingExtraWords", words, limit)

@puzzles.route("/words", methods=['POST'])
def puzzles_word_query():
    query = request.form.get("wordQuery").upper()
    anagrams = request.form.get("anagrams") is not None

    limit = 200
    if anagrams:
        words = [word[0] for word in _get_puzzle_db()
                 .execute(_get_anagram_query(query), [limit])]
    else:
        words = [word[0] for word in _get_puzzle_db()
                .execute(_get_word_query(), [query, limit])]

    return _generate_textarea("resultingWords", words, limit)
