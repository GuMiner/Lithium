def get_word_query():
    return "SELECT word from words WHERE word LIKE ? ORDER BY word LIMIT ?"

def get_anagram_query(query):
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