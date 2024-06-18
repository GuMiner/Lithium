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

    pending_urls = [start_url]
    scanned_urls = set()
    while any(pending_urls):
        # Run slightly slower 
        time.sleep(0.05)

        to_scan_url = pending_urls.pop()
        print(to_scan_url)
        
        if not to_scan_url.startswith(start_url):
            print('  Skipping...')
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
                    pending_urls.append(link)
