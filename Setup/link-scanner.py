import os
from pathlib import Path
import re
import requests
import time
from typing import List

def _find_links(text: str) -> List[str]:
    links = []
    for line in text.splitlines():
        if 'href' in line:
            matches = re.findall(r'href="([^"]*)"', line)
            for link in matches:
                links.append(link)
    
    return links

# Scans the website and verifies there are no dead links
if __name__ == "__main__":
    start_url = 'http://127.0.0.1:5000'

    pending_urls = set([start_url])
    scanned_urls = set()
    external_links = set()
    while any(pending_urls):
        # Run slightly slower 
        time.sleep(0.01)

        to_scan_url = pending_urls.pop()
        print(to_scan_url)
        
        if not to_scan_url.startswith(start_url):
            print('  Skipping...')
            external_links.add(to_scan_url)
            continue

        response = requests.get(to_scan_url)
        print(f'  {response.status_code}')
        scanned_urls.add(to_scan_url)
        
        if not response.status_code == 200:
            print('Error: dead link!')
            exit(1)
        else:
            links = _find_links(response.text)
            print(f'  {len(links)} links')

            added_links = 0
            for link in links:
                if link.startswith('http:') or link.startswith('https:'):
                    # Absolute link, will be likely skipped later
                    pass
                elif link.startswith('/'):
                    # Page root link
                    link = f'{start_url}{link}'
                else:
                    # Page relative link
                    link = f'{to_scan_url}/{link}'

                if link not in scanned_urls:
                    pending_urls.add(link)
                    added_links += 1
            
            print(f'    {added_links} added to scan')
    
    print(f'Scanned links: {len(scanned_urls)}')
    print(f'External links: {len(external_links)}')

    check_external_links = True
    if check_external_links:
        
        script_path = os.path.abspath(os.path.dirname(__file__))
        file_path = Path(os.path.join(script_path, 'valid-external-links.txt'))
        skippable = file_path.read_text().splitlines()
        for link in external_links:
            # No need to run slower here, querying the actual internet takes longer than a local dev site.
            print(link)
            if link in skippable:
                print('  Skipping...')
                continue

            headers = {
                # Necessary as some sites detect the default Python requests user agent and think this is otherwise a bot.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'
            }
            response = requests.get(link, headers=headers)
            print(f'  {response.status_code}')
            if not response.status_code == 200:
                print('Error: dead link!')
                exit(1)
            else:
                skippable.append(link)
                # Somewhat inefficient to write every time, but the performance is negligible compared to the network query time.
                file_path.write_text('\n'.join(skippable))